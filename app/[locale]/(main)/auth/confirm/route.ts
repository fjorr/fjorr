import { createClient } from "@/lib/supabase/server";
import { safeInternalPath } from "@/lib/site-gate";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

/**
 * Completes magic-link / OTP sign-in.
 * Supports token_hash (email templates) and PKCE `code` exchange.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = safeInternalPath(searchParams.get("next"), "/account");

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      redirect(next);
    }
    redirect(`/auth/error?error=${encodeURIComponent(error.message)}`);
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      redirect(next);
    }
    redirect(`/auth/error?error=${encodeURIComponent(error.message)}`);
  }

  redirect(
    `/auth/error?error=${encodeURIComponent("Missing auth code or token")}`
  );
}
