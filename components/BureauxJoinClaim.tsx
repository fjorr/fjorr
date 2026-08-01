'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * After guest checkout (incl. 3DS redirect), send a magic link and show check-email.
 */
export default function BureauxJoinClaim({ email }: { email: string }) {
  const t = useTranslations('Bureaux');
  const [status, setStatus] = useState<'sending' | 'sent' | 'error'>('sending');
  const [error, setError] = useState<string | null>(null);
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;

    const run = async () => {
      try {
        document.cookie = `fjorr_auth_next=${encodeURIComponent('/bureaux')}; Path=/; Max-Age=900; SameSite=Lax`;
      } catch {
        /* ignore */
      }
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });
      if (otpError) {
        setStatus('error');
        setError(otpError.message);
        return;
      }
      setStatus('sent');
    };

    void run();
  }, [email]);

  return (
    <div className="w-full max-w-md flex flex-col gap-3">
      <h2 className="font-sans text-[18px] font-semibold tracking-tight text-page">
        {t('joinCheckEmailTitle')}
      </h2>
      <p className="font-sans text-[14px] text-page-muted leading-relaxed">
        {status === 'sending'
          ? t('ctaPending')
          : status === 'sent'
            ? t('joinCheckEmailBody', { email })
            : error || t('joinCheckEmailError')}
      </p>
      <Link
        href={`/signin?next=${encodeURIComponent('/bureaux')}`}
        className="self-start font-sans text-[13px] font-semibold text-page underline underline-offset-2"
      >
        {t('joinCheckEmailSignIn')}
      </Link>
    </div>
  );
}
