import { NextRequest, NextResponse } from 'next/server';

interface ElevenLabsValidationResponse {
  valid: boolean;
  connected: boolean;
  error?: string;
  apiKeyConfigured: boolean;
  testResult?: {
    voicesAvailable: number;
    subscriptionTier?: string;
    charactersAvailable?: number;
  };
  responseTime: number;
  timestamp: string;
}

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Check if API key is configured
    const apiKeyConfigured = !!process.env.ELEVENLABS_API_KEY;
    
    if (!apiKeyConfigured) {
      return NextResponse.json({
        valid: false,
        connected: false,
        apiKeyConfigured: false,
        error: 'ELEVENLABS_API_KEY environment variable not configured',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      } as ElevenLabsValidationResponse, { status: 500 });
    }
    
    // Validate API key format (ElevenLabs keys are typically 32 character hex strings)
    const apiKey = process.env.ELEVENLABS_API_KEY!; // We already checked it exists above
    if (apiKey.length < 20) {
      return NextResponse.json({
        valid: false,
        connected: false,
        apiKeyConfigured: true,
        error: 'Invalid ElevenLabs API key format - key too short',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      } as ElevenLabsValidationResponse, { status: 500 });
    }
    
    // Test API connectivity
    try {
      // Test by getting available voices using direct API call
      const voicesResponse = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': apiKey,
        },
      });
      
      if (!voicesResponse.ok) {
        throw new Error(`ElevenLabs API returned ${voicesResponse.status}: ${voicesResponse.statusText}`);
      }
      
      const voices = await voicesResponse.json();
      
      // Try to get subscription info if possible
      let subscriptionInfo = null;
      try {
        const subResponse = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
          headers: {
            'xi-api-key': apiKey,
          },
        });
        if (subResponse.ok) {
          subscriptionInfo = await subResponse.json();
        }
      } catch (subError) {
        // Subscription info might not be available for all key types
        console.log('Could not fetch subscription info:', subError);
      }
      
      const responseTime = Date.now() - startTime;
      
      return NextResponse.json({
        valid: true,
        connected: true,
        apiKeyConfigured: true,
        testResult: {
          voicesAvailable: voices.voices?.length || 0,
          subscriptionTier: subscriptionInfo?.tier || 'unknown',
          charactersAvailable: subscriptionInfo?.character_count || undefined
        },
        responseTime,
        timestamp: new Date().toISOString()
      } as ElevenLabsValidationResponse);
      
    } catch (apiError: any) {
      const responseTime = Date.now() - startTime;
      console.error('ElevenLabs API test failed:', apiError);
      
      // Parse error details
      let errorMessage = 'ElevenLabs API connection failed';
      if (apiError?.status === 401) {
        errorMessage = 'Invalid ElevenLabs API key';
      } else if (apiError?.status === 429) {
        errorMessage = 'ElevenLabs API rate limit exceeded';
      } else if (apiError?.status === 403) {
        errorMessage = 'ElevenLabs API access forbidden';
      } else if (apiError?.message) {
        errorMessage = apiError.message;
      }
      
      return NextResponse.json({
        valid: true, // Key format appears valid
        connected: false,
        apiKeyConfigured: true,
        error: errorMessage,
        responseTime,
        timestamp: new Date().toISOString()
      } as ElevenLabsValidationResponse, { status: 503 });
    }
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('ElevenLabs validation failed:', error);
    
    return NextResponse.json({
      valid: false,
      connected: false,
      apiKeyConfigured: !!process.env.ELEVENLABS_API_KEY,
      error: error instanceof Error ? error.message : 'ElevenLabs validation failed',
      responseTime,
      timestamp: new Date().toISOString()
    } as ElevenLabsValidationResponse, { status: 500 });
  }
}

// Support POST for detailed testing
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { testTTS = false, testText = 'test' } = body;
    
    // Perform GET validation first
    const getResponse = await GET();
    const getResult = await getResponse.json();
    
    if (!getResult.connected) {
      return NextResponse.json(getResult, { status: getResponse.status });
    }
    
    // If TTS test is requested, perform text-to-speech test
    if (testTTS) {
      try {
        // Get available voices first
        const voicesResponse = await fetch('https://api.elevenlabs.io/v1/voices', {
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY!,
          },
        });
        
        if (!voicesResponse.ok) {
          throw new Error(`Could not fetch voices for TTS test: ${voicesResponse.status}`);
        }
        
        const voices = await voicesResponse.json();
        const firstVoice = voices.voices?.[0];
        
        if (!firstVoice) {
          throw new Error('No voices available for TTS test');
        }
        
        // Perform a small TTS test (just check if endpoint accepts request)
        const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${firstVoice.voice_id}`, {
          method: 'POST',
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: testText,
            model_id: 'eleven_turbo_v2'
          }),
        });
        
        if (!ttsResponse.ok) {
          throw new Error(`TTS test failed: ${ttsResponse.status}`);
        }
        
        const responseTime = Date.now() - startTime;
        
        return NextResponse.json({
          ...getResult,
          ttsTest: true,
          testResult: {
            ...getResult.testResult,
            ttsWorking: true,
            voiceUsed: firstVoice.name,
            textTested: testText
          },
          responseTime,
          timestamp: new Date().toISOString()
        });
        
      } catch (ttsError: any) {
        const responseTime = Date.now() - startTime;
        
        return NextResponse.json({
          ...getResult,
          ttsTest: true,
          testResult: {
            ...getResult.testResult,
            ttsWorking: false
          },
          error: ttsError?.message || 'TTS test failed',
          responseTime,
          timestamp: new Date().toISOString()
        }, { status: 503 });
      }
    }
    
    return NextResponse.json(getResult);
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('ElevenLabs POST validation failed:', error);
    
    return NextResponse.json({
      valid: false,
      connected: false,
      apiKeyConfigured: !!process.env.ELEVENLABS_API_KEY,
      error: error instanceof Error ? error.message : 'ElevenLabs validation failed',
      responseTime,
      timestamp: new Date().toISOString()
    } as ElevenLabsValidationResponse, { status: 500 });
  }
}