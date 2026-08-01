import { createClient } from '@/lib/supabase/server';
import { isOwnBureauxActive } from '@/lib/bureaux';
import { safeInternalPath } from '@/lib/site-gate';
import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { redirect } from 'next/navigation';

function resolvePostAuthPath(next: string, bureauxActive: boolean) {
  const path = next.split('?')[0] || '/';
  const joiningBureaux = path === '/bureaux' || path.startsWith('/bureaux/');

  // Unpaid sessions may only land on Bureaux join/checkout.
  if (!bureauxActive && !joiningBureaux) {
    return '/bureaux';
  }

  return next;
}

/**
 * Completes magic-link / OTP / OAuth sign-in.
 * Supports token_hash (email templates) and PKCE `code` exchange.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const code = searchParams.get('code');
  const nextFromQuery = searchParams.get('next');
  const nextFromCookie = request.cookies.get('fjorr_auth_next')?.value ?? null;
  const requestedNext = safeInternalPath(
    nextFromQuery ?? nextFromCookie,
    '/bureaux'
  );

  const supabase = await createClient();

  const clearNextCookie = (response: NextResponse) => {
    response.cookies.set('fjorr_auth_next', '', { path: '/', maxAge: 0 });
    return response;
  };

  const finish = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const bureauxActive = user ? await isOwnBureauxActive(user.id) : false;
    const next = resolvePostAuthPath(requestedNext, bureauxActive);
    const res = NextResponse.redirect(new URL(next, request.nextUrl.origin));
    return clearNextCookie(res);
  };

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return finish();
    }
    redirect(`/auth/error?error=${encodeURIComponent(error.message)}`);
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      return finish();
    }
    redirect(`/auth/error?error=${encodeURIComponent(error.message)}`);
  }

  redirect(
    `/auth/error?error=${encodeURIComponent('Missing auth code or token')}`
  );
}
