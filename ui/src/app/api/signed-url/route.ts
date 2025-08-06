import { NextResponse } from 'next/server';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const AGENT_ID = process.env.ELEVENLABS_AGENT_ID || 'Xb7hH8MSUJpSbSDYk0k2'; // Default to a test agent

export async function GET() {
  try {
    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      );
    }

    // Get signed URL from ElevenLabs
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${AGENT_ID}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('ElevenLabs API error:', error);
      return NextResponse.json(
        { error: 'Failed to get signed URL' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      signedUrl: data.signed_url,
      agentId: AGENT_ID
    });

  } catch (error) {
    console.error('Signed URL API error:', error);
    return NextResponse.json(
      { error: 'Failed to get signed URL' },
      { status: 500 }
    );
  }
}