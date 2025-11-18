import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { neon } from '@neondatabase/serverless';
import { getConfiguredRobot } from '@/lib/robot-config';
import { getAgentConfig } from '@/lib/config';
import { schemas, sanitizeInput, validateSessionId, checkRateLimit, getClientIP } from '@/lib/validation';

// Initialize Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Lazy database connection
let sql: ReturnType<typeof neon> | null = null;

function getConnection() {
  if (!sql) {
    const connectionString = process.env.NEON_DATABASE_URL;
    if (!connectionString) {
      throw new Error('No database connection string found.');
    }
    sql = neon(connectionString);
  }
  return sql;
}

// Load conversation history from database
async function loadConversationHistory(sessionId: string, limit: number = 10): Promise<Array<{role: string, content: string}>> {
  try {
    const sql = getConnection();
    const result = await sql`
      SELECT user_message, robot_response, created_at
      FROM conversations
      WHERE session_id = ${sessionId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    const messages: Array<{role: string, content: string}> = [];
    for (const row of result.reverse()) {
      messages.push({ role: 'user', content: row.user_message });
      messages.push({ role: 'assistant', content: row.robot_response });
    }

    return messages;
  } catch (error) {
    console.error('Failed to load conversation history:', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Rate limiting
    const ip = getClientIP(request);
    if (!checkRateLimit(ip, 20, 60000)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse and validate input
    const body = await request.json();
    const validationResult = schemas.chatRequest.safeParse(body);

    if (!validationResult.success) {
      return new Response(JSON.stringify({
        error: 'Invalid input',
        details: validationResult.error.issues.map(i => i.message)
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { message, personality, sessionId = 'default' } = validationResult.data;

    // Sanitize input
    const sanitizedMessage = sanitizeInput(message);
    const validatedSessionId = validateSessionId(sessionId);

    // Get robot configuration
    const robot = getConfiguredRobot();
    const agentConfig = getAgentConfig();

    // Load conversation history
    const history = await loadConversationHistory(validatedSessionId, 10);
    history.push({ role: 'user', content: sanitizedMessage });

    // Create messages array for Anthropic
    const messages = history.map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content
    }));

    // Enhanced system prompt
    const enhancedSystemPrompt = robot.systemPrompt + "\n\nIMPORTANT: Keep responses under 2 sentences. Be concise and clear.";

    // Create streaming response
    const encoder = new TextEncoder();
    let fullResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stream from Anthropic
          const response = await anthropic.messages.create({
            model: agentConfig.modelSettings.model,
            max_tokens: agentConfig.modelSettings.maxTokens,
            temperature: agentConfig.modelSettings.temperature,
            system: enhancedSystemPrompt,
            messages: messages,
            stream: true,
          });

          // Send metadata first
          const metadata = {
            type: 'metadata',
            personality: personality,
            emoji: robot.emoji,
            name: robot.name,
            sessionId: sessionId,
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(metadata)}\n\n`));

          // Stream text chunks
          for await (const event of response) {
            if (event.type === 'content_block_delta') {
              const delta = event.delta;
              if ('text' in delta) {
                fullResponse += delta.text;
                const chunk = {
                  type: 'text',
                  content: delta.text,
                };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
              }
            }
          }

          // Store in database
          try {
            const sql = getConnection();
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
                ${fullResponse},
                NOW()
              )
            `;
          } catch (dbError) {
            console.error('Database error:', dbError);
          }

          // Send completion event
          const completion = {
            type: 'done',
            responseTime: Date.now() - startTime,
            fullResponse: fullResponse,
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(completion)}\n\n`));

          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          const errorEvent = {
            type: 'error',
            message: 'Streaming failed',
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat stream API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process chat message' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
