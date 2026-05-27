// proxy.ts
import { updateSession } from "@/lib/supabase/proxy";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Always allow direct access to the password page view without intercepting it
  if (pathname === '/password') {
    return await updateSession(request);
  }

  // 2. Look for our secure site authorization cookie
  const isAuthenticated = request.cookies.has('site-auth');

  // 3. If they don't have the cookie, intercept them immediately and force redirect
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/password', request.nextUrl));
  }

  // 4. If they pass the password gate, proceed with the standard Supabase session check
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};