'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import SheetEnter from '@/components/house/SheetEnter';
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

export default function SignInForm({
  nextPath = '/account/bureaux',
}: {
  nextPath?: string;
  /** @deprecated Menu dropdown removed — prop kept for call-site compatibility. */
  layout?: 'page' | 'menu';
  variant?: 'light' | 'dark';
}) {
  const t = useTranslations('Account');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorLabel, setErrorLabel] = useState<string | null>(null);
  const [errorOn, setErrorOn] = useState<'email' | null>(null);
  const [fieldOpen, setFieldOpen] = useState(false);
  const [reduced, setReduced] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const busy = status === 'loading';
  const emailError = errorOn === 'email' && error ? error : null;

  useEffect(() => {
    if (emailError) {
      setErrorLabel(emailError);
      return;
    }
    const id = window.setTimeout(() => setErrorLabel(null), 420);
    return () => window.clearTimeout(id);
  }, [emailError]);

  const sendLink = async (address: string) => {
    const supabase = createClient();
    stashAuthNext(nextPath);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: address,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: authRedirectTo(),
      },
    });
    if (otpError) throw otpError;
  };

  const readSendError = (err: unknown) => {
    const message = err instanceof Error ? err.message : t('errorGeneric');
    if (/signups not allowed|user not found|unable to validate/i.test(message)) {
      return t('noAccount');
    }
    return message;
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
      await sendLink(trimmed);
      setStatus('sent');
    } catch (err: unknown) {
      setStatus('error');
      setErrorOn('email');
      setError(readSendError(err));
    }
  };

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || fieldOpen) return;
    if (reduced) {
      video.pause();
      return;
    }
    void video.play().catch(() => {});
  }, [fieldOpen, reduced]);

  const openField = () => {
    if (fieldOpen) return;
    videoRef.current?.pause();
    const el = shellRef.current;
    if (!el || reduced) {
      setFieldOpen(true);
      window.setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }
    el.style.height = `${el.getBoundingClientRect().height}px`;
    setFieldOpen(true);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (shellRef.current) shellRef.current.style.height = '48px';
      });
    });
    window.setTimeout(() => inputRef.current?.focus(), 460);
  };

  const clearField = () => {
    setEmail('');
    setError(null);
    setErrorOn(null);
    if (status === 'error') setStatus('idle');
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const resendLink = async () => {
    const trimmed = email.trim();
    if (!trimmed || resending) return;
    setResending(true);
    setError(null);
    setErrorOn(null);
    try {
      await sendLink(trimmed);
    } catch (err: unknown) {
      setErrorOn('email');
      setError(readSendError(err));
    } finally {
      setResending(false);
    }
  };

  if (status === 'sent') {
    return (
      <div className="flex w-full max-w-[40rem] flex-col items-center text-center">
        <h1 className={`${HEAD} md:whitespace-nowrap md:text-[3rem]`}>
          {t('checkEmailTitle')}
        </h1>
        <p className="m-0 mt-4 max-w-[28.75rem] text-pretty font-sans text-[16px] font-medium leading-relaxed text-black/55 md:text-[17px]">
          {t.rich('checkEmailBody', {
            email,
            address: (chunks) => (
              <span className="text-[#0B0B0C]">{chunks}</span>
            ),
          })}
        </p>
        <p className="m-0 mt-6 max-w-[26rem] font-sans text-[15px] font-medium leading-relaxed text-black/45">
          {t.rich('checkEmailHint', {
            again: (chunks) => (
              <button
                type="button"
                onClick={resendLink}
                disabled={resending}
                className="text-[#0B0B0C] underline decoration-[1px] underline-offset-[3px] transition-opacity hover:opacity-70 disabled:opacity-40"
              >
                {resending ? t('sending') : chunks}
              </button>
            ),
          })}
        </p>
        {error ? (
          <p className="m-0 mt-3 font-sans text-[14px] font-medium text-black/45">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setStatus('idle');
            setResending(false);
            setEmail('');
            setError(null);
            setErrorOn(null);
          }}
          className="mt-4 border-0 bg-transparent p-0 font-sans text-[15px] font-medium text-black/45 transition-colors hover:text-[#0B0B0C]"
        >
          {t('useDifferentEmail')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-[22rem] flex-col items-center text-center">
      <div
        className={`grid w-full transition-[grid-template-rows,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          fieldOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <h1 className={HEAD}>{t('signInTitle')}</h1>
          <p className={LEAD}>{t('signInBody')}</p>
        </div>
      </div>

      <SheetEnter className="w-full">
      <div
        ref={shellRef}
        className={`relative w-full overflow-hidden motion-reduce:transition-none ${
          fieldOpen ? 'mt-6' : ''
        } ${
          fieldOpen
            ? emailError
              ? 'h-12 rounded-full bg-red-600'
              : 'h-12 rounded-full bg-[#F5F5F7]'
            : 'aspect-[4/3] rounded-[22px] bg-black'
        } ${
          reduced
            ? ''
            : '[transition:height_700ms_cubic-bezier(0.22,1,0.36,1),border-radius_700ms_cubic-bezier(0.22,1,0.36,1),margin_700ms_cubic-bezier(0.22,1,0.36,1),background-color_480ms_cubic-bezier(0.22,1,0.36,1)]'
        }`}
      >
        <button
          type="button"
          onClick={openField}
          aria-label={t('email')}
          tabIndex={fieldOpen ? -1 : 0}
          className={`absolute inset-0 border-0 p-0 transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
            fieldOpen ? 'pointer-events-none opacity-0' : 'cursor-pointer opacity-100'
          }`}
        >
          <video
            ref={videoRef}
            src="/enter-holy-grail.mp4"
            poster="/enter-holy-grail.jpg"
            muted
            loop
            playsInline
            preload="auto"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-3.5 right-3.5 z-[1] inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#0B0B0C]"
          >
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} />
          </span>
        </button>
        <form
          onSubmit={handleSubmit}
          noValidate
          className={`absolute inset-0 flex items-center pl-8 pr-1.5 transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
            fieldOpen ? 'opacity-100 delay-200' : 'pointer-events-none opacity-0'
          }`}
        >
          <input
            ref={inputRef}
            type="email"
            autoComplete="email"
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
            placeholder={t('email')}
            disabled={busy}
            tabIndex={fieldOpen ? 0 : -1}
            className={`min-w-0 flex-1 border-0 bg-transparent font-sans text-[16px] font-medium text-[#0B0B0C] outline-none transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] placeholder:text-black/35 motion-reduce:transition-none disabled:opacity-50 ${
              emailError ? 'opacity-0' : 'opacity-100'
            }`}
          />
          <span
            aria-live="polite"
            className={`pointer-events-none absolute inset-y-0 left-8 right-12 flex items-center truncate font-sans text-[16px] font-medium text-white transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
              emailError ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {errorLabel}
          </span>
          <button
            type={emailError ? 'button' : 'submit'}
            onClick={emailError ? clearField : undefined}
            disabled={!emailError && (busy || !email.trim())}
            tabIndex={fieldOpen ? 0 : -1}
            aria-label={
              emailError
                ? t('clearEmail')
                : status === 'loading'
                  ? t('sending')
                  : t('sendLink')
            }
            className={`relative z-[1] inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-[background-color,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none active:scale-95 ${
              emailError
                ? 'bg-white/25'
                : 'bg-[#0B0B0C] hover:opacity-90 disabled:opacity-40'
            }`}
          >
            <span className="grid h-3.5 w-3.5 place-items-center">
              <X
                className={`col-start-1 row-start-1 h-3.5 w-3.5 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                  emailError ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
                }`}
                strokeWidth={2.25}
                aria-hidden
              />
              <ArrowRight
                className={`col-start-1 row-start-1 h-3.5 w-3.5 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                  emailError ? 'scale-75 opacity-0' : 'scale-100 opacity-100'
                }`}
                strokeWidth={2.25}
                aria-hidden
              />
            </span>
          </button>
        </form>
      </div>
      </SheetEnter>

      {fieldOpen ? (
        <SheetEnter className="w-full">
          <p className="m-0 mt-4 max-w-[22rem] text-pretty font-sans text-[13px] font-medium leading-relaxed text-black/40">
            {t('enterClipCaption')}
          </p>
        </SheetEnter>
      ) : null}

      <SheetEnter delay={140}>
        <p className={`m-0 font-sans text-[15px] font-medium text-black/45 ${fieldOpen ? 'mt-6' : 'mt-8'}`}>
          {t('createViaBureaux')}{' '}
          <Link
            href="/bureaux"
            className="text-[#0B0B0C] transition-opacity hover:opacity-70"
          >
            {t('createViaBureauxCta')}
          </Link>
        </p>
      </SheetEnter>
    </div>
  );
}
