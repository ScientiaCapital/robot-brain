import { NextRequest, NextResponse } from 'next/server';
import { schemas, checkRateLimit, getClientIP } from '@/lib/validation';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// Voice IDs for our robot personality
const ROBOT_VOICES = {
  'robot-friend': '21m00Tcm4TlvDq8ikWAM', // Rachel - warm, friendly
};

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

    const { text, personality } = validationResult.data;

    const voiceId = ROBOT_VOICES[personality as keyof typeof ROBOT_VOICES] || ROBOT_VOICES['robot-friend'];

    // Call ElevenLabs API with optimized settings
    const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_flash_v2_5', // Low latency model (~75ms)
        voice_settings: {
          stability: 0.5, // More natural variation
          similarity_boost: 0.8, // Maintain voice character
          style: 0.0, // Natural style
          use_speaker_boost: true, // Enhanced clarity
        },
        // Speed removed - using default for optimal performance
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
      model: 'eleven_flash_v2_5',
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