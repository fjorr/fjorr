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

/**
 * After guest checkout (incl. 3DS redirect), send a magic link and show finish-account.
 */
export default function BureauxJoinClaim({
  email,
  nextPath = DEFAULT_NEXT,
  autoSend = true,
  bureauxNumber: bureauxNumberProp = null,
}: {
  email: string;
  /** Post-auth destination — stashed in fjorr_auth_next. */
  nextPath?: string;
  /** When false, OTP was already sent (e.g. checkout just succeeded). */
  autoSend?: boolean;
  /** Known Bureaux No. — otherwise fetched after payment. */
  bureauxNumber?: number | null;
}) {
  const t = useTranslations('Bureaux');
  const tNav = useTranslations('Nav');
  const [status, setStatus] = useState<'sending' | 'sent' | 'error'>(
    autoSend ? 'sending' : 'sent'
  );
  const [error, setError] = useState<string | null>(null);
  const [bureauxNumber, setBureauxNumber] = useState<number | null>(
    bureauxNumberProp
  );
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
    if (bureauxNumberProp != null) setBureauxNumber(bureauxNumberProp);
  }, [bureauxNumberProp]);

  useEffect(() => {
    if (bureauxNumber != null) return;
    let cancelled = false;
    let attempts = 0;

    const pull = async () => {
      attempts += 1;
      try {
        const res = await fetch('/api/bureaux/join-number', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ email }),
        });
        const data = (await res.json()) as { number?: number | null };
        const n = Number(data.number);
        if (!cancelled && Number.isFinite(n) && n >= 1) {
          setBureauxNumber(n);
          return true;
        }
      } catch {
        /* retry */
      }
      return false;
    };

    void pull();
    const id = window.setInterval(() => {
      if (attempts >= 12) {
        window.clearInterval(id);
        return;
      }
      void pull().then((ok) => {
        if (ok) window.clearInterval(id);
      });
    }, 1500);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [bureauxNumber, email]);

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

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-5 text-center sm:gap-6">
      <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
        {t('joinPaidRegistry')}
      </p>

      <h2 className="m-0">
        <span
          className="inline-grid h-[4.25rem] place-items-center rounded-[12px] border border-white/20 bg-white/[0.06] px-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:h-[4.75rem] sm:rounded-[14px] sm:px-7"
          aria-label={
            bureauxNumber != null
              ? tNav('bureauxMarkAria', { number: bureauxNumber })
              : t('joinPaidRegistry')
          }
        >
          <span
            className="font-[family-name:var(--font-display)] text-[clamp(2.5rem,8vw,3.5rem)] font-extrabold leading-none tracking-tight text-white"
            style={{
              fontVariationSettings: '"wght" 800, "wdth" 75',
              transform: 'translateY(-0.12em)',
            }}
          >
            {bureauxNumber != null ? bureauxNumber : t('joinPaidNumberPending')}
          </span>
        </span>
      </h2>

      <div className="flex max-w-[42ch] flex-col items-center gap-3">
        <p className="m-0 text-balance font-sans text-[17px] font-semibold tracking-tight text-white">
          {t('joinPaidTitle')}
        </p>
        <p className="m-0 font-sans text-[15px] font-medium leading-relaxed text-white/55">
          {status === 'sending'
            ? t('ctaPending')
            : status === 'error'
              ? error || t('joinCheckEmailError')
              : t('joinPaidThanks')}
        </p>
      </div>

      <Link
        href={`/signin?next=${encodeURIComponent(safeNext)}`}
        onClick={() => stashAuthNext(safeNext)}
        className="mt-1 inline-flex h-12 items-center justify-center rounded-full bg-white px-8 font-sans text-[15px] font-bold tracking-tight text-[#0B0B0C] transition-opacity hover:opacity-90 active:scale-[0.98]"
      >
        {t('joinPaidLogin')}
      </Link>

      {status === 'error' ? (
        <a
          href="mailto:control@fjorr.com"
          className="font-sans text-[13px] font-medium text-white/40 underline underline-offset-2 transition-colors hover:text-white/70"
        >
          {t('joinSupport')}
        </a>
      ) : null}
    </div>
  );
}
