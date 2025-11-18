// Enhanced Database Schema Service
// Provides database operations for agents, conversations, and analytics

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

// Agent interface
export interface Agent {
  id: string;
  name: string;
  system_prompt: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
}

// Analytics event interface
export interface AnalyticsEvent {
  event_type: string;
  event_data: Record<string, unknown>;
  session_id?: string;
  created_at: Date;
}

// Agent database operations
const agentService = {
  async findById(id: string): Promise<Agent | null> {
    try {
      const sql = getConnection();
      const result = await sql`
        SELECT * FROM agents WHERE id = ${id} LIMIT 1
      `;
      return result[0] as Agent || null;
    } catch (error) {
      console.error('Failed to find agent:', error);
      return null;
    }
  },

  async findAll(): Promise<Agent[]> {
    try {
      const sql = getConnection();
      const result = await sql`
        SELECT * FROM agents ORDER BY created_at DESC
      `;
      return result as Agent[];
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      return [];
    }
  },

  async create(agent: Omit<Agent, 'id' | 'created_at' | 'updated_at'>): Promise<Agent | null> {
    try {
      const sql = getConnection();
      const result = await sql`
        INSERT INTO agents (name, system_prompt, avatar_url, created_at, updated_at)
        VALUES (${agent.name}, ${agent.system_prompt}, ${agent.avatar_url || null}, NOW(), NOW())
        RETURNING *
      `;
      return result[0] as Agent;
    } catch (error) {
      console.error('Failed to create agent:', error);
      return null;
    }
  }
};

// Analytics database operations
const analyticsService = {
  async logEvent(
    eventType: string,
    eventData: Record<string, unknown>,
    sessionId?: string
  ): Promise<void> {
    try {
      const sql = getConnection();
      await sql`
        INSERT INTO analytics_events (event_type, event_data, session_id, created_at)
        VALUES (${eventType}, ${JSON.stringify(eventData)}, ${sessionId || null}, NOW())
      `;
    } catch (error) {
      console.error('Failed to log analytics event:', error);
    }
  },

  async getEventsByType(
    eventType: string,
    limit: number = 100
  ): Promise<AnalyticsEvent[]> {
    try {
      const sql = getConnection();
      const result = await sql`
        SELECT * FROM analytics_events
        WHERE event_type = ${eventType}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
      return result as AnalyticsEvent[];
    } catch (error) {
      console.error('Failed to fetch analytics events:', error);
      return [];
    }
  },

  async getEventCounts(days: number = 7): Promise<Record<string, number>> {
    try {
      const sql = getConnection();
      const result = await sql`
        SELECT event_type, COUNT(*) as count
        FROM analytics_events
        WHERE created_at > NOW() - INTERVAL '${days} days'
        GROUP BY event_type
      `;
      const counts: Record<string, number> = {};
      for (const row of result) {
        counts[row.event_type as string] = parseInt(row.count as string);
      }
      return counts;
    } catch (error) {
      console.error('Failed to fetch event counts:', error);
      return {};
    }
  }
};

// Export combined services
export const databaseServices = {
  agents: agentService,
  analytics: analyticsService,
  getConnection
};
