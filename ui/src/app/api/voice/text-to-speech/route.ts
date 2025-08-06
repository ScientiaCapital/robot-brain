import { NextRequest, NextResponse } from 'next/server';
import { schemas, checkRateLimit, getClientIP } from '@/lib/validation';
import { getAgentConfig } from '@/lib/config';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

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

    // Call ElevenLabs API with optimized settings
    const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: config.voiceSettings.model,
        voice_settings: {
          stability: config.voiceSettings.stability,
          similarity_boost: config.voiceSettings.similarityBoost,
          style: config.voiceSettings.style,
          use_speaker_boost: config.voiceSettings.useSpeakerBoost,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('ElevenLabs API error:', errorData);
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
      model: config.voiceSettings.model,
      latency: `${processingTime}ms`,
      chunkSize: text.length,
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