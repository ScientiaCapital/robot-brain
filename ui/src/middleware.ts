import { NextRequest, NextResponse } from 'next/server';

/**
 * Performance-focused middleware for Robot Brain Application
 * Implements compression, security headers, and response optimization
 */

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy
  response.headers.set('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://api.anthropic.com https://api.elevenlabs.io; " +
    "media-src 'self' data: blob:; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self';"
  );
  
  // Performance headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Enable compression for API responses
    response.headers.set('Accept-Encoding', 'gzip, deflate, br');
    
    // CORS for API routes - restricted origins for security
    const allowedOrigins = [
      'https://robot-brain-rb7xfb8h2-scientia-capital.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    const origin = request.headers.get('origin');
    if (allowedOrigins.includes(origin || '') || !origin) {
      response.headers.set('Access-Control-Allow-Origin', origin || 'https://robot-brain-rb7xfb8h2-scientia-capital.vercel.app');
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Cache control for API responses
    if (request.nextUrl.pathname.includes('/chat')) {
      // Short cache for chat responses to allow real-time conversation
      response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    } else if (request.nextUrl.pathname.includes('/voice')) {
      // Cache TTS responses for 5 minutes
      response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    }
  }
  
  // Static asset optimization
  if (request.nextUrl.pathname.startsWith('/_next/static/')) {
    // Long-term caching for static assets
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  
  // Image optimization headers
  if (request.nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|ico|svg)$/i)) {
    response.headers.set('Cache-Control', 'public, max-age=2592000'); // 30 days
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)  
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};