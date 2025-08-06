/**
 * Database Health Check API Endpoint
 * Provides comprehensive database health verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { DatabaseHealthCheckService } from '@/lib/database/health-check-service';
import { DatabasePerformanceMonitor } from '@/lib/database/performance-monitor';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const checkType = searchParams.get('type') || 'basic';
  
  let healthService: DatabaseHealthCheckService | null = null;
  let performanceMonitor: DatabasePerformanceMonitor | null = null;

  try {
    healthService = new DatabaseHealthCheckService();
    performanceMonitor = new DatabasePerformanceMonitor();

    const response: any = {
      timestamp: new Date().toISOString(),
      status: 'checking'
    };

    switch (checkType) {
      case 'basic': {
        // Basic health check
        const connectionStatus = await healthService.testConnection();
        const poolStatus = await healthService.getConnectionPoolStatus();
        
        response.status = connectionStatus.isConnected ? 'healthy' : 'unhealthy';
        response.connection = connectionStatus;
        response.pool = poolStatus;
        break;
      }

      case 'schema': {
        // Schema validation
        const tables = ['conversations', 'sessions', 'embeddings', 'robot_interactions', 'tool_usage'];
        const schemas: Record<string, any> = {};
        
        for (const table of tables) {
          schemas[table] = await healthService.validateTableSchema(table);
        }
        
        const indexes = await healthService.validateIndexes();
        const relationships = await healthService.validateRelationships();
        
        response.status = 'complete';
        response.schemas = schemas;
        response.indexes = indexes;
        response.relationships = relationships;
        break;
      }

      case 'integrity': {
        // Data integrity check
        const conversationIntegrity = await healthService.validateDataIntegrity('conversations');
        const expiredSessions = await healthService.checkExpiredSessions();
        const jsonbValidation = await healthService.validateJsonbData();
        const referentialIntegrity = await healthService.checkReferentialIntegrity();
        
        response.status = 'complete';
        response.integrity = {
          conversations: conversationIntegrity,
          sessions: expiredSessions,
          jsonb: jsonbValidation,
          referential: referentialIntegrity
        };
        break;
      }

      case 'performance': {
        // Performance metrics
        const metrics = await performanceMonitor.collectMetrics();
        const report = await performanceMonitor.generatePerformanceReport();
        const slowQueries = await performanceMonitor.detectSlowQueries({
          threshold: 1000,
          limit: 5
        });
        
        response.status = 'complete';
        response.metrics = metrics;
        response.report = report;
        response.slowQueries = slowQueries;
        break;
      }

      case 'transaction': {
        // Transaction management test
        const isolation = await healthService.testTransactionIsolation();
        const rollback = await healthService.testTransactionRollback();
        const concurrent = await healthService.testConcurrentTransactions(5);
        
        response.status = 'complete';
        response.transactions = {
          isolation,
          rollback,
          concurrent
        };
        break;
      }

      case 'full': {
        // Comprehensive health check
        const connection = await healthService.testConnection();
        const pool = await healthService.getConnectionPoolStatus();
        const schemas = await healthService.validateIndexes();
        const integrity = await healthService.checkReferentialIntegrity();
        const metrics = await performanceMonitor.collectMetrics();
        const report = await performanceMonitor.generatePerformanceReport();
        
        response.status = connection.isConnected ? 'healthy' : 'unhealthy';
        response.summary = {
          databaseConnected: connection.isConnected,
          responseTime: connection.responseTime,
          activeConnections: pool.active,
          totalConnections: pool.total,
          averageQueryTime: metrics.averageQueryTime,
          slowQueries: metrics.slowQueries,
          dataIntegrity: integrity.orphanedConversations === 0,
          recommendations: report.recommendations
        };
        response.details = {
          connection,
          pool,
          schemas,
          integrity,
          metrics,
          report
        };
        break;
      }

      default: {
        // Unknown check type
        return NextResponse.json(
          { error: 'Invalid check type. Use: basic, schema, integrity, performance, transaction, or full' },
          { status: 400 }
        );
      }
    }

    // Add health score calculation
    if (response.status === 'healthy' || response.status === 'complete') {
      response.healthScore = calculateHealthScore(response);
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Database health check failed:', error);
    
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  } finally {
    // Cleanup connections
    if (healthService) {
      await healthService.cleanup();
    }
    if (performanceMonitor) {
      await performanceMonitor.cleanup();
    }
  }
}

function calculateHealthScore(response: any): number {
  let score = 100;
  
  // Connection health (30 points)
  if (response.connection) {
    if (!response.connection.isConnected) score -= 30;
    else if (response.connection.responseTime > 1000) score -= 10;
    else if (response.connection.responseTime > 500) score -= 5;
  }
  
  // Pool health (20 points)
  if (response.pool) {
    const utilizationRate = (response.pool.active / response.pool.total) * 100;
    if (utilizationRate > 90) score -= 15;
    else if (utilizationRate > 75) score -= 10;
    else if (utilizationRate > 60) score -= 5;
  }
  
  // Data integrity (25 points)
  if (response.integrity) {
    if (response.integrity.referential?.orphanedConversations > 0) score -= 15;
    if (response.integrity.referential?.invalidSessionReferences > 0) score -= 10;
  }
  
  // Performance (25 points)
  if (response.metrics) {
    if (response.metrics.averageQueryTime > 1000) score -= 15;
    else if (response.metrics.averageQueryTime > 500) score -= 10;
    else if (response.metrics.averageQueryTime > 200) score -= 5;
    
    if (response.metrics.slowQueries > 10) score -= 10;
    else if (response.metrics.slowQueries > 5) score -= 5;
  }
  
  return Math.max(0, score);
}

// Health check endpoint for monitoring tools
export async function HEAD() {
  try {
    const healthService = new DatabaseHealthCheckService();
    const status = await healthService.testConnection();
    await healthService.cleanup();
    
    if (status.isConnected) {
      return new NextResponse(null, { status: 200 });
    } else {
      return new NextResponse(null, { status: 503 });
    }
  } catch (err) {
    console.error('Database HEAD check error:', err);
    return new NextResponse(null, { status: 503 });
  }
}