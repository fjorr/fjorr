import type { NextRequest, NextResponse } from 'next/server';

const PERMISSIONS =
  'camera=(), microphone=(), geolocation=(), browsing-topics=()';

/** Document policy for the house. Embeds keep their own frame-ancestors. */
export function contentSecurityPolicy(): string {
  const dev = process.env.NODE_ENV !== 'production' ? " 'unsafe-eval'" : '';
  let supabase = '';
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (raw) {
    try {
      const url = new URL(raw);
      supabase = ` ${url.origin} wss://${url.host}`;
    } catch {
      supabase = '';
    }
  }

  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${dev} https://js.stripe.com https://src.litix.io`,
    "style-src 'self' 'unsafe-inline'",
    'img-src \'self\' data: blob: https://media.fjorr.com https://image.mux.com https://*.stripe.com',
    "font-src 'self' data:",
    'media-src \'self\' blob: https://stream.mux.com https://*.mux.com https://media.fjorr.com',
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co${supabase} https://api.stripe.com https://merchant-ui-api.stripe.com https://r.stripe.com https://q.stripe.com https://m.stripe.network https://*.stripe.com https://stream.mux.com https://*.mux.com https://*.litix.io https://media.fjorr.com`,
    "worker-src 'self' blob:",
    'frame-src \'self\' https://js.stripe.com https://hooks.stripe.com https://m.stripe.network https://*.stripe.com',
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ');
}

export function withSecurityHeaders(
  request: NextRequest,
  response: NextResponse
) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', PERMISSIONS);
  const embed = request.nextUrl.pathname.startsWith('/embed');
  if (!embed) {
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    if (!response.headers.has('Content-Security-Policy')) {
      response.headers.set('Content-Security-Policy', contentSecurityPolicy());
    }
  }
  return response;
}
