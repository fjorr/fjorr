// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
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

// 🎯 HARDENED MATCHER CONFIGURATION
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - Internal Next.js system build files (_next/static, _next/image)
     * - API endpoints if you want them public (/api)
     * - Explicitly allowed root brand assets (favicon.ico, robots.txt)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
};