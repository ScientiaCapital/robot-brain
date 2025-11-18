import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

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

// POST - Log analytics event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, eventData, sessionId } = body;

    if (!eventType) {
      return NextResponse.json({ error: 'eventType is required' }, { status: 400 });
    }

    // Try to log to database
    try {
      const sql = getConnection();
      await sql`
        INSERT INTO analytics_events (event_type, event_data, session_id, created_at)
        VALUES (${eventType}, ${JSON.stringify(eventData || {})}, ${sessionId || null}, NOW())
      `;
    } catch (dbError) {
      // Table might not exist yet, log to console
      console.log(`[Analytics] ${eventType}:`, eventData);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Failed to log event' }, { status: 500 });
  }
}

// GET - Retrieve analytics data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    const type = searchParams.get('type');

    const sql = getConnection();

    // Get summary metrics
    const [chatCount] = await sql`
      SELECT COUNT(*) as count FROM conversations
      WHERE created_at > NOW() - INTERVAL '${days} days'
    `;

    // Get event counts by type (if analytics_events table exists)
    let eventCounts: Record<string, number> = {};
    try {
      const events = await sql`
        SELECT event_type, COUNT(*) as count
        FROM analytics_events
        WHERE created_at > NOW() - INTERVAL '${days} days'
        ${type ? sql`AND event_type = ${type}` : sql``}
        GROUP BY event_type
        ORDER BY count DESC
      `;
      for (const row of events) {
        eventCounts[row.event_type as string] = parseInt(row.count as string);
      }
    } catch {
      // Table might not exist
    }

    // Get response time averages
    let avgResponseTime = 0;
    try {
      const [timeResult] = await sql`
        SELECT AVG((metadata->>'responseTime')::int) as avg_time
        FROM conversations
        WHERE metadata->>'responseTime' IS NOT NULL
        AND created_at > NOW() - INTERVAL '${days} days'
      `;
      avgResponseTime = parseFloat(timeResult?.avg_time || '0');
    } catch {
      // Metadata field might not have responseTime
    }

    // Get hourly distribution
    const hourlyDistribution = await sql`
      SELECT EXTRACT(HOUR FROM created_at) as hour, COUNT(*) as count
      FROM conversations
      WHERE created_at > NOW() - INTERVAL '${days} days'
      GROUP BY hour
      ORDER BY hour
    `;

    return NextResponse.json({
      summary: {
        totalConversations: parseInt(chatCount?.count as string || '0'),
        avgResponseTimeMs: Math.round(avgResponseTime),
        period: `${days} days`
      },
      eventCounts,
      hourlyDistribution: hourlyDistribution.map(row => ({
        hour: parseInt(row.hour as string),
        count: parseInt(row.count as string)
      }))
    });
  } catch (error) {
    console.error('Analytics GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
