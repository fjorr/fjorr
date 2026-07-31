'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from '@stripe/react-stripe-js';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { createBureauxCheckoutClientSecret } from '@/lib/bureaux-actions';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

export default function BureauxEmbeddedCheckout() {
  const t = useTranslations('Bureaux');
  const [error, setError] = useState<string | null>(null);

  const stripePromise = useMemo(() => {
    if (!publishableKey) return null;
    return loadStripe(publishableKey);
  }, []);

  const fetchClientSecret = useCallback(async () => {
    setError(null);
    const result = await createBureauxCheckoutClientSecret();
    if (!result.ok) {
      const message =
        result.error === 'signInRequired'
          ? t('checkoutSignIn')
          : result.error === 'alreadyActive'
            ? t('checkoutAlready')
            : result.error === 'config'
              ? t('checkoutConfig')
              : t('checkoutError');
      setError(message);
      throw new Error(message);
    }
    return result.clientSecret;
  }, [t]);

  if (!publishableKey || !stripePromise) {
    return (
      <p className="font-sans text-[14px] text-page-faint leading-relaxed">
        {t('checkoutConfig')}
      </p>
    );
  }

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="w-full min-h-[28rem] rounded-[10px] overflow-hidden bg-page-elevated">
        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={{ fetchClientSecret }}
        >
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
      {error ? (
        <div className="flex flex-col gap-2">
          <p className="font-sans text-[13px] text-page-muted leading-snug">
            {error}
          </p>
          {error === t('checkoutSignIn') ? (
            <Link
              href={`/signin?next=${encodeURIComponent('/bureaux')}`}
              className="font-sans text-[13px] font-semibold text-page underline underline-offset-2"
            >
              {t('ctaSignIn')}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
