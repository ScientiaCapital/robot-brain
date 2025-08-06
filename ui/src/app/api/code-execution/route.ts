import { NextRequest, NextResponse } from 'next/server';
import { Sandbox } from '@e2b/code-interpreter';
import { getClientIP, checkRateLimit, sanitizeInput } from '@/lib/validation';
import { z } from 'zod';

// Input validation schema
const codeExecutionSchema = z.object({
  code: z.string().min(1).max(50000), // Limit code size
  language: z.enum(['python', 'javascript', 'typescript']).optional().default('python'),
  timeout: z.number().min(1).max(300).optional().default(30), // Max 5 minutes
  envs: z.record(z.string()).optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional()
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let sandbox: Sandbox | null = null;
  
  try {
    // Rate limiting - stricter for code execution
    const ip = getClientIP(request);
    if (!checkRateLimit(ip, 5, 60000)) { // 5 requests per minute
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Parse and validate input
    const body = await request.json();
    const validationResult = codeExecutionSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid input',
        details: validationResult.error.issues.map(i => i.message)
      }, { status: 400 });
    }

    const { code, language, timeout, envs, userId, sessionId } = validationResult.data;
    
    // Sanitize code input
    const sanitizedCode = sanitizeInput(code);
    
    // Security checks
    const dangerousPatterns = [
      /import\s+os/i,
      /import\s+subprocess/i,
      /exec\s*\(/i,
      /eval\s*\(/i,
      /__import__/i,
      /rm\s+-rf/i,
      /delete.*file/i
    ];

    if (dangerousPatterns.some(pattern => pattern.test(sanitizedCode))) {
      return NextResponse.json({ 
        error: 'Code contains potentially dangerous operations',
        executionBlocked: true
      }, { status: 400 });
    }

    // Create E2B sandbox
    sandbox = await Sandbox.create();
    
    // Execute code with timeout and error handling
    const execution = await sandbox.runCode(sanitizedCode, {
      language: language === 'python' ? undefined : language,
      timeoutMs: timeout * 1000,
      envs: envs || {},
      onStdout: (output) => {
        console.log('Stdout:', output.line);
      },
      onStderr: (output) => {
        console.warn('Stderr:', output.line);
      }
    });

    const processingTime = Date.now() - startTime;
    
    // Structure the response
    const response = {
      success: true,
      execution: {
        code: sanitizedCode,
        language,
        results: execution.results || [],
        text: execution.text,
        error: execution.error ? {
          name: execution.error.name,
          value: execution.error.value,
          traceback: execution.error.traceback
        } : null,
        logs: {
          stdout: execution.logs.stdout || [],
          stderr: execution.logs.stderr || []
        },
        executionCount: execution.execution_count || 0
      },
      metadata: {
        sessionId,
        userId,
        executionTime: processingTime,
        sandboxId: 'e2b-sandbox',
        timestamp: new Date().toISOString()
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Code execution API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      error: `Code execution failed: ${message}`,
      executionTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    }, { status: 500 });

  } finally {
    // Clean up sandbox
    if (sandbox) {
      try {
        await sandbox.kill();
      } catch (cleanupError) {
        console.error('Error cleaning up sandbox:', cleanupError);
      }
    }
  }
}

export async function GET() {
  // Health check endpoint
  return NextResponse.json({
    status: 'operational',
    service: 'E2B Code Execution',
    supportedLanguages: ['python', 'javascript', 'typescript'],
    maxTimeout: 300,
    rateLimits: {
      requestsPerMinute: 5
    }
  });
}