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

// 🎯 CRITICAL: Matcher configuration ensures static assets and APIs aren't locked out
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};