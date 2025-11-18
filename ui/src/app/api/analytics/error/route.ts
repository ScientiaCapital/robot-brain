import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

// Lazy database connection
let sql: ReturnType<typeof neon> | null = null;

function getConnection() {
  if (!sql) {
    const connectionString = process.env.NEON_DATABASE_URL;
    if (!connectionString) {
      return null;
    }
    sql = neon(connectionString);
  }
  return sql;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { error, stack, componentStack, context } = body;

    // Log to console
    console.error('[Client Error]', error);
    if (stack) {
      console.error('[Stack]', stack);
    }

    // Try to log to database
    const sql = getConnection();
    if (sql) {
      try {
        await sql`
          INSERT INTO error_logs (
            error_message,
            stack_trace,
            component_stack,
            context,
            created_at
          ) VALUES (
            ${error || 'Unknown error'},
            ${stack || null},
            ${componentStack || null},
            ${JSON.stringify(context || {})},
            NOW()
          )
        `;
      } catch (dbError) {
        // Table might not exist, just log to console
        console.warn('Could not log error to database:', dbError);
      }
    }

    return NextResponse.json({ logged: true });
  } catch (err) {
    console.error('Error logging endpoint failed:', err);
    return NextResponse.json({ error: 'Failed to log error' }, { status: 500 });
  }
}
