'use client';

import React, { useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Provider } from '@supabase/supabase-js';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';

const HEAD =
  "m-0 text-balance font-[family-name:var(--font-circular-black)] text-[clamp(2.25rem,5.5vw,3rem)] font-[900] leading-[1.05] tracking-[-0.03em] text-[#0B0B0C]";
const LEAD =
  'm-0 mt-4 max-w-[26rem] font-sans text-[16px] font-medium leading-relaxed text-black/55 md:text-[17px]';

function stashAuthNext(nextPath: string) {
  try {
    document.cookie = `fjorr_auth_next=${encodeURIComponent(nextPath)}; Path=/; Max-Age=900; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

function authRedirectTo() {
  // Path-only — query strings can fail allow-list matching.
  return `${window.location.origin}/auth/confirm`;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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

export default function SignInForm({
  nextPath = '/bureaux',
}: {
  nextPath?: string;
  /** @deprecated Menu dropdown removed — prop kept for call-site compatibility. */
  layout?: 'page' | 'menu';
  variant?: 'light' | 'dark';
}) {
  const t = useTranslations('Account');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'oauth' | 'sent' | 'error'
  >('idle');
  const [error, setError] = useState<string | null>(null);
  const [errorOn, setErrorOn] = useState<'email' | 'oauth' | null>(null);
  const busy = status === 'loading' || status === 'oauth';
  const emailError = errorOn === 'email' && error ? error : null;
  const oauthError = errorOn === 'oauth' && error ? error : null;

  const handleOAuth = async (provider: Provider) => {
    setStatus('oauth');
    setError(null);
    setErrorOn(null);
    try {
      stashAuthNext(nextPath);
      const supabase = createClient();
      const { error: oauthErrorResult } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: authRedirectTo(),
        },
      });
      if (oauthErrorResult) throw oauthErrorResult;
      // Browser navigates away to the provider.
    } catch (err: unknown) {
      setStatus('error');
      setErrorOn('oauth');
      setError(err instanceof Error ? err.message : t('errorGeneric'));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = email.trim();

    if (!trimmed) {
      setStatus('error');
      setErrorOn('email');
      setError(t('emailRequired'));
      return;
    }
    if (!isValidEmail(trimmed)) {
      setStatus('error');
      setErrorOn('email');
      setError(t('emailInvalid'));
      return;
    }

    setStatus('loading');
    setError(null);
    setErrorOn(null);

    try {
      const supabase = createClient();
      stashAuthNext(nextPath);
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: authRedirectTo(),
        },
      });

      if (otpError) throw otpError;
      setStatus('sent');
    } catch (err: unknown) {
      setStatus('error');
      setErrorOn('email');
      const message = err instanceof Error ? err.message : t('errorGeneric');
      // Unknown email / signups disabled — accounts come from paid Bureaux join.
      if (/signups not allowed|user not found|unable to validate/i.test(message)) {
        setError(t('noAccount'));
      } else {
        setError(message);
      }
    }
  };

  if (status === 'sent') {
    return (
      <div className="flex w-full max-w-[22rem] flex-col items-center text-center">
        <h1 className={HEAD}>{t('checkEmailTitle')}</h1>
        <p className={LEAD}>{t('checkEmailBody', { email })}</p>
        <button
          type="button"
          onClick={() => {
            setStatus('idle');
            setEmail('');
            setError(null);
            setErrorOn(null);
          }}
          className="mt-8 border-0 bg-transparent p-0 font-sans text-[15px] font-medium text-black/45 transition-colors hover:text-[#0B0B0C]"
        >
          {t('useDifferentEmail')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-[22rem] flex-col items-center text-center">
      <h1 className={HEAD}>{t('signInTitle')}</h1>
      <p className={LEAD}>{t('signInBody')}</p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 w-full">
        <div
          className={`relative flex h-12 items-center rounded-full pl-8 pr-1.5 ${
            emailError ? 'bg-red-600' : 'bg-[#F5F5F7]'
          }`}
        >
          <input
            type="email"
            autoComplete="email"
            autoFocus
            aria-label={t('email')}
            aria-invalid={emailError ? true : undefined}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errorOn === 'email') {
                setError(null);
                setErrorOn(null);
                if (status === 'error') setStatus('idle');
              }
            }}
            onFocus={() => {
              if (errorOn === 'email') {
                setError(null);
                setErrorOn(null);
                if (status === 'error') setStatus('idle');
              }
            }}
            placeholder={emailError ? '' : t('email')}
            disabled={busy}
            className={`min-w-0 flex-1 border-0 bg-transparent font-sans text-[16px] font-medium outline-none disabled:opacity-50 ${
              emailError
                ? 'text-transparent caret-transparent'
                : 'text-[#0B0B0C] placeholder:text-black/35'
            }`}
          />
          {emailError ? (
            <span className="pointer-events-none absolute inset-y-0 left-8 right-12 flex items-center truncate font-sans text-[16px] font-medium text-white">
              {emailError}
            </span>
          ) : null}
          <button
            type="submit"
            disabled={busy || !email.trim() || Boolean(emailError)}
            aria-label={
              emailError
                ? emailError
                : status === 'loading'
                  ? t('sending')
                  : t('sendLink')
            }
            className={`relative z-[1] inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ${
              emailError
                ? 'cursor-default bg-white/25'
                : 'bg-[#0B0B0C] transition-opacity hover:opacity-90 disabled:opacity-40'
            }`}
          >
            {emailError ? (
              <X className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
            ) : (
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
            )}
          </button>
        </div>
      </form>

      <div className="mt-8 flex flex-col items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => handleOAuth('google')}
          className="inline-flex items-center gap-2 border-0 bg-transparent p-0 font-sans text-[15px] font-medium text-black/45 transition-colors hover:text-[#0B0B0C] disabled:opacity-40"
        >
          <GoogleGlyph className="h-3.5 w-3.5" />
          {oauthError || t('continueGoogle')}
        </button>
        <p className="m-0 font-sans text-[15px] font-medium text-black/45">
          {t('createViaBureaux')}{' '}
          <Link
            href="/bureaux"
            className="text-[#0B0B0C] transition-opacity hover:opacity-70"
          >
            {t('createViaBureauxCta')}
          </Link>
        </p>
      </div>
    </div>
  );
}
