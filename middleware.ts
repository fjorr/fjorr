import { updateSession } from "@/lib/supabase/proxy";
import { isValidGateToken } from "@/lib/site-gate";
import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

/**
 * Site password gate is opt-in via SITE_GATE_ENABLED=true.
 * Keep enabled on staging + production until public launch.
 * When enabled, SITE_PASSWORD must be set; cookie value is an HMAC, not a forgeable flag.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase();

  // Canonical host: apex → www (301). Prefer www to match live Vercel primary.
  if (host === "fjorr.com") {
    const url = request.nextUrl.clone();
    url.host = "www.fjorr.com";
    url.protocol = "https:";
    return NextResponse.redirect(url, 301);
  }

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

  // Partner embeds + temp client mocks: no i18n prefix, no site-password gate.
  if (pathname.startsWith("/embed") || pathname.startsWith("/preview")) {
    return await updateSession(request);
  }

  if (gateEnabled) {
    const sitePassword = process.env.SITE_PASSWORD;
    const gateCookie = request.cookies.get("site-auth")?.value;
    const isAuthenticated = await isValidGateToken(gateCookie, sitePassword);

    // Auth callbacks must pass through — gate would strip ?code= / token_hash.
    const isAuthCallback =
      pathname === "/auth/confirm" ||
      pathname.endsWith("/auth/confirm") ||
      pathname === "/auth/error" ||
      pathname.endsWith("/auth/error");

    if (pathname === "/password" || isAuthCallback) {
      return await updateSession(request);
    }

    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/password", request.nextUrl));
    }
  } else if (pathname === "/password") {
    // Gate off in production — don't leave a public password entry page.
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }

  const response = handleI18nRouting(request);
  return await updateSession(request, response);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|mp4|webm|mov|m4v|woff2|woff|ttf|otf|ttc)$).*)",
  ],
};
