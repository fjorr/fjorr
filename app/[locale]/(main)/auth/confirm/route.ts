import { createServerClient } from '@supabase/ssr';
import { isOwnBureauxActive } from '@/lib/bureaux';
import { syncStripeCustomerEmail } from '@/lib/bureaux-actions';
import { safeInternalPath } from '@/lib/site-gate';
import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

function supabaseAnonKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function resolvePostAuthPath(next: string, bureauxActive: boolean) {
  const path = next.split('?')[0] || '/';
  const joiningBureaux = path === '/bureaux' || path.startsWith('/bureaux/');

  // Unpaid sessions may only land on Bureaux join/checkout.
  if (!bureauxActive && !joiningBureaux) {
    return '/bureaux';
  }

  return next;
}

function errorRedirect(request: NextRequest, message: string) {
  const url = new URL('/auth/error', request.nextUrl.origin);
  url.searchParams.set('error', message);
  return NextResponse.redirect(url);
}

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse['cookies']['set']>[2];
};

/**
 * Completes magic-link / OTP / OAuth sign-in.
 * Supports token_hash (email templates) and PKCE `code` exchange.
 * Session cookies are written onto the redirect response (Next 15+/16).
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

  const cookiesToSet: CookieToSet[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(next) {
          cookiesToSet.push(...next);
        },
      },
    }
  );

  const finish = async (syncStripeEmail = false) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (syncStripeEmail && user?.id && user.email) {
      await syncStripeCustomerEmail(user.id, user.email);
    }
    const bureauxActive = user ? await isOwnBureauxActive(user.id) : false;
    const next = resolvePostAuthPath(requestedNext, bureauxActive);
    const response = NextResponse.redirect(
      new URL(next, request.nextUrl.origin)
    );
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
    response.cookies.set('fjorr_auth_next', '', { path: '/', maxAge: 0 });
    return response;
  };

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // PKCE email-change often arrives as code; next points at Bureaux.
      const syncStripe = requestedNext.includes('/account/bureaux');
      return finish(syncStripe);
    }
    return errorRedirect(request, error.message);
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      return finish(type === 'email_change');
    }
    return errorRedirect(request, error.message);
  }

  return errorRedirect(request, 'Missing auth code or token');
}
