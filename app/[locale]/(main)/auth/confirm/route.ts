import { createClient } from "@/lib/supabase/server";
import { safeInternalPath } from "@/lib/site-gate";
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { redirect } from "next/navigation";

/**
 * Completes magic-link / OTP / OAuth sign-in.
 * Supports token_hash (email templates) and PKCE `code` exchange.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const nextFromQuery = searchParams.get("next");
  const nextFromCookie = request.cookies.get("fjorr_auth_next")?.value ?? null;
  const next = safeInternalPath(nextFromQuery ?? nextFromCookie, "/account/voyages");

  const supabase = await createClient();

  const clearNextCookie = (response: NextResponse) => {
    response.cookies.set("fjorr_auth_next", "", { path: "/", maxAge: 0 });
    return response;
  };

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const res = NextResponse.redirect(new URL(next, request.nextUrl.origin));
      return clearNextCookie(res);
    }
    redirect(`/auth/error?error=${encodeURIComponent(error.message)}`);
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      const res = NextResponse.redirect(new URL(next, request.nextUrl.origin));
      return clearNextCookie(res);
    }
    redirect(`/auth/error?error=${encodeURIComponent(error.message)}`);
  }

  redirect(
    `/auth/error?error=${encodeURIComponent("Missing auth code or token")}`
  );
}
