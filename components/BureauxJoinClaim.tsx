'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';

const DEFAULT_NEXT = '/account/bureaux';

function stashAuthNext(nextPath: string) {
  try {
    document.cookie = `fjorr_auth_next=${encodeURIComponent(nextPath)}; Path=/; Max-Age=900; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

function authRedirectTo() {
  return `${window.location.origin}/auth/confirm`;
}

function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

/**
 * After guest checkout (incl. 3DS redirect), send a magic link and show finish-account.
 */
export default function BureauxJoinClaim({
  email,
  nextPath = DEFAULT_NEXT,
  autoSend = true,
}: {
  email: string;
  /** Post-auth destination — stashed in fjorr_auth_next. */
  nextPath?: string;
  /** When false, OTP was already sent (e.g. checkout just succeeded). */
  autoSend?: boolean;
}) {
  const t = useTranslations('Bureaux');
  const [status, setStatus] = useState<'sending' | 'sent' | 'error' | 'oauth'>(
    autoSend ? 'sending' : 'sent'
  );
  const [error, setError] = useState<string | null>(null);
  const sent = useRef(!autoSend);
  const safeNext =
    nextPath.startsWith('/') && !nextPath.startsWith('//')
      ? nextPath
      : DEFAULT_NEXT;

  const sendOtp = useCallback(async () => {
    stashAuthNext(safeNext);
    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: authRedirectTo(),
      },
    });
    if (otpError) throw otpError;
  }, [email, safeNext]);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;

    void (async () => {
      try {
        await sendOtp();
        setStatus('sent');
      } catch (err) {
        setStatus('error');
        setError(
          err instanceof Error ? err.message : t('joinCheckEmailError')
        );
      }
    })();
  }, [sendOtp, t]);

  const handleResend = async () => {
    setStatus('sending');
    setError(null);
    try {
      await sendOtp();
      setStatus('sent');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : t('joinCheckEmailError'));
    }
  };

  const handleGoogle = async () => {
    setStatus('oauth');
    setError(null);
    try {
      stashAuthNext(safeNext);
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: authRedirectTo(),
        },
      });
      if (oauthError) throw oauthError;
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : t('joinCheckEmailError'));
    }
  };

  const busy = status === 'sending' || status === 'oauth';

  return (
    <div className="w-full max-w-sm flex flex-col items-stretch sm:items-center gap-3 text-left sm:text-center">
      <h2 className="m-0 font-sans text-[18px] font-semibold tracking-tight text-page">
        {t('joinPaidTitle')}
      </h2>
      <p className="m-0 font-sans text-[16px] text-page-muted leading-relaxed">
        {status === 'sending'
          ? t('ctaPending')
          : status === 'error'
            ? error || t('joinCheckEmailError')
            : t('joinPaidBody', { email })}
      </p>

      <div className="w-full flex flex-col gap-3 items-stretch sm:items-center">
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleResend()}
          className="font-sans text-[13px] font-semibold text-page-muted underline underline-offset-2 hover:text-page transition-colors bg-transparent border-0 p-0 cursor-pointer disabled:opacity-40 self-start sm:self-center"
        >
          {t('joinResend')}
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() => void handleGoogle()}
          className="w-full h-12 rounded-full bg-page-chip hover:bg-page-chip-hover text-page font-sans text-[14px] font-semibold disabled:opacity-40 transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 border-0 cursor-pointer"
        >
          <GoogleGlyph className="w-[18px] h-[18px]" />
          {t('joinContinueGoogle')}
        </button>

        <Link
          href={`/signin?next=${encodeURIComponent(safeNext)}`}
          className="font-sans text-[13px] font-semibold text-page-muted underline underline-offset-2 hover:text-page transition-colors self-start sm:self-center"
        >
          {t('joinCheckEmailSignIn')}
        </Link>

        {status === 'error' ? (
          <a
            href="mailto:control@fjorr.com"
            className="font-sans text-[13px] font-medium text-page-faint hover:text-page-muted underline underline-offset-2 transition-colors self-start sm:self-center"
          >
            {t('joinSupport')}
          </a>
        ) : null}
      </div>
    </div>
  );
}
