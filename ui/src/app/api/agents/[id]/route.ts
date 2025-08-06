import { NextRequest, NextResponse } from 'next/server';
import { databaseServices } from '@/lib/database/enhanced-schema-service';
import { getClientIP, checkRateLimit } from '@/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const ip = getClientIP(request);
    if (!checkRateLimit(ip, 50, 60000)) { // 50 requests per minute
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const { id: agentId } = await params;

    if (!agentId || agentId.length < 1) {
      return NextResponse.json({ error: 'Invalid agent ID' }, { status: 400 });
    }

    const agent = await databaseServices.agents.findById(agentId);

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Increment usage count
    await databaseServices.agents.incrementUsage(agentId);

    return NextResponse.json({
      success: true,
      agent
    });

  } catch (error) {
    console.error('Agent GET API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to fetch agent: ${message}` },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const ip = getClientIP(request);
    if (!checkRateLimit(ip, 10, 60000)) { // 10 updates per minute
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const { id: agentId } = await params;
    
    if (!agentId) {
      return NextResponse.json({ error: 'Invalid agent ID' }, { status: 400 });
    }

    // Check if agent exists
    const existingAgent = await databaseServices.agents.findById(agentId);
    if (!existingAgent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const body = await request.json();
    
    // For now, return a message that updates are not yet fully implemented
    return NextResponse.json({
      success: false,
      message: 'Agent updates not yet implemented in this version',
      agentId,
      currentAgent: existingAgent
    }, { status: 501 });

  } catch (error) {
    console.error('Agent PUT API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to update agent: ${message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const ip = getClientIP(request);
    if (!checkRateLimit(ip, 5, 60000)) { // 5 deletions per minute
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const { id: agentId } = await params;
    
    if (!agentId) {
      return NextResponse.json({ error: 'Invalid agent ID' }, { status: 400 });
    }

    // Check if agent exists
    const existingAgent = await databaseServices.agents.findById(agentId);
    if (!existingAgent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // For now, return a message that deletions are not yet fully implemented
    return NextResponse.json({
      success: false,
      message: 'Agent deletion not yet implemented in this version',
      agentId,
      currentAgent: existingAgent
    }, { status: 501 });

  } catch (error) {
    console.error('Agent DELETE API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to delete agent: ${message}` },
      { status: 500 }
    );
  }
}