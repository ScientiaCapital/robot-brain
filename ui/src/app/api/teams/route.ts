import { NextRequest, NextResponse } from 'next/server';
import { databaseServices } from '@/lib/database/enhanced-schema-service';
import { getClientIP, checkRateLimit, sanitizeInput } from '@/lib/validation';
import { z } from 'zod';

// Input validation schemas
const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  team_type: z.enum(['collaborative', 'hierarchical', 'swarm', 'custom']),
  orchestration_strategy: z.enum(['round_robin', 'leader_based', 'consensus', 'custom']),
  max_agents: z.number().min(1).max(50).optional().default(10),
  configuration: z.record(z.any()).optional().default({}),
  communication_protocol: z.record(z.any()).optional().default({}),
  shared_memory: z.record(z.any()).optional().default({})
});

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIP(request);
    if (!checkRateLimit(ip, 30, 60000)) { // 30 requests per minute
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId parameter is required' }, { status: 400 });
    }

    // For now, return empty array as teams functionality is being developed
    return NextResponse.json({
      success: true,
      teams: [],
      metadata: {
        count: 0,
        userId,
        message: 'Teams functionality in development'
      }
    });

  } catch (error) {
    console.error('Teams GET API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to fetch teams: ${message}` },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Rate limiting - stricter for creation
    const ip = getClientIP(request);
    if (!checkRateLimit(ip, 5, 60000)) { // 5 creations per minute
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Parse and validate input
    const body = await request.json();
    const validationResult = createTeamSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid input',
        details: validationResult.error.issues.map(i => i.message)
      }, { status: 400 });
    }

    const { owner_id, ...teamData } = { ...validationResult.data, owner_id: body.owner_id };

    if (!owner_id) {
      return NextResponse.json({ error: 'owner_id is required' }, { status: 400 });
    }

    // Sanitize string inputs
    const sanitizedData = {
      ...teamData,
      owner_id: sanitizeInput(owner_id),
      name: sanitizeInput(teamData.name),
      description: teamData.description ? sanitizeInput(teamData.description) : undefined
    };

    // Create the team
    const newTeam = await databaseServices.teams.create({
      ...sanitizedData,
      is_active: true,
      performance_metrics: {
        created_via: 'api',
        ip_address: ip,
        user_agent: request.headers.get('user-agent')
      }
    });

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      team: newTeam,
      message: 'Team created successfully',
      processingTime
    }, { status: 201 });

  } catch (error) {
    console.error('Teams POST API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create team: ${message}` },
      { status: 500 }
    );
  }
}