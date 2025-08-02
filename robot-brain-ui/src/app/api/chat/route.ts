import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { neon } from '@neondatabase/serverless';
import { ROBOT_PERSONALITIES } from '@/lib/robot-config';
import { schemas, sanitizeInput, validateSessionId, checkRateLimit, getClientIP } from '@/lib/validation';
import { responseCache, logCachePerformance } from '@/lib/response-cache';

// Initialize Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Initialize Neon
const sql = neon(process.env.NEON_DATABASE_URL!);

// For now, we'll use in-memory session storage
// In production, this would use Neon PostgreSQL
const conversationHistory = new Map<string, Array<{role: string, content: string}>>();

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Rate limiting
    const ip = getClientIP(request);
    if (!checkRateLimit(ip, 20, 60000)) { // 20 requests per minute
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Parse and validate input
    const body = await request.json();
    const validationResult = schemas.chatRequest.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid input',
        details: validationResult.error.issues.map(i => i.message)
      }, { status: 400 });
    }

    const { message, personality, sessionId = 'default' } = validationResult.data;
    
    // Sanitize input
    const sanitizedMessage = sanitizeInput(message);
    const validatedSessionId = validateSessionId(sessionId);

    // Get robot configuration
    const robot = ROBOT_PERSONALITIES[personality as keyof typeof ROBOT_PERSONALITIES];
    if (!robot) {
      return NextResponse.json({ error: 'Invalid personality' }, { status: 400 });
    }

    // Check cache first
    const cachedResponse = responseCache.get(message, personality);
    if (cachedResponse) {
      const responseTime = Date.now() - startTime;
      console.log(`[Cache Hit] Response time: ${responseTime}ms`);
      
      return NextResponse.json({
        message: cachedResponse,
        personality: personality,
        emoji: robot.emoji,
        name: robot.name,
        sessionId: sessionId,
        cached: true,
        responseTime: responseTime
      });
    }

    // Get or create conversation history
    const history = conversationHistory.get(sessionId) || [];
    
    // Add user message to history (using sanitized message)
    history.push({ role: 'user', content: sanitizedMessage });

    // Create messages array for Anthropic
    const messages = history.map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content
    }));

    // Send message to Anthropic
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 100,
      temperature: 0.3,
      system: robot.systemPrompt + "\n\nIMPORTANT: Keep responses under 2 sentences. Be concise and clear.",
      messages: messages
    });

    const responseText = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';

    // Cache the response
    responseCache.set(message, personality, responseText);

    // Add assistant response to history
    history.push({ role: 'assistant', content: responseText });
    
    // Store updated history
    conversationHistory.set(sessionId, history);

    // Store in Neon PostgreSQL
    try {
      await sql`
        INSERT INTO conversations (
          session_id,
          robot_personality,
          user_message,
          robot_response,
          created_at
        ) VALUES (
          ${validatedSessionId},
          ${personality},
          ${sanitizedMessage},
          ${responseText},
          NOW()
        )
      `;
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Continue even if DB fails
    }

    const responseTime = Date.now() - startTime;
    console.log(`[API Response] Time: ${responseTime}ms`);
    
    // Log cache performance every 10 requests
    if (Math.random() < 0.1) {
      logCachePerformance();
    }

    return NextResponse.json({
      message: responseText,
      personality: personality,
      emoji: robot.emoji,
      name: robot.name,
      sessionId: sessionId,
      cached: false,
      responseTime: responseTime
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}