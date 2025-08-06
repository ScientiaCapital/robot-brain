import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

interface AnthropicValidationResponse {
  valid: boolean;
  connected: boolean;
  error?: string;
  apiKeyConfigured: boolean;
  testResult?: {
    model: string;
    responseReceived: boolean;
    tokensUsed?: number;
  };
  responseTime: number;
  timestamp: string;
}

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Check if API key is configured
    const apiKeyConfigured = !!process.env.ANTHROPIC_API_KEY;
    
    if (!apiKeyConfigured) {
      return NextResponse.json({
        valid: false,
        connected: false,
        apiKeyConfigured: false,
        error: 'ANTHROPIC_API_KEY environment variable not configured',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      } as AnthropicValidationResponse, { status: 500 });
    }
    
    // Validate API key format (Anthropic keys start with 'sk-ant-')
    const apiKey = process.env.ANTHROPIC_API_KEY!; // We already checked it exists above
    if (!apiKey.startsWith('sk-ant-')) {
      return NextResponse.json({
        valid: false,
        connected: false,
        apiKeyConfigured: true,
        error: 'Invalid Anthropic API key format',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      } as AnthropicValidationResponse, { status: 500 });
    }
    
    // Test API connectivity
    try {
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      
      // Use minimal token request for health check
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 5,
        messages: [{ role: 'user', content: 'ok' }],
      });
      
      const responseTime = Date.now() - startTime;
      
      return NextResponse.json({
        valid: true,
        connected: true,
        apiKeyConfigured: true,
        testResult: {
          model: response.model,
          responseReceived: true,
          tokensUsed: response.usage?.input_tokens + response.usage?.output_tokens
        },
        responseTime,
        timestamp: new Date().toISOString()
      } as AnthropicValidationResponse);
      
    } catch (apiError: any) {
      const responseTime = Date.now() - startTime;
      console.error('Anthropic API test failed:', apiError);
      
      // Parse error details
      let errorMessage = 'Anthropic API connection failed';
      if (apiError?.status === 401) {
        errorMessage = 'Invalid Anthropic API key';
      } else if (apiError?.status === 429) {
        errorMessage = 'Anthropic API rate limit exceeded';
      } else if (apiError?.message) {
        errorMessage = apiError.message;
      }
      
      return NextResponse.json({
        valid: true, // Key format is valid
        connected: false,
        apiKeyConfigured: true,
        error: errorMessage,
        responseTime,
        timestamp: new Date().toISOString()
      } as AnthropicValidationResponse, { status: 503 });
    }
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Anthropic validation failed:', error);
    
    return NextResponse.json({
      valid: false,
      connected: false,
      apiKeyConfigured: !!process.env.ANTHROPIC_API_KEY,
      error: error instanceof Error ? error.message : 'Anthropic validation failed',
      responseTime,
      timestamp: new Date().toISOString()
    } as AnthropicValidationResponse, { status: 500 });
  }
}

// Support POST for detailed testing
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { testMessage = 'health check', model = 'claude-3-haiku-20240307' } = body;
    
    // Perform GET validation first
    const getResponse = await GET();
    const getResult = await getResponse.json();
    
    if (!getResult.connected) {
      return NextResponse.json(getResult, { status: getResponse.status });
    }
    
    // Perform extended test with custom message
    try {
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY!,
      });
      
      const response = await anthropic.messages.create({
        model,
        max_tokens: 10,
        messages: [{ role: 'user', content: testMessage }],
      });
      
      const responseTime = Date.now() - startTime;
      
      return NextResponse.json({
        ...getResult,
        extendedTest: true,
        testResult: {
          model: response.model,
          responseReceived: true,
          tokensUsed: response.usage?.input_tokens + response.usage?.output_tokens,
          responseContent: response.content[0]?.type === 'text' ? response.content[0].text : null
        },
        responseTime,
        timestamp: new Date().toISOString()
      });
      
    } catch (testError: any) {
      const responseTime = Date.now() - startTime;
      
      return NextResponse.json({
        ...getResult,
        extendedTest: true,
        error: testError?.message || 'Extended test failed',
        responseTime,
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Anthropic POST validation failed:', error);
    
    return NextResponse.json({
      valid: false,
      connected: false,
      apiKeyConfigured: !!process.env.ANTHROPIC_API_KEY,
      error: error instanceof Error ? error.message : 'Anthropic validation failed',
      responseTime,
      timestamp: new Date().toISOString()
    } as AnthropicValidationResponse, { status: 500 });
  }
}