import { updateSession } from "@/lib/supabase/proxy";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Site password gate is opt-in via SITE_GATE_ENABLED=true (staging/preview).
 * Production should leave it unset/false so the site is public.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const gateEnabled = process.env.SITE_GATE_ENABLED === "true";

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return await updateSession(request);
  }

  if (gateEnabled) {
    const isAuthenticated = request.cookies.has("site-auth");

    if (pathname === "/password") {
      return await updateSession(request);
    }

    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/password", request.nextUrl));
    }
  } else if (pathname === "/password") {
    // Gate off in production — don't leave a public password entry page.
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)",
  ],
};
