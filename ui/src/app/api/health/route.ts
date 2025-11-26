import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { DatabaseHealthCheckService } from '@/lib/database/health-check-service';

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
    cartesia: ServiceStatus;
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

// Test database connectivity using Supabase
async function testDatabaseHealth(): Promise<ServiceStatus> {
  const result = await DatabaseHealthCheckService.check();

  return {
    status: result.healthy ? 'healthy' : 'unhealthy',
    responseTime: result.latencyMs,
    error: result.healthy ? undefined : result.message
  };
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

// Test Cartesia API connectivity
async function testCartesiaHealth(): Promise<ServiceStatus> {
  return testServiceConnectivity(async () => {
    if (!process.env.CARTESIA_API_KEY) {
      throw new Error('CARTESIA_API_KEY not configured');
    }

    // Test by checking API access (lightweight operation)
    const response = await fetch('https://api.cartesia.ai/voices', {
      headers: {
        'X-API-Key': process.env.CARTESIA_API_KEY,
        'Cartesia-Version': '2024-06-10',
      },
    });

    if (!response.ok) {
      throw new Error(`Cartesia API returned ${response.status}: ${response.statusText}`);
    }
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
    const [databaseStatus, anthropicStatus, cartesiaStatus] = await Promise.all([
      testDatabaseHealth(),
      testAnthropicHealth(),
      testCartesiaHealth()
    ]);

    const services = {
      database: databaseStatus,
      anthropic: anthropicStatus,
      cartesia: cartesiaStatus
    };

    const overallStatus = getOverallStatus(services);
    const responseTime = Date.now() - startTime;

    // Build health response
    const healthResponse: HealthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.2.0',
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
      version: process.env.npm_package_version || '0.2.0',
      uptime: process.uptime(),
      services: {
        database: { status: 'unhealthy', error: 'Health check failed' },
        anthropic: { status: 'unhealthy', error: 'Health check failed' },
        cartesia: { status: 'unhealthy', error: 'Health check failed' }
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
