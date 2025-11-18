// Input Validation and Security
// Provides input sanitization, validation schemas, and rate limiting

import { z } from 'zod';
import { NextRequest } from 'next/server';

// Validation schemas
export const schemas = {
  chatRequest: z.object({
    message: z.string().min(1).max(2000),
    personality: z.string().min(1).max(100),
    sessionId: z.string().optional(),
  }),
  ttsRequest: z.object({
    text: z.string().min(1).max(5000),
    voiceId: z.string().optional(),
  }),
};

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Sanitize user input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
    .slice(0, 2000); // Limit length
}

/**
 * Validate and sanitize session ID
 */
export function validateSessionId(sessionId: string): string {
  // Allow alphanumeric, hyphens, and underscores
  const sanitized = sessionId.replace(/[^a-zA-Z0-9-_]/g, '');
  return sanitized.slice(0, 100) || 'default';
}

/**
 * Check rate limit for a given IP address
 */
export function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const key = ip;

  let record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + windowMs };
    rateLimitStore.set(key, record);
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Get client IP from request
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  return 'unknown';
}

/**
 * Clear rate limit store (for testing)
 */
export function clearRateLimits(): void {
  rateLimitStore.clear();
}
