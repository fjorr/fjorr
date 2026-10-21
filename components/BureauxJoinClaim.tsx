'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';

const DEFAULT_NEXT = '/account/bureaux';

const HEAD =
  "m-0 text-balance font-[family-name:var(--font-circular)] text-[clamp(2.25rem,5.5vw,3rem)] font-[700] leading-[1.05] tracking-[-0.03em] text-[#0B0B0C]";
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
  const tAccount = useTranslations('Account');
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

  const resend = () => {
    setStatus('sending');
    setError(null);
    void sendOtp()
      .then(() => setStatus('sent'))
      .catch((err: unknown) => {
        setStatus('error');
        setError(
          err instanceof Error ? err.message : t('joinCheckEmailError')
        );
      });
  };

  return (
    <div className="flex w-full max-w-[22rem] flex-col items-center text-center">
      <h1 className={HEAD}>{t('joinCheckEmailTitle')}</h1>
      <p className={LEAD}>
        {status === 'error'
          ? error || t('joinCheckEmailError')
          : t('joinCheckEmailBody', { email })}
      </p>
      {bureauxNumber != null ? (
        <p className="m-0 mt-6 font-sans text-[13px] font-medium tabular-nums text-black/35">
          {tAccount('bureauxNo')} {bureauxNumber}
        </p>
      ) : null}
      <button
        type="button"
        onClick={resend}
        disabled={status === 'sending'}
        className="mt-8 border-0 bg-transparent p-0 font-sans text-[15px] font-medium text-black/45 transition-colors hover:text-[#0B0B0C] disabled:opacity-40"
      >
        {t('joinResend')}
      </button>
      {status === 'error' ? (
        <a
          href="mailto:control@fjorr.com"
          className="mt-3 font-sans text-[15px] font-medium text-black/45 underline underline-offset-2 transition-colors hover:text-[#0B0B0C]"
        >
          {t('joinSupport')}
        </a>
      ) : null}
    </div>
  );
}
