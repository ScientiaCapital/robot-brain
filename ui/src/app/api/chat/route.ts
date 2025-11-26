import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getConfiguredRobot } from '@/lib/robot-config';
import { getAgentConfig } from '@/lib/config';
import { schemas, sanitizeInput, validateSessionId, checkRateLimit, getClientIP } from '@/lib/validation';
import { responseCache, logCachePerformance } from '@/lib/response-cache';
import { databaseServices } from '@/lib/database/enhanced-schema-service';

// Initialize Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// For now, we'll use in-memory session storage
// This is backed up by Supabase for persistence
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

    // Get optional fields from body that might not be in the schema
    const userId = body.userId;
    const agentId = body.agentId;

    // Sanitize input
    const sanitizedMessage = sanitizeInput(message);
    const validatedSessionId = validateSessionId(sessionId);

    // Get robot configuration from config system
    const robot = getConfiguredRobot();
    const agentConfig = getAgentConfig();

    // If agentId is provided, try to get agent from database
    let selectedAgent = null;
    if (agentId) {
      try {
        selectedAgent = await databaseServices.agents.findById(agentId);
      } catch (error) {
        console.warn('Failed to fetch agent from database:', error);
      }
    }

    // Use agent configuration if available, otherwise fall back to robot config
    const systemPrompt = selectedAgent?.system_prompt || robot.systemPrompt;
    const agentName = selectedAgent?.name || robot.name;
    const agentEmoji = '🤖'; // Could be selectedAgent?.avatar_url || robot.emoji;

    // Check cache first
    const cacheKey = responseCache.generateKey({ message: sanitizedMessage, personality });
    const cachedResponse = responseCache.get(cacheKey);
    if (cachedResponse) {
      const responseTime = Date.now() - startTime;
      console.log(`[Cache Hit] Response time: ${responseTime}ms`);

      return NextResponse.json({
        message: cachedResponse,
        personality: personality,
        emoji: agentEmoji,
        name: agentName,
        sessionId: sessionId,
        cached: true,
        responseTime: responseTime,
        agentId: selectedAgent?.id
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

    // Enhance system prompt with capabilities
    let enhancedSystemPrompt = systemPrompt + "\n\nIMPORTANT: Keep responses under 2 sentences. Be concise and clear.";

    // Add API integration capabilities to system prompt
    enhancedSystemPrompt += `

You have access to the following capabilities:
- Code execution via E2B sandbox (for Python, JavaScript, TypeScript)
- Real-time documentation lookup via Context7
- Voice conversation capabilities via Cartesia TTS

When users ask about coding or need code examples, you can execute code safely.
When users ask about API documentation or library usage, you can look up current documentation.
Keep responses helpful and actionable.`;

    // Send message to Anthropic using configured settings
    const response = await anthropic.messages.create({
      model: agentConfig.modelSettings.model,
      max_tokens: agentConfig.modelSettings.maxTokens,
      temperature: agentConfig.modelSettings.temperature,
      system: enhancedSystemPrompt,
      messages: messages
    });

    const responseText = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    // Cache the response
    responseCache.set(cacheKey, responseText);

    // Add assistant response to history
    history.push({ role: 'assistant', content: responseText });

    // Store updated history
    conversationHistory.set(sessionId, history);

    // Store in Supabase (non-blocking)
    databaseServices.conversations.create({
      session_id: validatedSessionId,
      robot_personality: personality,
      user_message: sanitizedMessage,
      robot_response: responseText,
      metadata: {
        agentId: selectedAgent?.id,
        userId: userId,
        model: agentConfig.modelSettings.model
      }
    }).catch(dbError => {
      console.error('Database error (non-blocking):', dbError);
    });

    const responseTime = Date.now() - startTime;
    console.log(`[API Response] Time: ${responseTime}ms`);

    // Log cache performance every 10 requests
    if (Math.random() < 0.1) {
      logCachePerformance();
    }

    return NextResponse.json({
      message: responseText,
      personality: personality,
      emoji: agentEmoji,
      name: agentName,
      sessionId: sessionId,
      cached: false,
      responseTime: responseTime,
      agentId: selectedAgent?.id,
      capabilities: {
        codeExecution: true,
        documentationLookup: true,
        voiceConversation: true
      }
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
