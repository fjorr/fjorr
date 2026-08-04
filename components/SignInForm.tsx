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
  layout = 'page',
  variant = 'light',
}: {
  nextPath?: string;
  layout?: 'page' | 'menu';
  /** Navbar glass variant: light = light text on dark glass. */
  variant?: 'light' | 'dark';
}) {
  const t = useTranslations('Account');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'oauth' | 'sent' | 'error'
  >('idle');
  const [error, setError] = useState<string | null>(null);
  const isMenu = layout === 'menu';
  const onDarkGlass = !isMenu || variant === 'light';
  const busy = status === 'loading' || status === 'oauth';

  const titleColor = onDarkGlass ? 'text-white' : 'text-black';
  const bodyColor = onDarkGlass ? 'text-white/55' : 'text-black/55';
  const labelColor = onDarkGlass ? 'text-white/35' : 'text-black/35';
  const dividerColor = onDarkGlass ? 'border-white/10' : 'border-black/8';
  const oauthClass = onDarkGlass
    ? 'h-11 rounded-full bg-white/5 hover:bg-white/10 text-white font-sans text-[14px] font-semibold disabled:opacity-40 transition-all active:scale-[0.98] flex items-center justify-center gap-2.5'
    : 'h-11 rounded-full bg-black/5 hover:bg-black/8 text-black font-sans text-[14px] font-semibold disabled:opacity-40 transition-all active:scale-[0.98] flex items-center justify-center gap-2.5';
  const inputClass = onDarkGlass
    ? 'h-11 rounded-[10px] bg-white/5 px-3.5 font-sans text-[15px] text-white placeholder:text-white/35 focus:bg-white/10 focus:outline-none transition-colors'
    : 'h-11 rounded-[10px] bg-black/5 px-3.5 font-sans text-[15px] text-black placeholder:text-black/35 focus:bg-black/8 focus:outline-none transition-colors';
  const ctaClass = onDarkGlass
    ? 'h-11 rounded-full bg-white text-black font-sans text-[14px] font-bold hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]'
    : 'h-11 rounded-full bg-black text-white font-sans text-[14px] font-bold hover:bg-black/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]';
  const secondaryClass = onDarkGlass
    ? 'font-sans text-[13px] font-semibold text-white/40 hover:text-white/70 transition-colors'
    : 'font-sans text-[13px] font-semibold text-black/40 hover:text-black/70 transition-colors';

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

  const titleClass = isMenu
    ? `font-sans text-[15px] font-semibold tracking-tight text-left ${titleColor}`
    : 'font-sans text-2xl font-bold tracking-tight text-white text-center';
  const bodyClass = isMenu
    ? `font-sans text-[13px] leading-snug text-left ${bodyColor}`
    : 'font-sans text-[16px] text-white/55 leading-relaxed text-center';

  if (status === 'sent') {
    return (
      <div className={`w-full ${isMenu ? '' : 'max-w-sm'} flex flex-col gap-3`}>
        <h2 className={titleClass}>{t('checkEmailTitle')}</h2>
        <p className={bodyClass}>{t('checkEmailBody', { email })}</p>
        <button
          type="button"
          onClick={() => {
            setStatus('idle');
            setEmail('');
          }}
          className={`mt-1 ${secondaryClass} ${isMenu ? 'self-start' : 'self-center'}`}
        >
          {t('useDifferentEmail')}
        </button>
      </div>
    );
  }

  const heading = isMenu ? t('modalTitle') : t('signInTitle');
  const body = t('signInBody');

  return (
    <div
      className={`w-full ${isMenu ? '' : 'max-w-sm'} flex flex-col ${isMenu ? 'gap-4' : 'gap-5'}`}
    >
      <div className={`flex flex-col ${isMenu ? 'gap-1.5' : 'gap-2'}`}>
        <h2 className={titleClass}>{heading}</h2>
        <p className={bodyClass}>{body}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-left">
          <span
            className={`font-sans text-[13px] font-semibold normal-case tracking-normal ${
              isMenu ? labelColor : 'text-white/50'
            }`}
          >
            {t('email')}
          </span>
          <input
            type="email"
            required
            autoComplete="email"
            autoFocus={isMenu}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('emailPlaceholder')}
            disabled={busy}
            className={
              isMenu
                ? inputClass
                : 'h-12 rounded-[10px] bg-white/5 px-4 font-sans text-[15px] text-white placeholder:text-white/35 focus:bg-white/10 focus:outline-none transition-colors disabled:opacity-40'
            }
          />
        </label>

        {error && (
          <div className="flex flex-col gap-2 text-left">
            <p className="font-sans text-[13px] text-red-400/90">{error}</p>
            {error === t('createViaBureaux') ? (
              <Link
                href="/bureaux"
                className={`font-sans text-[13px] font-semibold underline underline-offset-2 ${
                  onDarkGlass ? 'text-white/80' : 'text-black/80'
                }`}
              >
                {t('createViaBureauxCta')}
              </Link>
            ) : null}
          </div>
        )}

        <button
          type="submit"
          disabled={busy || !email.trim()}
          className={
            isMenu
              ? ctaClass
              : 'h-12 rounded-full bg-white text-black font-sans text-[15px] font-bold hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]'
          }
        >
          {status === 'loading' ? t('sending') : t('sendLink')}
        </button>
      </form>

      <div className="flex items-center gap-3">
        <div className={`h-px flex-1 border-t ${dividerColor}`} />
        <span className={`font-sans text-[12px] font-medium ${labelColor}`}>
          {t('orGoogle')}
        </span>
        <div className={`h-px flex-1 border-t ${dividerColor}`} />
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={() => handleOAuth('google')}
        className={oauthClass}
      >
        <GoogleGlyph className="w-[18px] h-[18px]" />
        {t('continueGoogle')}
      </button>

      <p className={`font-sans text-[12px] leading-snug ${bodyColor}`}>
        {t('createViaBureaux')}{' '}
        <Link
          href="/bureaux"
          className="font-semibold underline underline-offset-2"
        >
          {t('createViaBureauxCta')}
        </Link>
      </p>
    </div>
  );
}
