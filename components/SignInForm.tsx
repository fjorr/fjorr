'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Provider } from '@supabase/supabase-js';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';

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
  const busy = status === 'loading' || status === 'oauth';

  const handleOAuth = async (provider: Provider) => {
    setStatus('oauth');
    setError(null);
    try {
      stashAuthNext(nextPath);
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: authRedirectTo(),
        },
      });
      if (oauthError) throw oauthError;
      // Browser navigates away to the provider.
    } catch (err: unknown) {
      setStatus('error');
      setError(err instanceof Error ? err.message : t('errorGeneric'));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('loading');
    setError(null);

    try {
      const supabase = createClient();
      stashAuthNext(nextPath);
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: false,
          emailRedirectTo: authRedirectTo(),
        },
      });

      if (otpError) throw otpError;
      setStatus('sent');
    } catch (err: unknown) {
      setStatus('error');
      const message = err instanceof Error ? err.message : t('errorGeneric');
      // Unknown email / signups disabled — accounts come from paid Bureaux join.
      if (/signups not allowed|user not found|unable to validate/i.test(message)) {
        setError(t('createViaBureaux'));
      } else {
        setError(message);
      }
    }
  };

  if (status === 'sent') {
    return (
      <div className="w-full max-w-sm flex flex-col items-center gap-3 text-center opacity-0 animate-slide-up style-delay-headline">
        <h1 className="m-0 font-interTight text-4xl sm:text-5xl font-extrabold tracking-tight text-page leading-[1.05]">
          {t('checkEmailTitle')}
        </h1>
        <p className="m-0 font-sans text-[16px] text-page-muted leading-relaxed">
          {t('checkEmailBody', { email })}
        </p>
        <button
          type="button"
          onClick={() => {
            setStatus('idle');
            setEmail('');
          }}
          className="mt-1 font-sans text-[13px] font-semibold text-page-faint hover:text-page-muted transition-colors bg-transparent border-0 p-0 cursor-pointer"
        >
          {t('useDifferentEmail')}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm flex flex-col gap-5 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="m-0 font-interTight text-4xl sm:text-5xl font-extrabold tracking-tight text-page leading-[1.05] opacity-0 animate-slide-up style-delay-headline">
          {t('signInTitle')}
        </h1>
        <p className="m-0 font-sans text-[16px] text-page-muted leading-relaxed opacity-0 animate-slide-up style-delay-body">
          {t('signInBody')}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 text-left opacity-0 animate-slide-up style-delay-form"
      >
        <input
          type="email"
          required
          autoComplete="email"
          autoFocus
          aria-label={t('email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
          disabled={busy}
          className="w-full rounded-xl px-5 py-4 bg-page-chip font-sans font-semibold text-[15px] text-page placeholder-page-muted border border-page-faint focus:outline-none focus:border-[color-mix(in_srgb,var(--page-fg)_35%,transparent)] disabled:opacity-40 transition-colors"
        />

        {error ? (
          <div className="flex flex-col gap-2">
            <p className="m-0 font-sans text-[13px] text-[#C45B4A]">{error}</p>
            {error === t('createViaBureaux') ? (
              <Link
                href="/bureaux"
                className="font-sans text-[13px] font-semibold text-page underline underline-offset-2"
              >
                {t('createViaBureauxCta')}
              </Link>
            ) : null}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={busy || !email.trim()}
          className="w-full h-14 inline-flex items-center justify-center rounded-full bg-[var(--page-fg)] text-[var(--page-bg)] font-sans text-[15px] font-bold tracking-tight shadow-2xl hover:opacity-90 active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none"
        >
          {status === 'loading' ? t('sending') : t('sendLink')}
        </button>
      </form>

      <div className="flex flex-col gap-5 opacity-0 animate-slide-up style-delay-form">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 border-t border-page-faint" />
          <span className="font-sans text-[12px] font-medium text-page-faint">
            {t('orGoogle')}
          </span>
          <div className="h-px flex-1 border-t border-page-faint" />
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => handleOAuth('google')}
          className="h-12 rounded-full bg-page-chip hover:bg-page-chip-hover text-page font-sans text-[14px] font-semibold disabled:opacity-40 transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 border-0 cursor-pointer"
        >
          <GoogleGlyph className="w-[18px] h-[18px]" />
          {t('continueGoogle')}
        </button>

        <p className="m-0 font-sans text-[13px] leading-snug text-page-faint">
          {t('createViaBureaux')}{' '}
          <Link
            href="/bureaux"
            className="font-semibold text-page-muted underline underline-offset-2 hover:text-page transition-colors"
          >
            {t('createViaBureauxCta')}
          </Link>
        </p>
      </div>
    </div>
  );
}
