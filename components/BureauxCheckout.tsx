'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { loadStripe, type Appearance, type StripeElementsOptions } from '@stripe/stripe-js';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useColorScheme } from '@/components/ColorSchemeProvider';
import {
  DARK_PAGE_BG,
  DARK_PAGE_FG,
  LIGHT_PAGE_BG,
  LIGHT_PAGE_FG,
} from '@/lib/color-scheme';
import { routing } from '@/i18n/routing';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

function fjorrAppearance(isLight: boolean): Appearance {
  const bg = isLight ? LIGHT_PAGE_BG : DARK_PAGE_BG;
  const fg = isLight ? LIGHT_PAGE_FG : DARK_PAGE_FG;
  const muted = isLight ? 'rgba(11,11,12,0.45)' : 'rgba(245,245,247,0.45)';
  const faint = isLight ? 'rgba(11,11,12,0.14)' : 'rgba(245,245,247,0.14)';
  const fieldBg = isLight ? 'rgba(11,11,12,0.03)' : 'rgba(245,245,247,0.04)';

  return {
    theme: isLight ? 'stripe' : 'night',
    variables: {
      colorPrimary: fg,
      colorBackground: bg,
      colorText: fg,
      colorTextSecondary: muted,
      colorDanger: '#C45B4A',
      fontFamily:
        'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSizeBase: '14px',
      borderRadius: '6px',
      spacingUnit: '3px',
    },
    rules: {
      '.Label': {
        fontWeight: '600',
        fontSize: '11px',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: muted,
      },
      '.Input': {
        backgroundColor: fieldBg,
        border: `1px solid ${faint}`,
        boxShadow: 'none',
        color: fg,
        padding: '11px 12px',
      },
      '.Input:focus': {
        border: `1px solid ${muted}`,
        boxShadow: 'none',
      },
      '.Error': {
        color: '#C45B4A',
        fontSize: '13px',
      },
    },
  };
}

function accountReturnUrl(locale: string) {
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
  return `${window.location.origin}${prefix}/bureaux?joined=1`;
}

function CheckoutForm({ email }: { email: string | null }) {
  const t = useTranslations('Bureaux');
  const locale = useLocale();
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || submitting) return;
    if (!email) {
      setMessage(`${t('checkoutError')} — missing account email`);
      return;
    }
    setSubmitting(true);
    setMessage(null);

    const returnUrl = accountReturnUrl(locale);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: returnUrl,
        payment_method_data: {
          billing_details: { email },
        },
      },
    });

    if (error) {
      setMessage(
        error.message ||
          `${t('checkoutError')} — ${error.type || 'confirm_failed'}`
      );
      setSubmitting(false);
      return;
    }

    // Hard navigate so account page reloads membership (webhook may have just landed).
    const status = paymentIntent?.status;
    if (
      !status ||
      status === 'succeeded' ||
      status === 'processing' ||
      status === 'requires_capture'
    ) {
      window.location.assign(returnUrl);
      return;
    }

    setMessage(`${t('checkoutError')} — status ${status}`);
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
      <div className="flex flex-col gap-2.5">
        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-page-faint">
          {t('checkoutPayment')}
        </p>
        <PaymentElement
          options={{
            layout: 'tabs',
            wallets: {
              applePay: 'auto',
              googlePay: 'auto',
              link: 'never',
            },
            // Hide email only — we pass account email in confirmParams.
            // Do not set phone to "never" (Stripe then requires it on confirm).
            fields: {
              billingDetails: {
                email: 'never',
              },
            },
            terms: { card: 'never' },
          }}
          onReady={() => setReady(true)}
        />
      </div>

      {message ? (
        <p className="font-sans text-[13px] text-[#C45B4A] leading-snug whitespace-pre-wrap">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!stripe || !elements || !ready || submitting}
        className="self-start inline-flex items-center h-12 px-7 rounded-full bg-[var(--page-fg)] text-[var(--page-bg)] font-sans text-[14px] font-bold hover:opacity-90 disabled:opacity-40 transition-opacity"
      >
        {submitting ? t('ctaPending') : t('ctaSubscribe')}
      </button>
    </form>
  );
}

export default function BureauxCheckout() {
  const t = useTranslations('Bureaux');
  const { isLight } = useColorScheme();
  const [started, setStarted] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const stripePromise = useMemo(() => {
    if (!publishableKey) return null;
    return loadStripe(publishableKey);
  }, []);

  const loadSecret = useCallback(async () => {
    setStarted(true);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/bureaux-checkout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      });
      const text = await res.text();
      let result: {
        ok?: boolean;
        clientSecret?: string;
        email?: string | null;
        error?: string;
        detail?: string;
      } = {};
      try {
        result = JSON.parse(text) as typeof result;
      } catch {
        setError(
          `${t('checkoutError')} — bad response (${res.status}): ${text.slice(0, 180)}`
        );
        setClientSecret(null);
        setEmail(null);
        setLoading(false);
        return;
      }

      if (!res.ok || !result.ok || !result.clientSecret) {
        const message =
          result.error === 'signInRequired'
            ? t('checkoutSignIn')
            : result.error === 'alreadyActive'
              ? t('checkoutAlready')
              : result.error === 'config'
                ? t('checkoutConfig')
                : [
                    t('checkoutError'),
                    result.detail || `HTTP ${res.status}`,
                    result.error ? `code=${result.error}` : null,
                  ]
                    .filter(Boolean)
                    .join(' — ');
        setError(message);
        setClientSecret(null);
        setEmail(null);
        setLoading(false);
        return;
      }

      setClientSecret(result.clientSecret);
      setEmail(result.email || null);
      setLoading(false);
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'Network error';
      setError(`${t('checkoutError')} — ${detail}`);
      setClientSecret(null);
      setEmail(null);
      setLoading(false);
    }
  }, [t]);

  if (!publishableKey || !stripePromise) {
    return (
      <p className="font-sans text-[14px] text-page-faint leading-relaxed">
        {t('checkoutConfig')} (missing publishable key)
      </p>
    );
  }

  if (!started) {
    return (
      <button
        type="button"
        onClick={() => void loadSecret()}
        className="self-start inline-flex items-center h-12 px-7 rounded-full bg-[var(--page-fg)] text-[var(--page-bg)] font-sans text-[14px] font-bold hover:opacity-90 transition-opacity"
      >
        {t('ctaSubscribe')}
      </button>
    );
  }

  if (loading) {
    return (
      <p className="font-sans text-[13px] text-page-faint leading-relaxed">
        {t('ctaPending')}
      </p>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-2 items-start max-w-lg">
        <p className="font-sans text-[13px] text-page-muted leading-snug whitespace-pre-wrap">
          {error}
        </p>
        {error === t('checkoutSignIn') ? (
          <Link
            href={`/signin?next=${encodeURIComponent('/bureaux')}`}
            className="font-sans text-[13px] font-semibold text-page underline underline-offset-2"
          >
            {t('ctaSignIn')}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => void loadSecret()}
            className="font-sans text-[13px] font-semibold text-page underline underline-offset-2"
          >
            {t('checkoutRetry')}
          </button>
        )}
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="flex flex-col gap-2 items-start">
        <p className="font-sans text-[13px] text-page-muted">
          No payment session. Try again.
        </p>
        <button
          type="button"
          onClick={() => void loadSecret()}
          className="font-sans text-[13px] font-semibold text-page underline underline-offset-2"
        >
          {t('checkoutRetry')}
        </button>
      </div>
    );
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: fjorrAppearance(isLight),
  };

  return (
    <div className="w-full max-w-md">
      <Elements
        key={`${clientSecret}-${isLight ? 'light' : 'dark'}`}
        stripe={stripePromise}
        options={options}
      >
        <CheckoutForm email={email} />
      </Elements>
    </div>
  );
}
