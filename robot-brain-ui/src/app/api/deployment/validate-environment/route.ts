import { NextRequest, NextResponse } from 'next/server';

interface EnvironmentVariable {
  name: string;
  configured: boolean;
  format?: 'valid' | 'invalid' | 'unknown';
  masked?: string; // First few characters for verification
  length?: number;
}

interface EnvironmentValidationResponse {
  valid: boolean;
  allRequired: boolean;
  environment: 'production' | 'staging' | 'development';
  variables: EnvironmentVariable[];
  security: {
    noClientExposure: boolean;
    sslRequired: boolean;
  };
  timestamp: string;
}

// List of required environment variables
const REQUIRED_ENV_VARS = [
  {
    name: 'NEON_DATABASE_URL',
    prefix: 'postgresql://',
    minLength: 50,
    sensitive: true
  },
  {
    name: 'ANTHROPIC_API_KEY',
    prefix: 'sk-ant-',
    minLength: 30,
    sensitive: true
  },
  {
    name: 'ELEVENLABS_API_KEY',
    prefix: null, // No standard prefix
    minLength: 20,
    sensitive: true
  }
];

// Optional but recommended environment variables
const OPTIONAL_ENV_VARS = [
  {
    name: 'NEXT_PUBLIC_API_URL',
    prefix: 'https://',
    minLength: 10,
    sensitive: false
  },
  {
    name: 'VERCEL_ENV',
    prefix: null,
    minLength: 1,
    sensitive: false
  },
  {
    name: 'VERCEL_REGION',
    prefix: null,
    minLength: 1,
    sensitive: false
  }
];

function validateEnvironmentVariable(config: any): EnvironmentVariable {
  const value = process.env[config.name];
  
  if (!value) {
    return {
      name: config.name,
      configured: false,
      format: 'invalid'
    };
  }
  
  let format: 'valid' | 'invalid' | 'unknown' = 'unknown';
  
  // Check length
  if (value.length < config.minLength) {
    format = 'invalid';
  } else if (config.prefix && !value.startsWith(config.prefix)) {
    format = 'invalid';
  } else {
    format = 'valid';
  }
  
  // Create masked version for sensitive variables
  let masked: string | undefined;
  if (config.sensitive && value.length > 4) {
    masked = value.substring(0, 4) + '****' + value.slice(-2);
  } else if (!config.sensitive) {
    masked = value.length > 20 ? value.substring(0, 20) + '...' : value;
  }
  
  return {
    name: config.name,
    configured: true,
    format,
    masked,
    length: value.length
  };
}

export async function GET() {
  try {
    // Determine current environment
    const environment = process.env.VERCEL_ENV === 'production' 
      ? 'production' as const
      : process.env.VERCEL_ENV === 'preview' 
        ? 'staging' as const 
        : 'development' as const;
    
    // Validate required environment variables
    const requiredVars = REQUIRED_ENV_VARS.map(validateEnvironmentVariable);
    const optionalVars = OPTIONAL_ENV_VARS.map(validateEnvironmentVariable);
    
    // Check if all required variables are properly configured
    const allRequired = requiredVars.every(v => v.configured && v.format === 'valid');
    const allValid = [...requiredVars, ...optionalVars].every(v => 
      !v.configured || v.format === 'valid'
    );
    
    // Security checks
    const security = {
      noClientExposure: true, // Assume true unless we find exposure
      sslRequired: requiredVars.find(v => v.name === 'NEON_DATABASE_URL')?.configured
        ? process.env.NEON_DATABASE_URL?.includes('sslmode=require') || false
        : false
    };
    
    // Check for potential client-side exposure (basic check)
    const publicEnvVars = Object.keys(process.env).filter(key => 
      key.startsWith('NEXT_PUBLIC_') && 
      REQUIRED_ENV_VARS.some(req => req.name === key)
    );
    
    if (publicEnvVars.length > 0) {
      security.noClientExposure = false;
    }
    
    const response: EnvironmentValidationResponse = {
      valid: allValid,
      allRequired,
      environment,
      variables: [...requiredVars, ...optionalVars],
      security,
      timestamp: new Date().toISOString()
    };
    
    // Return appropriate status code
    const statusCode = allRequired ? 200 : 500;
    
    return NextResponse.json(response, { status: statusCode });
    
  } catch (error) {
    console.error('Environment validation failed:', error);
    
    return NextResponse.json({
      valid: false,
      allRequired: false,
      environment: 'development',
      variables: [],
      security: {
        noClientExposure: false,
        sslRequired: false
      },
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Environment validation failed'
    } as EnvironmentValidationResponse & { error: string }, { status: 500 });
  }
}

// Support POST for environment-specific checks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { checkEnv, validateFormat = true } = body;
    
    // Get base validation
    const getResponse = await GET();
    const getResult = await getResponse.json();
    
    // If specific environment check requested
    if (checkEnv) {
      const targetEnv = checkEnv.toLowerCase();
      const currentEnv = getResult.environment;
      
      if (currentEnv !== targetEnv) {
        return NextResponse.json({
          ...getResult,
          environmentMismatch: true,
          expected: targetEnv,
          actual: currentEnv,
          valid: false
        }, { status: 400 });
      }
    }
    
    // Additional format validation if requested
    if (validateFormat) {
      const formatIssues = getResult.variables.filter((v: any) => 
        v.configured && v.format === 'invalid'
      );
      
      if (formatIssues.length > 0) {
        return NextResponse.json({
          ...getResult,
          formatValidation: true,
          formatIssues: formatIssues.map((issue: any) => ({
            variable: issue.name,
            issue: 'Invalid format or insufficient length'
          })),
          valid: false
        }, { status: 400 });
      }
    }
    
    return NextResponse.json({
      ...getResult,
      extendedValidation: true
    });
    
  } catch (error) {
    console.error('Environment POST validation failed:', error);
    
    return NextResponse.json({
      valid: false,
      allRequired: false,
      environment: 'development',
      variables: [],
      security: {
        noClientExposure: false,
        sslRequired: false
      },
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Environment validation failed'
    } as EnvironmentValidationResponse & { error: string }, { status: 500 });
  }
}