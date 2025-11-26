import { NextRequest, NextResponse } from 'next/server';
import { schemas, checkRateLimit, getClientIP, sanitizeInput, validateSessionId } from '@/lib/validation';
import { responseCache } from '@/lib/response-cache';
import { databaseServices } from '@/lib/database/enhanced-schema-service';

// OpenRouter API endpoint
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Available Chinese LLM models through OpenRouter
const CHINESE_LLM_MODELS = {
  // DeepSeek models
  'deepseek-chat': 'deepseek/deepseek-chat',
  'deepseek-coder': 'deepseek/deepseek-coder',

  // Qwen models (Alibaba)
  'qwen-2-72b': 'qwen/qwen-2-72b-instruct',
  'qwen-2.5-72b': 'qwen/qwen-2.5-72b-instruct',
  'qwen-turbo': 'qwen/qwen-turbo',

  // Yi models (01.AI)
  'yi-large': '01-ai/yi-large',
  'yi-large-turbo': '01-ai/yi-large-turbo',

  // Default
  'default': 'deepseek/deepseek-chat'
} as const;

type ChineseLLMModel = keyof typeof CHINESE_LLM_MODELS;

// In-memory conversation history for OpenRouter sessions
const openRouterHistory = new Map<string, Array<{role: string, content: string}>>();

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Rate limiting (stricter for OpenRouter to manage costs)
    const ip = getClientIP(request);
    if (!checkRateLimit(ip, 10, 60000)) { // 10 requests per minute
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Parse and validate input
    const body = await request.json();
    const validationResult = schemas.openRouterRequest.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Invalid input',
        details: validationResult.error.issues.map(i => i.message)
      }, { status: 400 });
    }

    const { message, model: requestedModel, sessionId = 'openrouter-default' } = validationResult.data;

    // Sanitize input
    const sanitizedMessage = sanitizeInput(message);
    const validatedSessionId = validateSessionId(sessionId);

    // Resolve model name
    const modelKey = (requestedModel as ChineseLLMModel) || 'default';
    const modelId = CHINESE_LLM_MODELS[modelKey] || CHINESE_LLM_MODELS['default'];

    // Check for API key
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('OPENROUTER_API_KEY not configured');
      return NextResponse.json(
        { error: 'OpenRouter service not configured' },
        { status: 503 }
      );
    }

    // Check cache
    const cacheKey = responseCache.generateKey({ message: sanitizedMessage, personality: modelId });
    const cachedResponse = responseCache.get(cacheKey);
    if (cachedResponse) {
      return NextResponse.json({
        message: cachedResponse,
        model: modelId,
        sessionId: validatedSessionId,
        cached: true,
        responseTime: Date.now() - startTime
      });
    }

    // Get or create conversation history
    const history = openRouterHistory.get(validatedSessionId) || [];

    // Add user message to history
    history.push({ role: 'user', content: sanitizedMessage });

    // Build messages array
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant. Keep responses concise and helpful. You can communicate in both English and Chinese.'
      },
      ...history.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    // Call OpenRouter API
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Robot Brain',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);

      if (response.status === 401) {
        return NextResponse.json(
          { error: 'OpenRouter authentication failed' },
          { status: 503 }
        );
      }
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'OpenRouter rate limit exceeded' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: `OpenRouter request failed: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || '';

    // Cache the response
    responseCache.set(cacheKey, responseText);

    // Update conversation history
    history.push({ role: 'assistant', content: responseText });
    openRouterHistory.set(validatedSessionId, history);

    // Store in database (non-blocking)
    databaseServices.conversations.create({
      session_id: validatedSessionId,
      robot_personality: 'openrouter',
      user_message: sanitizedMessage,
      robot_response: responseText,
      metadata: {
        model: modelId,
        provider: 'openrouter',
        usage: data.usage
      }
    }).catch(err => {
      console.error('Database error (non-blocking):', err);
    });

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      message: responseText,
      model: modelId,
      modelName: modelKey,
      sessionId: validatedSessionId,
      cached: false,
      responseTime: responseTime,
      usage: data.usage
    });

  } catch (error) {
    console.error('OpenRouter API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to process request: ${message}` },
      { status: 500 }
    );
  }
}

// GET endpoint to list available models
export async function GET() {
  return NextResponse.json({
    models: Object.entries(CHINESE_LLM_MODELS)
      .filter(([key]) => key !== 'default')
      .map(([key, value]) => ({
        id: key,
        modelId: value,
        description: getModelDescription(key)
      })),
    defaultModel: 'deepseek-chat'
  });
}

function getModelDescription(modelKey: string): string {
  const descriptions: Record<string, string> = {
    'deepseek-chat': 'DeepSeek Chat - General purpose, excellent for Chinese',
    'deepseek-coder': 'DeepSeek Coder - Optimized for code generation',
    'qwen-2-72b': 'Qwen 2 72B - Alibaba\'s large language model',
    'qwen-2.5-72b': 'Qwen 2.5 72B - Latest Qwen model',
    'qwen-turbo': 'Qwen Turbo - Fast and efficient',
    'yi-large': 'Yi Large - 01.AI\'s flagship model',
    'yi-large-turbo': 'Yi Large Turbo - Faster Yi model'
  };
  return descriptions[modelKey] || 'Chinese LLM model';
}
