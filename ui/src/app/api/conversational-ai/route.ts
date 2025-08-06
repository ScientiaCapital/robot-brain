import { NextRequest, NextResponse } from 'next/server';
import { VoiceSessionService, databaseServices } from '@/lib/database/enhanced-schema-service';
import { getClientIP, checkRateLimit, sanitizeInput } from '@/lib/validation';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Rate limiting
    const ip = getClientIP(request);
    if (!checkRateLimit(ip, 10, 60000)) { // 10 requests per minute for ConvAI
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Parse and validate input
    const body = await request.json();
    const { action, sessionId, userId, agentId, data } = body;

    // Sanitize inputs
    const sanitizedData = data ? sanitizeInput(JSON.stringify(data)) : null;

    switch (action) {
      case 'start_session':
        // Create new voice session
        const session = await VoiceSessionService.create({
          user_id: userId,
          agent_id: agentId,
          session_token: sessionId,
          voice_provider: 'elevenlabs',
          language_code: 'en-US',
          audio_format: 'pcm_44100',
          conversation_mode: 'continuous',
          transcript: [],
          audio_urls: [],
          total_duration_seconds: 0,
          word_count: 0,
          interruption_count: 0,
          sentiment_analysis: {},
          quality_metrics: {},
          cost: 0
        });

        return NextResponse.json({
          success: true,
          sessionId: session.id,
          message: 'Conversational AI session started',
          responseTime: Date.now() - startTime
        });

      case 'update_transcript':
        if (!sessionId || !sanitizedData) {
          return NextResponse.json({ error: 'Missing session ID or transcript data' }, { status: 400 });
        }

        const transcriptEntry = JSON.parse(sanitizedData);
        await VoiceSessionService.updateTranscript(sessionId, transcriptEntry);

        return NextResponse.json({
          success: true,
          message: 'Transcript updated',
          responseTime: Date.now() - startTime
        });

      case 'end_session':
        if (!sessionId) {
          return NextResponse.json({ error: 'Missing session ID' }, { status: 400 });
        }

        const metrics = sanitizedData ? JSON.parse(sanitizedData) : undefined;
        await VoiceSessionService.endSession(sessionId, metrics);

        return NextResponse.json({
          success: true,
          message: 'Conversational AI session ended',
          responseTime: Date.now() - startTime
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Conversational AI API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to process conversational AI request: ${message}` },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get session status
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session ID' }, { status: 400 });
    }

    // For now, return a basic status check
    // In production, you'd query the actual session status
    return NextResponse.json({
      sessionId,
      status: 'active',
      provider: 'elevenlabs',
      conversationMode: 'continuous'
    });

  } catch (error) {
    console.error('Conversational AI status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check session status' },
      { status: 500 }
    );
  }
}