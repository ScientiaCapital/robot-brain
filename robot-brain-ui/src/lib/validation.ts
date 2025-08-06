import { z } from 'zod';
import { NextRequest } from 'next/server';

// Rate limiting storage
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Validation schemas
export const schemas = {
  chatRequest: z.object({
    message: z.string().min(1).max(1000),
    personality: z.string(),
    sessionId: z.string().optional()
  }),
  
  ttsRequest: z.object({
    text: z.string().min(1).max(5000),
    personality: z.string()
  })
};

// Sanitize user input to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim()
    .slice(0, 1000); // Limit length
}

// Validate session ID format
export function validateSessionId(sessionId: string): string {
  // Allow alphanumeric, hyphens, and underscores only
  const sanitized = sessionId.replace(/[^a-zA-Z0-9_-]/g, '');
  return sanitized.slice(0, 64); // Limit length
}

// Extract client IP from request
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

// Rate limiting implementation
export function checkRateLimit(
  identifier: string, 
  maxRequests: number = 10, 
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(identifier);
  
  if (!userLimit || now > userLimit.resetTime) {
    // Create new window
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    });
    return true;
  }
  
  if (userLimit.count >= maxRequests) {
    return false; // Rate limit exceeded
  }
  
  // Increment counter
  userLimit.count++;
  return true;
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60000); // Clean up every minute