'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { loadStripe, type Appearance, type StripeElementsOptions } from '@stripe/stripe-js';
import { useLocale, useTranslations } from 'next-intl';
import { useColorScheme } from '@/components/ColorSchemeProvider';
import {
  DARK_PAGE_BG,
  DARK_PAGE_FG,
  LIGHT_PAGE_BG,
  LIGHT_PAGE_FG,
} from '@/lib/color-scheme';
import { routing } from '@/i18n/routing';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
const DEFAULT_NEXT = '/account/bureaux';
/** Same as subscribe / Intel error pills (`bg-red-600`). */
const ERROR_RED = '#DC2626';

type CheckoutApiResult = {
  ok?: boolean;
  clientSecret?: string;
  email?: string | null;
  signedIn?: boolean;
  error?: string;
  detail?: string;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

async function requestCheckoutSecret(email: string): Promise<{
  res: Response;
  result: CheckoutApiResult;
  text: string;
}> {
  const res = await fetch('/api/stripe/bureaux-checkout', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });
  const text = await res.text();
  let result: CheckoutApiResult = {};
  try {
    result = JSON.parse(text) as CheckoutApiResult;
  } catch {
    result = {};
  }
  return { res, result, text };
}

function safeNextPath(raw?: string | null) {
  if (typeof raw === 'string' && raw.startsWith('/') && !raw.startsWith('//')) {
    return raw;
  }
  return DEFAULT_NEXT;
}

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
      colorDanger: ERROR_RED,
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
        color: ERROR_RED,
        fontSize: '13px',
      },
    },
  };
}

function accountReturnUrl(
  locale: string,
  email?: string | null,
  nextPath?: string
) {
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
  const params = new URLSearchParams({ joined: '1' });
  if (email) params.set('email', email);
  params.set('next', safeNextPath(nextPath));
  return `${window.location.origin}${prefix}/bureaux?${params.toString()}`;
}

function CheckoutForm({
  email,
  signedIn,
  nextPath,
}: {
  email: string;
  signedIn: boolean;
  nextPath: string;
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
      signedIn ? null : email,
      nextPath
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
      setMessage(t('checkoutError'));
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
      window.location.assign(returnUrl);
      return;
    }

    setMessage(t('checkoutError'));
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
          onChange={() => {
            if (message) setMessage(null);
          }}
        />
      </div>

      <button
        type="submit"
        disabled={!stripe || !elements || !ready || submitting}
        aria-live="polite"
        className={`mx-auto w-full max-w-sm h-12 inline-flex items-center justify-center rounded-full font-sans font-bold text-[15px] tracking-tight shadow-2xl transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none ${
          message
            ? 'bg-red-600 text-white hover:opacity-85'
            : 'bg-[var(--page-fg)] text-[var(--page-bg)] hover:opacity-90 active:scale-95'
        }`}
      >
        {submitting ? t('ctaPending') : message ? message : t('ctaSubscribe')}
      </button>
    </form>
  );
}

const ctaClass =
  'w-auto px-8 h-12 inline-flex items-center justify-center bg-[var(--page-fg)] text-[var(--page-bg)] font-sans font-bold text-[15px] tracking-tight rounded-full shadow-2xl hover:opacity-90 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none';
const ctaClassWide = `${ctaClass} w-full max-w-sm`;

export default function BureauxCheckout({
  signedIn = false,
  accountEmail = null,
  price,
  nextPath,
  autoStart = false,
}: {
  /** Skip the outer Join CTA and open at email / payment. */
  autoStart?: boolean;
  /** Session present (unpaid member finishing join). */
  signedIn?: boolean;
  accountEmail?: string | null;
  /** Formatted annual price, e.g. "$100". */
  price: string;
  /** Post-auth destination after guest join claim. */
  nextPath?: string;
}) {
  const t = useTranslations('Bureaux');
  const { isLight } = useColorScheme();
  const claimNext = safeNextPath(nextPath);
  const [started, setStarted] = useState(autoStart);
  const [email, setEmail] = useState(accountEmail || '');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [checkoutEmail, setCheckoutEmail] = useState<string | null>(null);
  const [checkoutSignedIn, setCheckoutSignedIn] = useState(signedIn);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const prefetchRef = useRef<{
    email: string;
    promise: Promise<{ res: Response; result: CheckoutApiResult }>;
  } | null>(null);

  const stripePromise = useMemo(() => {
    if (!publishableKey) return null;
    return loadStripe(publishableKey);
  }, []);

  // Warm Stripe.js + DNS as soon as the join chrome mounts.
  useEffect(() => {
    if (!publishableKey) return;
    const links: HTMLLinkElement[] = [];
    for (const href of ['https://js.stripe.com', 'https://api.stripe.com']) {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = href;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
      links.push(link);
    }
    void loadStripe(publishableKey);
    return () => {
      for (const link of links) link.remove();
    };
  }, []);

  const prefetchCheckout = (rawEmail: string) => {
    const nextEmail = rawEmail.trim().toLowerCase();
    if (!isValidEmail(nextEmail)) return;
    if (prefetchRef.current?.email === nextEmail) return;
    prefetchRef.current = {
      email: nextEmail,
      promise: requestCheckoutSecret(nextEmail).then(({ res, result }) => ({
        res,
        result,
      })),
    };
  };

  // Signed-in members: start preparing the Payment Element while they tap Continue.
  useEffect(() => {
    if (!started || !signedIn) return;
    const nextEmail = (accountEmail || email).trim().toLowerCase();
    if (isValidEmail(nextEmail)) prefetchCheckout(nextEmail);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- prefetch once when join starts
  }, [started, signedIn, accountEmail]);

  const startCheckout = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const nextEmail = (signedIn ? accountEmail || email : email)
      .trim()
      .toLowerCase();
    if (!isValidEmail(nextEmail)) {
      setError(t('joinEmailRequired'));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Warm Stripe.js in parallel with the secret request.
      void stripePromise;

      let res: Response;
      let result: CheckoutApiResult;
      const prefetched = prefetchRef.current;
      if (prefetched?.email === nextEmail) {
        ({ res, result } = await prefetched.promise);
      } else {
        ({ res, result } = await requestCheckoutSecret(nextEmail));
      }

      if (!result || Object.keys(result).length === 0) {
        setError(t('checkoutError'));
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
                : t('checkoutError');
        setError(message);
        setClientSecret(null);
        setLoading(false);
        prefetchRef.current = null;
        return;
      }

      setClientSecret(result.clientSecret);
      setCheckoutEmail(result.email || nextEmail);
      setCheckoutSignedIn(Boolean(result.signedIn));
      setLoading(false);
    } catch {
      setError(t('checkoutError'));
      setClientSecret(null);
      setLoading(false);
      prefetchRef.current = null;
    }
  };

  if (!publishableKey || !stripePromise) {
    return (
      <p className="font-sans text-[14px] text-page-faint leading-relaxed">
        {t('checkoutConfig')}
      </p>
    );
  }

  if (clientSecret && checkoutEmail) {
    const options: StripeElementsOptions = {
      clientSecret,
      appearance: fjorrAppearance(isLight),
    };

    return (
      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-5 text-center">
        <h2 className="m-0 font-interTight text-[clamp(1.65rem,2.8vw,1.75rem)] font-extrabold tracking-tight text-[#0B0B0C] md:text-[28px]">
          {t('priceSlideTitle')}
        </h2>
        <div className="flex w-full flex-col gap-1 items-center text-center">
          <p className="m-0 font-sans text-[13px] font-semibold normal-case tracking-normal text-page-muted">
            {t('joinEmailLabel')}
          </p>
          <p className="m-0 font-sans text-[15px] font-semibold text-page">
            {checkoutEmail}
          </p>
          <button
            type="button"
            onClick={() => {
              setClientSecret(null);
              setCheckoutEmail(null);
              setError(null);
            }}
            className="font-sans text-[12px] font-semibold text-page-faint hover:text-page underline underline-offset-2 bg-transparent border-0 p-0 cursor-pointer"
          >
            {t('joinChangeEmail')}
          </button>
        </div>
        <div className="w-full text-left">
          <Elements
            key={`${clientSecret}-${isLight ? 'light' : 'dark'}`}
            stripe={stripePromise}
            options={options}
          >
            <CheckoutForm
              email={checkoutEmail}
              signedIn={checkoutSignedIn}
              nextPath={claimNext}
            />
          </Elements>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <button
          type="button"
          onClick={() => setStarted(true)}
          className={ctaClass}
        >
          {t('ctaJoinPrice', { price })}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => void startCheckout(e)}
      noValidate
      className="mx-auto flex w-full max-w-sm flex-col items-center gap-4 text-center"
    >
      <h2 className="m-0 font-interTight text-[clamp(1.65rem,2.8vw,1.75rem)] font-extrabold tracking-tight text-[#0B0B0C] md:text-[28px]">
        {t('priceSlideTitle')}
      </h2>
      <label className="flex w-full flex-col gap-2 text-left">
        <span className="sr-only">{t('joinEmailLabel')}</span>
        <input
          type="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
            // Invalidate stale prefetch when the address changes.
            const next = e.target.value.trim().toLowerCase();
            if (
              prefetchRef.current &&
              prefetchRef.current.email !== next
            ) {
              prefetchRef.current = null;
            }
          }}
          onBlur={() => prefetchCheckout(email)}
          placeholder={t('joinEmailPlaceholder')}
          disabled={loading || (signedIn && Boolean(accountEmail))}
          className="w-full rounded-[10px] border-0 bg-white px-5 py-4 font-sans text-[16px] font-medium text-[#0B0B0C] shadow-[0_1px_0_rgba(0,0,0,0.04)] placeholder:text-black/35 focus:outline-none focus:ring-2 focus:ring-black/10 disabled:opacity-50 transition-shadow"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        aria-live="polite"
        className={`w-full h-12 inline-flex items-center justify-center rounded-full font-sans font-bold text-[15px] tracking-tight shadow-2xl transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none ${
          error
            ? 'bg-red-600 text-white hover:opacity-85'
            : 'bg-[var(--page-fg)] text-[var(--page-bg)] hover:opacity-90 active:scale-95'
        }`}
      >
        {loading ? t('ctaPending') : error ? error : t('joinContinue')}
      </button>
    </form>
  );
}
