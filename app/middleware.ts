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
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Look for our secure authorization cookie
  const isAuthenticated = request.cookies.has('site-auth');

  // 1. If trying to access the password page but already authenticated, skip it
  if (pathname === '/password' && isAuthenticated) {
    // 🎯 FIXED: Force relative rewrite to root to prevent proxy domain loops
    return NextResponse.redirect(new URL('/', request.nextUrl));
  }

  // 2. If not authenticated and trying to access the main site, force redirect
  if (pathname !== '/password' && !isAuthenticated) {
    // 🎯 FIXED: Redirect directly to the relative '/password' route relative to whatever current domain (www or staging) is active
    return NextResponse.redirect(new URL('/password', request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Capture absolutely everything so our internal function code can filter accurately
    '/((?!_next|[^?]*\\/[^?]*\\.).*)',
    '/',
  ],
};