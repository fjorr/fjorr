'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';

export default function SignInForm({
  nextPath = '/account',
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
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const isMenu = layout === 'menu';
  const onDarkGlass = !isMenu || variant === 'light';

  const titleColor = onDarkGlass ? 'text-white' : 'text-black';
  const bodyColor = onDarkGlass ? 'text-white/55' : 'text-black/55';
  const labelColor = onDarkGlass ? 'text-white/35' : 'text-black/35';
  const inputClass = onDarkGlass
    ? 'h-11 rounded-[10px] bg-white/5 px-3.5 font-sans text-[15px] text-white placeholder:text-white/35 focus:bg-white/10 focus:outline-none transition-colors'
    : 'h-11 rounded-[10px] bg-black/5 px-3.5 font-sans text-[15px] text-black placeholder:text-black/35 focus:bg-black/8 focus:outline-none transition-colors';
  const ctaClass = onDarkGlass
    ? 'h-11 rounded-full bg-white text-black font-sans text-[14px] font-bold hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]'
    : 'h-11 rounded-full bg-black text-white font-sans text-[14px] font-bold hover:bg-black/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]';
  const secondaryClass = onDarkGlass
    ? 'font-sans text-[13px] font-semibold text-white/40 hover:text-white/70 transition-colors'
    : 'font-sans text-[13px] font-semibold text-black/40 hover:text-black/70 transition-colors';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('loading');
    setError(null);

    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const redirectTo = `${origin}/auth/confirm?next=${encodeURIComponent(nextPath)}`;

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: redirectTo,
        },
      });

      if (otpError) throw otpError;
      setStatus('sent');
    } catch (err: unknown) {
      setStatus('error');
      setError(err instanceof Error ? err.message : t('errorGeneric'));
    }
  };

  const titleClass = isMenu
    ? `font-sans text-[15px] font-semibold tracking-tight text-left ${titleColor}`
    : 'font-sans text-2xl font-bold tracking-tight text-white text-center';
  const bodyClass = isMenu
    ? `font-sans text-[13px] leading-snug text-left ${bodyColor}`
    : 'font-sans text-[15px] text-white/55 leading-relaxed text-center';

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

  return (
    <form
      onSubmit={handleSubmit}
      className={`w-full ${isMenu ? '' : 'max-w-sm'} flex flex-col ${isMenu ? 'gap-4' : 'gap-5'}`}
    >
      <div className={`flex flex-col ${isMenu ? 'gap-1.5' : 'gap-2'}`}>
        <h2 className={titleClass}>{isMenu ? t('modalTitle') : t('signInTitle')}</h2>
        <p className={bodyClass}>{t('signInBody')}</p>
      </div>

      <label className="flex flex-col gap-2 text-left">
        <span
          className={`font-sans text-[12px] font-semibold uppercase tracking-wide ${
            isMenu ? labelColor : 'text-white/35'
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
          className={
            isMenu
              ? inputClass
              : 'h-12 rounded-[10px] bg-white/5 px-4 font-sans text-[15px] text-white placeholder:text-white/35 focus:bg-white/10 focus:outline-none transition-colors'
          }
        />
      </label>

      {error && (
        <p className="font-sans text-[13px] text-red-400/90 text-left">{error}</p>
      )}

      <button
        type="submit"
        disabled={status === 'loading' || !email.trim()}
        className={
          isMenu
            ? ctaClass
            : 'h-12 rounded-full bg-white text-black font-sans text-[15px] font-bold hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]'
        }
      >
        {status === 'loading' ? t('sending') : t('sendLink')}
      </button>
    </form>
  );
}
