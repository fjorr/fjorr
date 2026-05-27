// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // ⚡ SYSTEM BYPASS: Instantly skip Next.js system files, assets, and APIs
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname.includes('.') // Skips public folder media files like .mp4, .png, .avif
  ) {
    return NextResponse.next();
  }

  // Look for our secure authorization cookie
  const isAuthenticated = request.cookies.has('site-auth');

  // 1. If trying to access the password page but already authenticated, skip it
  if (pathname === '/password' && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 2. If not authenticated and trying to access the main site, force redirect
  if (pathname !== '/password' && !isAuthenticated) {
    return NextResponse.redirect(new URL('/password', request.url));
  }

  return NextResponse.next();
}

// 🎯 SIMPLIFIED CONFIG: Let the code above do the heavy filtering work
export const config = {
  matcher: [
    /*
     * Match all paths so our internal system bypass filter 
     * can perfectly block everything else.
     */
    '/((?!_next|[^?]*\\/[^?]*\\.).*)',
    '/',
  ],
};