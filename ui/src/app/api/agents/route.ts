import { NextRequest, NextResponse } from 'next/server';
import { databaseServices } from '@/lib/database/enhanced-schema-service';
import { getClientIP, checkRateLimit, sanitizeInput } from '@/lib/validation';
import { z } from 'zod';

// Input validation schemas
const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().max(500).optional(),
  agent_type: z.enum(['assistant', 'specialist', 'creative', 'analytical', 'custom']),
  capabilities: z.array(z.string()).optional().default([]),
  system_prompt: z.string().max(5000).optional(),
  model_settings: z.record(z.any()).optional().default({}),
  voice_config: z.record(z.any()).optional().default({}),
  is_public: z.boolean().optional().default(false),
  is_template: z.boolean().optional().default(false),
  template_category: z.string().optional(),
  tags: z.array(z.string()).optional().default([])
});

const updateAgentSchema = createAgentSchema.partial().extend({
  id: z.string().uuid()
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
    const isPublic = searchParams.get('public') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let agents;

    if (userId) {
      // Get user's agents
      agents = await databaseServices.agents.listUserAgents(userId);
    } else if (isPublic) {
      // Get public agents
      agents = await databaseServices.agents.listPublicAgents(limit, offset);
    } else {
      // Get public agents by default
      agents = await databaseServices.agents.listPublicAgents(limit, offset);
    }

    return NextResponse.json({
      success: true,
      agents,
      metadata: {
        count: agents.length,
        limit,
        offset,
        isPublic: isPublic || !userId,
        userId
      }
    });

  } catch (error) {
    console.error('Agents GET API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to fetch agents: ${message}` },
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
    const validationResult = createAgentSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid input',
        details: validationResult.error.issues.map(i => i.message)
      }, { status: 400 });
    }

    const { owner_id, ...agentData } = { ...validationResult.data, owner_id: body.owner_id };

    if (!owner_id) {
      return NextResponse.json({ error: 'owner_id is required' }, { status: 400 });
    }

    // Sanitize string inputs
    const sanitizedData = {
      ...agentData,
      owner_id: sanitizeInput(owner_id),
      name: sanitizeInput(agentData.name),
      slug: sanitizeInput(agentData.slug),
      description: agentData.description ? sanitizeInput(agentData.description) : undefined,
      system_prompt: agentData.system_prompt ? sanitizeInput(agentData.system_prompt) : undefined
    };

    // Check if slug is already taken
    const existingAgent = await databaseServices.agents.findBySlug(sanitizedData.slug);
    if (existingAgent) {
      return NextResponse.json({ 
        error: 'Agent slug already exists',
        suggestion: `${sanitizedData.slug}-${Date.now()}`
      }, { status: 409 });
    }

    // Create the agent
    const newAgent = await databaseServices.agents.create({
      ...sanitizedData,
      configuration: {},
      tools: [],
      knowledge_base: [],
      personality_traits: {},
      usage_count: 0,
      rating: 0,
      rating_count: 0,
      version: '1.0.0',
      status: 'active',
      metadata: {
        created_via: 'api',
        ip_address: ip,
        user_agent: request.headers.get('user-agent')
      }
    });

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      agent: newAgent,
      message: 'Agent created successfully',
      processingTime
    }, { status: 201 });

  } catch (error) {
    console.error('Agents POST API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create agent: ${message}` },
      { status: 500 }
    );
  }
}