import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { getClientIP, checkRateLimit } from '@/lib/validation';

// Lazy database connection
let sql: ReturnType<typeof neon> | null = null;

function getConnection() {
  if (!sql) {
    const connectionString = process.env.NEON_DATABASE_URL;
    if (!connectionString) {
      throw new Error('No database connection string found.');
    }
    sql = neon(connectionString);
  }
  return sql;
}

// GET - Fetch conversation history
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIP(request);
    if (!checkRateLimit(ip, 30, 60000)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');

    const sql = getConnection();

    let conversations;

    if (sessionId) {
      // Get conversations for specific session
      conversations = await sql`
        SELECT id, session_id, robot_personality, user_message, robot_response, created_at
        FROM conversations
        WHERE session_id = ${sessionId}
        ${search ? sql`AND (user_message ILIKE ${'%' + search + '%'} OR robot_response ILIKE ${'%' + search + '%'})` : sql``}
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else {
      // Get all sessions with their latest message
      conversations = await sql`
        SELECT DISTINCT ON (session_id)
          id, session_id, robot_personality, user_message, robot_response, created_at
        FROM conversations
        ${search ? sql`WHERE user_message ILIKE ${'%' + search + '%'} OR robot_response ILIKE ${'%' + search + '%'}` : sql``}
        ORDER BY session_id, created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    }

    // Get total count
    const [countResult] = sessionId
      ? await sql`SELECT COUNT(*) as count FROM conversations WHERE session_id = ${sessionId}`
      : await sql`SELECT COUNT(DISTINCT session_id) as count FROM conversations`;

    return NextResponse.json({
      conversations,
      total: parseInt(countResult?.count as string || '0'),
      limit,
      offset
    });
  } catch (error) {
    console.error('History API error:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}

// DELETE - Delete conversation(s)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const conversationId = searchParams.get('id');

    if (!sessionId && !conversationId) {
      return NextResponse.json({ error: 'sessionId or id required' }, { status: 400 });
    }

    const sql = getConnection();

    if (conversationId) {
      await sql`DELETE FROM conversations WHERE id = ${conversationId}`;
    } else if (sessionId) {
      await sql`DELETE FROM conversations WHERE session_id = ${sessionId}`;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete history error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
