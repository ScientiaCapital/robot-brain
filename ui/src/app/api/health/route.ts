import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import Anthropic from '@anthropic-ai/sdk';

// Health status types
interface ServiceStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  error?: string;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: ServiceStatus;
    anthropic: ServiceStatus;
    elevenlabs: ServiceStatus;
  };
  environment: 'production' | 'staging' | 'development';
  region: string;
  metrics?: {
    responseTime: number;
    memoryUsage?: number;
  };
}

// Helper function to test service connectivity
async function testServiceConnectivity<T>(
  testFn: () => Promise<T>
): Promise<ServiceStatus> {
  const startTime = Date.now();
  
  try {
    await testFn();
    const responseTime = Date.now() - startTime;
    return {
      status: 'healthy',
      responseTime
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      status: 'unhealthy',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Test database connectivity
async function testDatabaseHealth(): Promise<ServiceStatus> {
  return testServiceConnectivity(async () => {
    if (!process.env.NEON_DATABASE_URL) {
      throw new Error('NEON_DATABASE_URL not configured');
    }
    
    const sql = neon(process.env.NEON_DATABASE_URL);
    const result = await sql`SELECT 1 as health_check`;
    
    if (!result || result.length === 0) {
      throw new Error('Database query returned no results');
    }
  });
}

// Test Anthropic API connectivity
async function testAnthropicHealth(): Promise<ServiceStatus> {
  return testServiceConnectivity(async () => {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }
    
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    // Simple test with minimal token usage
    await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 5,
      messages: [{ role: 'user', content: 'health' }],
    });
  });
}

// Test ElevenLabs API connectivity
async function testElevenLabsHealth(): Promise<ServiceStatus> {
  return testServiceConnectivity(async () => {
    if (!process.env.ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }
    
    // Test by fetching voices using direct API call (lightweight operation)
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
      },
    });
    
    if (!response.ok) {
      throw new Error(`ElevenLabs API returned ${response.status}: ${response.statusText}`);
    }
    
    await response.json();
  });
}

// Determine overall health status based on service statuses
function getOverallStatus(services: HealthResponse['services']): 'healthy' | 'degraded' | 'unhealthy' {
  const statuses = Object.values(services).map(service => service.status);
  
  if (statuses.every(status => status === 'healthy')) {
    return 'healthy';
  } else if (statuses.some(status => status === 'healthy')) {
    return 'degraded';
  } else {
    return 'unhealthy';
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const includeMetrics = searchParams.get('metrics') === 'true';
    
    // Determine environment
    const environment = process.env.VERCEL_ENV === 'production' 
      ? 'production' as const
      : process.env.VERCEL_ENV === 'preview' 
        ? 'staging' as const 
        : 'development' as const;
    
    // Test all services concurrently
    const [databaseStatus, anthropicStatus, elevenLabsStatus] = await Promise.all([
      testDatabaseHealth(),
      testAnthropicHealth(),
      testElevenLabsHealth()
    ]);
    
    const services = {
      database: databaseStatus,
      anthropic: anthropicStatus,
      elevenlabs: elevenLabsStatus
    };
    
    const overallStatus = getOverallStatus(services);
    const responseTime = Date.now() - startTime;
    
    // Build health response
    const healthResponse: HealthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      services,
      environment,
      region: process.env.VERCEL_REGION || 'sfo1'
    };
    
    // Include metrics if requested
    if (includeMetrics) {
      healthResponse.metrics = {
        responseTime,
        memoryUsage: process.memoryUsage().heapUsed
      };
    }
    
    // Set appropriate status code based on health
    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;
    
    return NextResponse.json(healthResponse, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Health check failed:', error);
    
    const errorResponse: HealthResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      services: {
        database: { status: 'unhealthy', error: 'Health check failed' },
        anthropic: { status: 'unhealthy', error: 'Health check failed' },
        elevenlabs: { status: 'unhealthy', error: 'Health check failed' }
      },
      environment: process.env.VERCEL_ENV === 'production' 
        ? 'production' as const
        : process.env.VERCEL_ENV === 'preview' 
          ? 'staging' as const 
          : 'development' as const,
      region: process.env.VERCEL_REGION || 'sfo1',
      metrics: {
        responseTime
      }
    };
    
    return NextResponse.json(errorResponse, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}