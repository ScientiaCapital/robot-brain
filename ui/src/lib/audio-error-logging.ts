// Audio Error Logging Service
// Tracks and logs audio-related errors to the database and console

import { neon } from '@neondatabase/serverless';

export type AudioErrorType =
  | 'PLAYBACK_ERROR'
  | 'STREAM_ERROR'
  | 'DECODE_ERROR'
  | 'NETWORK_ERROR'
  | 'TTS_API_ERROR'
  | 'PERMISSION_ERROR';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

interface AudioError {
  type: AudioErrorType;
  message: string;
  severity: ErrorSeverity;
  timestamp: Date;
  context?: Record<string, unknown>;
}

// In-memory error stats
const errorStats = new Map<AudioErrorType, number>();

// Get database connection
function getConnection() {
  const connectionString = process.env.NEON_DATABASE_URL || process.env.NEXT_PUBLIC_NEON_DATABASE_URL;
  if (!connectionString) {
    console.warn('No database connection string available for error logging');
    return null;
  }
  return neon(connectionString);
}

/**
 * Log an audio error to the database
 */
export async function logAudioError(
  type: AudioErrorType,
  message: string,
  severity: ErrorSeverity = 'medium',
  context?: Record<string, unknown>
): Promise<void> {
  // Update in-memory stats
  errorStats.set(type, (errorStats.get(type) || 0) + 1);

  // Log to console
  const logLevel = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
  console[logLevel](`[AudioError] ${type}: ${message}`, context);

  // Try to log to database
  try {
    const sql = getConnection();
    if (sql) {
      await sql`
        INSERT INTO audio_errors (
          error_type,
          message,
          severity,
          context,
          created_at
        ) VALUES (
          ${type},
          ${message},
          ${severity},
          ${JSON.stringify(context || {})},
          NOW()
        )
      `;
    }
  } catch (dbError) {
    console.error('Failed to log audio error to database:', dbError);
  }
}

/**
 * Create an AudioError object for tracking
 */
export function createAudioError(
  type: AudioErrorType,
  message: string,
  severity: ErrorSeverity = 'medium',
  context?: Record<string, unknown>
): AudioError {
  return {
    type,
    message,
    severity,
    timestamp: new Date(),
    context
  };
}

/**
 * Get current error statistics
 */
export function getAudioErrorStats(): Record<string, number> {
  const stats: Record<string, number> = {};
  errorStats.forEach((count, type) => {
    stats[type] = count;
  });
  return stats;
}

/**
 * Reset error statistics
 */
export function resetAudioErrorStats(): void {
  errorStats.clear();
}

/**
 * Utility to wrap async audio operations with error logging
 */
export async function withAudioErrorLogging<T>(
  operation: () => Promise<T>,
  errorType: AudioErrorType,
  context?: Record<string, unknown>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await logAudioError(errorType, message, 'high', {
      ...context,
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}
