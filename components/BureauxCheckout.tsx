'use client';

import React, { useMemo, useState } from 'react';
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
import { createClient } from '@/lib/supabase/client';
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

function accountReturnUrl(locale: string, email?: string | null) {
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
  const params = new URLSearchParams({ joined: '1' });
  if (email) params.set('email', email);
  return `${window.location.origin}${prefix}/bureaux?${params.toString()}`;
}

function authConfirmUrl() {
  return `${window.location.origin}/auth/confirm`;
}

async function sendSignInLink(email: string) {
  const supabase = createClient();
  try {
    document.cookie = `fjorr_auth_next=${encodeURIComponent('/bureaux')}; Path=/; Max-Age=900; SameSite=Lax`;
  } catch {
    /* ignore */
  }
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: authConfirmUrl(),
    },
  });
  if (error) throw error;
}

function CheckoutForm({
  email,
  signedIn,
  onPaidGuest,
}: {
  email: string;
  signedIn: boolean;
  onPaidGuest: (email: string) => void;
}) {
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
    setSubmitting(true);
    setMessage(null);

    const returnUrl = accountReturnUrl(
      locale,
      signedIn ? null : email
    );
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

    const status = paymentIntent?.status;
    if (
      !status ||
      status === 'succeeded' ||
      status === 'processing' ||
      status === 'requires_capture'
    ) {
      if (signedIn) {
        window.location.assign(returnUrl);
        return;
      }
      try {
        await sendSignInLink(email);
        onPaidGuest(email);
      } catch (err) {
        setMessage(
          err instanceof Error ? err.message : t('joinCheckEmailError')
        );
        setSubmitting(false);
      }
      return;
    }

    setMessage(`${t('checkoutError')} — status ${status}`);
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
      <div className="flex flex-col gap-2.5">
        <p className="font-sans text-[13px] font-semibold normal-case tracking-normal text-page-muted">
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

export default function BureauxCheckout({
  signedIn = false,
  accountEmail = null,
}: {
  /** Session present (unpaid member finishing join). */
  signedIn?: boolean;
  accountEmail?: string | null;
}) {
  const t = useTranslations('Bureaux');
  const { isLight } = useColorScheme();
  const [email, setEmail] = useState(accountEmail || '');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [checkoutEmail, setCheckoutEmail] = useState<string | null>(null);
  const [checkoutSignedIn, setCheckoutSignedIn] = useState(signedIn);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [paidEmail, setPaidEmail] = useState<string | null>(null);

  const stripePromise = useMemo(() => {
    if (!publishableKey) return null;
    return loadStripe(publishableKey);
  }, []);

  const startCheckout = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const nextEmail = (signedIn ? accountEmail || email : email).trim().toLowerCase();
    if (!nextEmail || !nextEmail.includes('@')) {
      setError(t('joinEmailRequired'));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/bureaux-checkout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: nextEmail }),
      });
      const text = await res.text();
      let result: {
        ok?: boolean;
        clientSecret?: string;
        email?: string | null;
        signedIn?: boolean;
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
        setLoading(false);
        return;
      }

      if (!res.ok || !result.ok || !result.clientSecret) {
        const message =
          result.error === 'alreadyActive'
            ? t('checkoutAlready')
            : result.error === 'emailRequired'
              ? t('joinEmailRequired')
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
        setLoading(false);
        return;
      }

      setClientSecret(result.clientSecret);
      setCheckoutEmail(result.email || nextEmail);
      setCheckoutSignedIn(Boolean(result.signedIn));
      setLoading(false);
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'Network error';
      setError(`${t('checkoutError')} — ${detail}`);
      setClientSecret(null);
      setLoading(false);
    }
  };

  if (!publishableKey || !stripePromise) {
    return (
      <p className="font-sans text-[14px] text-page-faint leading-relaxed">
        {t('checkoutConfig')} (missing publishable key)
      </p>
    );
  }

  if (paidEmail) {
    return (
      <div className="w-full max-w-md flex flex-col gap-3">
        <h2 className="font-sans text-[18px] font-semibold tracking-tight text-page">
          {t('joinCheckEmailTitle')}
        </h2>
        <p className="font-sans text-[14px] text-page-muted leading-relaxed">
          {t('joinCheckEmailBody', { email: paidEmail })}
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

  if (clientSecret && checkoutEmail) {
    const options: StripeElementsOptions = {
      clientSecret,
      appearance: fjorrAppearance(isLight),
    };

    return (
      <div className="w-full max-w-md flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <p className="font-sans text-[13px] font-semibold normal-case tracking-normal text-page-muted">
            {t('joinEmailLabel')}
          </p>
          <p className="font-sans text-[14px] text-page">{checkoutEmail}</p>
          <button
            type="button"
            onClick={() => {
              setClientSecret(null);
              setCheckoutEmail(null);
              setError(null);
            }}
            className="self-start font-sans text-[12px] font-semibold text-page-faint hover:text-page underline underline-offset-2"
          >
            {t('joinChangeEmail')}
          </button>
        </div>
        <Elements
          key={`${clientSecret}-${isLight ? 'light' : 'dark'}`}
          stripe={stripePromise}
          options={options}
        >
          <CheckoutForm
            email={checkoutEmail}
            signedIn={checkoutSignedIn}
            onPaidGuest={(paid) => setPaidEmail(paid)}
          />
        </Elements>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => void startCheckout(e)}
      className="w-full max-w-md flex flex-col gap-4"
    >
      <label className="flex flex-col gap-2 text-left">
        <span className="font-sans text-[13px] font-semibold normal-case tracking-normal text-page-muted">
          {t('joinEmailLabel')}
        </span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('joinEmailPlaceholder')}
          disabled={loading || (signedIn && Boolean(accountEmail))}
          className="h-12 rounded-[10px] bg-page-chip px-4 font-sans text-[15px] text-page placeholder:text-page-faint focus:outline-none focus:ring-1 focus:ring-page-faint disabled:opacity-50"
        />
      </label>

      {error ? (
        <div className="flex flex-col gap-2 items-start">
          <p className="font-sans text-[13px] text-[#C45B4A] leading-snug whitespace-pre-wrap">
            {error}
          </p>
          {error === t('checkoutAlready') ? (
            <Link
              href={`/signin?next=${encodeURIComponent('/bureaux')}`}
              className="font-sans text-[13px] font-semibold text-page underline underline-offset-2"
            >
              {t('joinCheckEmailSignIn')}
            </Link>
          ) : null}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading || !email.trim()}
        className="self-start inline-flex items-center h-12 px-7 rounded-full bg-[var(--page-fg)] text-[var(--page-bg)] font-sans text-[14px] font-bold hover:opacity-90 disabled:opacity-40 transition-opacity"
      >
        {loading ? t('ctaPending') : t('joinContinue')}
      </button>

      {!signedIn ? (
        <p className="font-sans text-[13px] text-page-faint leading-relaxed">
          {t('joinReturning')}{' '}
          <Link
            href={`/signin?next=${encodeURIComponent('/bureaux')}`}
            className="font-semibold text-page underline underline-offset-2"
          >
            {t('joinCheckEmailSignIn')}
          </Link>
        </p>
      ) : null}
    </form>
  );
}
