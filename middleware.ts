// middleware.ts
import { updateSession } from "@/lib/supabase/proxy";
import { NextResponse, type NextRequest } from "next/server";

// 🎯 VERCEL STRICTLY LOOKS FOR THE NAME "middleware"
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. SYSTEM BYPASS: Instantly pass through public assets and the login page
  if (
    pathname === '/password' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt'
  ) {
    return await updateSession(request);
  }

  // 2. CHECK SITE PASSWORD COOKIE
  const isAuthenticated = request.cookies.has('site-auth');

  // 3. ENFORCE INTERCEPT: If no authorization cookie is present, redirect to /password
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/password', request.nextUrl));
  }

  // 4. SUPABASE BACKBONE: If password check passes, run your normal session loop
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static extensions handled by your framework layout
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};