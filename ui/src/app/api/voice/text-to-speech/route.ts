import { NextRequest, NextResponse } from 'next/server';
import { schemas, checkRateLimit, getClientIP } from '@/lib/validation';
import { getAgentConfig } from '@/lib/config';

// Cartesia API endpoint
const CARTESIA_API_URL = 'https://api.cartesia.ai/tts/bytes';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Rate limiting
    const ip = getClientIP(request);
    if (!checkRateLimit(ip, 30, 60000)) { // 30 requests per minute for TTS
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Parse and validate input
    const body = await request.json();
    const validationResult = schemas.ttsRequest.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Invalid input',
        details: validationResult.error.issues.map(i => i.message)
      }, { status: 400 });
    }

    const { text, voiceId: requestVoiceId } = validationResult.data;

    // Get voice configuration from agent config
    const config = getAgentConfig();
    const voiceId = requestVoiceId || config.voiceId;
    const voiceSettings = config.voiceSettings;

    // Check for API key
    const apiKey = process.env.CARTESIA_API_KEY;
    if (!apiKey) {
      console.error('CARTESIA_API_KEY not configured');
      return NextResponse.json(
        { error: 'Voice service not configured' },
        { status: 503 }
      );
    }

    // Call Cartesia API
    const response = await fetch(CARTESIA_API_URL, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Cartesia-Version': '2024-06-10',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_id: voiceSettings.model || 'sonic-2',
        transcript: text,
        voice: {
          mode: 'id',
          id: voiceId,
        },
        language: voiceSettings.language || 'en',
        output_format: {
          container: 'mp3',
          sample_rate: voiceSettings.sampleRate || 44100,
          bit_rate: 128000,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cartesia API error:', response.status, errorText);

      // Handle specific error codes
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Voice service authentication failed' },
          { status: 503 }
        );
      }
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Voice service rate limit exceeded' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: `Voice generation failed: ${response.status}` },
        { status: response.status }
      );
    }

    // Get the audio data
    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      audio: audioBase64,
      contentType: 'audio/mpeg',
      model: voiceSettings.model || 'sonic-2',
      latency: `${processingTime}ms`,
      chunkSize: audioBuffer.byteLength,
    });

  } catch (error) {
    console.error('TTS API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to generate speech: ${message}` },
      { status: 500 }
    );
  }
}
