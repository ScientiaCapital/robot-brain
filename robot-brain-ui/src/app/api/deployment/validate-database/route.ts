import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

interface DatabaseValidationResponse {
  valid: boolean;
  connected: boolean;
  error?: string;
  connectionDetails?: {
    host?: string;
    database?: string;
    ssl?: boolean;
  };
  responseTime: number;
  timestamp: string;
}

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Check if database URL is configured
    if (!process.env.NEON_DATABASE_URL) {
      return NextResponse.json({
        valid: false,
        connected: false,
        error: 'NEON_DATABASE_URL environment variable not configured',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      } as DatabaseValidationResponse, { status: 500 });
    }
    
    // Validate URL format (without exposing credentials)
    const url = process.env.NEON_DATABASE_URL;
    if (!url.startsWith('postgresql://')) {
      return NextResponse.json({
        valid: false,
        connected: false,
        error: 'Invalid database URL format - must start with postgresql://',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      } as DatabaseValidationResponse, { status: 500 });
    }
    
    // Extract safe connection details (without credentials)
    const urlObj = new URL(url);
    const connectionDetails = {
      host: urlObj.hostname,
      database: urlObj.pathname.substring(1), // Remove leading slash
      ssl: urlObj.searchParams.get('sslmode') === 'require'
    };
    
    // Test database connection
    const sql = neon(process.env.NEON_DATABASE_URL);
    
    try {
      const result = await sql`SELECT 
        current_database() as database_name,
        version() as postgres_version,
        now() as server_time
      `;
      
      if (!result || result.length === 0) {
        throw new Error('Database query returned no results');
      }
      
      const responseTime = Date.now() - startTime;
      
      return NextResponse.json({
        valid: true,
        connected: true,
        connectionDetails,
        responseTime,
        timestamp: new Date().toISOString()
      } as DatabaseValidationResponse);
      
    } catch (dbError) {
      const responseTime = Date.now() - startTime;
      console.error('Database connection test failed:', dbError);
      
      return NextResponse.json({
        valid: true, // URL is valid format
        connected: false,
        error: dbError instanceof Error ? dbError.message : 'Database connection failed',
        connectionDetails,
        responseTime,
        timestamp: new Date().toISOString()
      } as DatabaseValidationResponse, { status: 503 });
    }
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Database validation failed:', error);
    
    return NextResponse.json({
      valid: false,
      connected: false,
      error: error instanceof Error ? error.message : 'Database validation failed',
      responseTime,
      timestamp: new Date().toISOString()
    } as DatabaseValidationResponse, { status: 500 });
  }
}

// Also support POST for comprehensive validation
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { testQuery = false } = body;
    
    // Perform GET validation first
    const getResponse = await GET();
    const getResult = await getResponse.json();
    
    if (!getResult.connected) {
      return NextResponse.json(getResult, { status: getResponse.status });
    }
    
    // If connection is good and test query requested, perform additional tests
    if (testQuery) {
      const sql = neon(process.env.NEON_DATABASE_URL!);
      
      try {
        // Test basic operations
        await sql`SELECT 1 as test_number, 'test' as test_string, now() as test_timestamp`;
        
        const responseTime = Date.now() - startTime;
        
        return NextResponse.json({
          ...getResult,
          testQuery: true,
          queryTest: 'passed',
          responseTime,
          timestamp: new Date().toISOString()
        });
        
      } catch (queryError) {
        const responseTime = Date.now() - startTime;
        
        return NextResponse.json({
          ...getResult,
          testQuery: true,
          queryTest: 'failed',
          error: queryError instanceof Error ? queryError.message : 'Query test failed',
          responseTime,
          timestamp: new Date().toISOString()
        }, { status: 503 });
      }
    }
    
    return NextResponse.json(getResult);
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Database POST validation failed:', error);
    
    return NextResponse.json({
      valid: false,
      connected: false,
      error: error instanceof Error ? error.message : 'Database validation failed',
      responseTime,
      timestamp: new Date().toISOString()
    } as DatabaseValidationResponse, { status: 500 });
  }
}