import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

function supabaseAnonKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Refresh the Supabase auth session cookie when present.
 * Does NOT force anonymous visitors to /auth/login — the public site is open.
 * Pass an existing response (e.g. from next-intl) so auth cookies merge onto it.
 */
export async function updateSession(
  request: NextRequest,
  existingResponse?: NextResponse,
) {
  let supabaseResponse =
    existingResponse ??
    NextResponse.next({
      request,
    });

  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // Skip session refresh for anonymous visitors — no auth cookie to keep warm.
  const hasAuthCookie = request.cookies
    .getAll()
    .some(
      (c) =>
        c.name.startsWith("sb-") &&
        (c.name.includes("auth-token") || c.name.endsWith("-auth-token")),
    );
  if (!hasAuthCookie) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          if (existingResponse) {
            // Preserve next-intl redirects/rewrites; only attach cookies.
            cookiesToSet.forEach(({ name, value, options }) =>
              existingResponse.cookies.set(name, value, options),
            );
            supabaseResponse = existingResponse;
          } else {
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options),
            );
          }
        },
      },
    },
  );

  // Keep the session fresh when a user is logged in; never gate the public site.
  await supabase.auth.getClaims();

  return supabaseResponse;
}
