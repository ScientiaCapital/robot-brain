import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { neon } from '@neondatabase/serverless';
import { ROBOT_PERSONALITIES } from '@/lib/robot-config';

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
  try {
    const { message, personality = 'robot-friend', sessionId = 'default' } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get robot configuration
    const robot = ROBOT_PERSONALITIES[personality as keyof typeof ROBOT_PERSONALITIES];
    if (!robot) {
      return NextResponse.json({ error: 'Invalid personality' }, { status: 400 });
    }

    // Get or create conversation history
    const history = conversationHistory.get(sessionId) || [];
    
    // Add user message to history
    history.push({ role: 'user', content: message });

    // Create messages array for Anthropic
    const messages = history.map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content
    }));

    // Send message to Anthropic
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 150,
      temperature: 0.7,
      system: robot.systemPrompt,
      messages: messages
    });

    const responseText = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';

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
          ${sessionId},
          ${personality},
          ${message},
          ${responseText},
          NOW()
        )
      `;
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Continue even if DB fails
    }

    return NextResponse.json({
      message: responseText,
      personality: personality,
      emoji: robot.emoji,
      name: robot.name,
      sessionId: sessionId
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}