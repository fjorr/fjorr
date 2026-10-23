'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowRight, X } from 'lucide-react';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { loadStripe, type Appearance, type StripeElementsOptions } from '@stripe/stripe-js';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import SheetEnter from '@/components/house/SheetEnter';
import { useColorScheme } from '@/components/ColorSchemeProvider';
import {
  DARK_PAGE_BG,
  DARK_PAGE_FG,
  LIGHT_PAGE_FG,
} from '@/lib/color-scheme';
import { routing } from '@/i18n/routing';

const BUREAUX_CARD = '/fjorr-bureaux-breakdancing.avif';

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
  const bg = isLight ? '#ffffff' : DARK_PAGE_BG;
  const fg = isLight ? LIGHT_PAGE_FG : DARK_PAGE_FG;
  const muted = isLight ? 'rgba(11,11,12,0.45)' : 'rgba(245,245,247,0.45)';
  const faint = isLight ? 'rgba(11,11,12,0.14)' : 'rgba(245,245,247,0.14)';
  const fieldBg = isLight ? '#F5F5F7' : 'rgba(245,245,247,0.04)';

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
  price,
}: {
  email: string;
  signedIn: boolean;
  nextPath: string;
  price: string;
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
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <div className="w-full text-left">
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
        className={`inline-flex h-12 w-full items-center justify-center rounded-full font-sans text-[15px] font-bold tracking-tight transition-opacity disabled:pointer-events-none disabled:opacity-50 ${
          message
            ? 'bg-red-600 text-white'
            : 'bg-[#0B0B0C] text-white hover:opacity-90'
        }`}
      >
        {submitting ? t('ctaPending') : message ? message : t('ctaJoinPrice', { price })}
      </button>
    </form>
  );
}

const HEAD =
  "m-0 text-balance font-[family-name:var(--font-circular-black)] text-[clamp(2.25rem,5.5vw,3rem)] font-[900] leading-[1.05] tracking-[-0.03em] text-[#0B0B0C] md:whitespace-nowrap md:text-[3rem]";
const PRICE =
  "m-0 mt-3 font-sans text-[15px] font-medium text-black/45";
const LEAD =
  'm-0 mt-4 max-w-[26.25rem] text-pretty font-sans text-[16px] font-medium leading-relaxed text-black/55 md:text-[17px]';

export default function BureauxCheckout({
  signedIn = false,
  accountEmail = null,
  price,
  nextPath,
}: {
  /** Accepted from the page; the form opens immediately. */
  autoStart?: boolean;
  /** Session present (unpaid member finishing join). */
  signedIn?: boolean;
  accountEmail?: string | null;
  /** Formatted monthly price, e.g. "$4". */
  price: string;
  /** Post-auth destination after guest join claim. */
  nextPath?: string;
}) {
  const t = useTranslations('Bureaux');
  const { isLight } = useColorScheme();
  const claimNext = safeNextPath(nextPath);
  const emailKnown = Boolean(signedIn && accountEmail);
  const [fieldOpen, setFieldOpen] = useState(emailKnown);
  const [reduced, setReduced] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState(accountEmail || '');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [checkoutEmail, setCheckoutEmail] = useState<string | null>(null);
  const [checkoutSignedIn, setCheckoutSignedIn] = useState(signedIn);
  const [error, setError] = useState<string | null>(null);
  const [errorLabel, setErrorLabel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const prefetchRef = useRef<{
    email: string;
    promise: Promise<{ res: Response; result: CheckoutApiResult }>;
  } | null>(null);
  const inflightEmail = useRef<string | null>(null);
  const blockedEmail = useRef<string | null>(null);

  const stripePromise = useMemo(() => {
    if (!publishableKey) return null;
    return loadStripe(publishableKey);
  }, []);

  useEffect(() => {
    setReduced(
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }, []);

  const openField = () => {
    if (fieldOpen) return;
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
    setError(null);
    if (!(signedIn && accountEmail)) {
      setEmail('');
      blockedEmail.current = null;
      prefetchRef.current = null;
      setClientSecret(null);
      setCheckoutEmail(null);
    }
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

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

  const startCheckout = async (rawEmail?: string) => {
    const nextEmail = (rawEmail ?? (signedIn ? accountEmail || email : email))
      .trim()
      .toLowerCase();
    if (!isValidEmail(nextEmail)) return;
    if (blockedEmail.current === nextEmail) return;
    if (clientSecret && checkoutEmail === nextEmail) return;
    if (inflightEmail.current === nextEmail) return;

    inflightEmail.current = nextEmail;
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

      if (inflightEmail.current !== nextEmail) return;

      if (!result || Object.keys(result).length === 0) {
        blockedEmail.current = nextEmail;
        setError(t('checkoutError'));
        setClientSecret(null);
        setCheckoutEmail(null);
        return;
      }

      if (!res.ok || !result.ok || !result.clientSecret) {
        const rateLimited = result.error === 'rateLimited';
        const message =
          result.error === 'alreadyActive'
            ? t('checkoutAlready')
            : result.error === 'emailRequired'
              ? t('joinEmailRequired')
              : result.error === 'emailRejected'
                ? t('joinEmailRejected')
                : result.error === 'config'
                  ? t('checkoutConfig')
                  : t('checkoutError');
        if (!rateLimited) blockedEmail.current = nextEmail;
        setError(message);
        setClientSecret(null);
        setCheckoutEmail(null);
        prefetchRef.current = null;
        return;
      }

      blockedEmail.current = null;
      setClientSecret(result.clientSecret);
      setCheckoutEmail(result.email || nextEmail);
      setCheckoutSignedIn(Boolean(result.signedIn));
    } catch {
      if (inflightEmail.current !== nextEmail) return;
      blockedEmail.current = nextEmail;
      setError(t('checkoutError'));
      setClientSecret(null);
      setCheckoutEmail(null);
      prefetchRef.current = null;
    } finally {
      if (inflightEmail.current === nextEmail) {
        inflightEmail.current = null;
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const nextEmail = (signedIn ? accountEmail || email : email)
      .trim()
      .toLowerCase();
    if (!isValidEmail(nextEmail)) return;
    if (blockedEmail.current === nextEmail) return;
    if (clientSecret && checkoutEmail === nextEmail) return;
    const delay = signedIn ? 0 : 400;
    const id = window.setTimeout(() => {
      prefetchCheckout(nextEmail);
      void startCheckout(nextEmail);
    }, delay);
    return () => window.clearTimeout(id);
    // startCheckout closes over the latest secret; listed via checkoutEmail.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, accountEmail, signedIn, clientSecret, checkoutEmail]);

  const fieldError =
    error === t('joinEmailRequired') || error === t('checkoutAlready');

  useEffect(() => {
    if (fieldError && error) {
      setErrorLabel(error);
      return;
    }
    const id = window.setTimeout(() => setErrorLabel(null), 420);
    return () => window.clearTimeout(id);
  }, [fieldError, error]);
  const options: StripeElementsOptions | null =
    clientSecret && checkoutEmail
      ? { clientSecret, appearance: fjorrAppearance(isLight) }
      : null;

  if (!publishableKey || !stripePromise) {
    return (
      <p className="m-0 max-w-[22rem] text-center font-sans text-[16px] font-medium leading-relaxed text-black/55">
        {t('checkoutConfig')}
      </p>
    );
  }

  return (
    <div className="flex w-full max-w-[40rem] flex-col items-center text-center">
      <SheetEnter>
        <h1 className={HEAD}>{t('joinHeadline')}</h1>
      </SheetEnter>
      <SheetEnter delay={60}>
        <p className={PRICE}>
          <span className="text-[22px] font-bold leading-none text-[#0B0B0C]">
            {t('joinPriceAside', { price })}
          </span>
          <span aria-hidden className="px-2 text-black/25">
            ·
          </span>
          {t('cancelAnytime')}
        </p>
      </SheetEnter>
      <SheetEnter delay={100}>
        <p className={LEAD}>
          {t.rich('joinPayLead', {
            mission: (chunks) => (
              <Link
                href="/about"
                className="text-[#0B0B0C] underline decoration-[1px] underline-offset-[3px] transition-opacity hover:opacity-70"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
      </SheetEnter>

      <SheetEnter delay={200} className="w-full max-w-[22rem]">
      <div
        ref={shellRef}
        className={`relative mt-6 w-full overflow-hidden motion-reduce:transition-none ${
          fieldOpen
            ? fieldError
              ? 'h-12 rounded-full bg-red-600'
              : 'h-12 rounded-full bg-[#F5F5F7]'
            : 'aspect-[4/3] rounded-[22px] bg-black'
        } ${
          reduced
            ? ''
            : '[transition:height_700ms_cubic-bezier(0.22,1,0.36,1),border-radius_700ms_cubic-bezier(0.22,1,0.36,1),background-color_480ms_cubic-bezier(0.22,1,0.36,1)]'
        }`}
      >
        <button
          type="button"
          onClick={openField}
          aria-label={t('joinEmailPlaceholder')}
          tabIndex={fieldOpen ? -1 : 0}
          className={`absolute inset-0 border-0 p-0 transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
            fieldOpen ? 'pointer-events-none opacity-0' : 'cursor-pointer opacity-100'
          }`}
        >
          <Image
            src={BUREAUX_CARD}
            alt=""
            fill
            priority
            sizes="352px"
            className="object-cover object-center"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-3.5 right-3.5 z-[1] inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#0B0B0C]"
          >
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} />
          </span>
        </button>
      <form
        className={`absolute inset-0 flex items-center pl-8 pr-1.5 transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          fieldOpen ? 'opacity-100 delay-200' : 'pointer-events-none opacity-0'
        }`}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const nextEmail = (signedIn ? accountEmail || email : email)
            .trim()
            .toLowerCase();
          if (!isValidEmail(nextEmail)) {
            setError(t('joinEmailRequired'));
            return;
          }
          blockedEmail.current = null;
          void startCheckout(nextEmail);
        }}
      >
        <div className="flex h-12 w-full items-center">
          <label className="sr-only" htmlFor="bureaux-join-email">
            {t('joinEmailLabel')}
          </label>
          <input
            ref={inputRef}
            id="bureaux-join-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              const next = e.target.value;
              setEmail(next);
              blockedEmail.current = null;
              if (error) setError(null);
              const normalized = next.trim().toLowerCase();
              if (
                prefetchRef.current &&
                prefetchRef.current.email !== normalized
              ) {
                prefetchRef.current = null;
              }
              if (checkoutEmail && checkoutEmail !== normalized) {
                setClientSecret(null);
                setCheckoutEmail(null);
              }
            }}
            onBlur={() => prefetchCheckout(email)}
            placeholder={t('joinEmailPlaceholder')}
            disabled={signedIn && Boolean(accountEmail)}
            aria-invalid={fieldError ? true : undefined}
            className={`min-w-0 flex-1 border-0 bg-transparent font-sans text-[16px] font-medium text-[#0B0B0C] outline-none transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] placeholder:text-black/35 motion-reduce:transition-none disabled:opacity-60 ${
              fieldError ? 'opacity-0' : 'opacity-100'
            }`}
          />
          <span
            aria-live="polite"
            className={`pointer-events-none absolute inset-y-0 left-8 right-12 flex items-center truncate font-sans text-[16px] font-medium text-white transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
              fieldError ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {errorLabel}
          </span>
          <button
            type={fieldError ? 'button' : 'submit'}
            onClick={fieldError ? clearField : undefined}
            disabled={!fieldError && (loading || !email.trim())}
            aria-label={
              fieldError
                ? t('clearEmail')
                : loading
                  ? t('ctaPending')
                  : t('joinContinue')
            }
            className={`relative z-[1] inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-[background-color,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none active:scale-95 ${
              fieldError
                ? 'bg-white/25'
                : 'bg-[#0B0B0C] hover:opacity-90 disabled:opacity-40'
            }`}
          >
            <span className="grid h-3.5 w-3.5 place-items-center">
              <X
                className={`col-start-1 row-start-1 h-3.5 w-3.5 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                  fieldError ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
                }`}
                strokeWidth={2.25}
                aria-hidden
              />
              <ArrowRight
                className={`col-start-1 row-start-1 h-3.5 w-3.5 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                  fieldError ? 'scale-75 opacity-0' : 'scale-100 opacity-100'
                }`}
                strokeWidth={2.25}
                aria-hidden
              />
            </span>
          </button>
        </div>
      </form>
      </div>
      </SheetEnter>

      {(options && checkoutEmail) || loading || (error && !fieldError) ? (
      <div className="mt-4 flex w-full flex-col gap-4">
        {options && checkoutEmail ? (
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
                price={price}
              />
            </Elements>
          </div>
        ) : loading ? (
          <p className="m-0 font-sans text-[15px] font-medium text-black/45">
            {t('ctaPending')}
          </p>
        ) : error && !fieldError ? (
          <p className="m-0 font-sans text-[15px] font-medium text-red-600">
            {error}
          </p>
        ) : null}
      </div>
      ) : null}

      <SheetEnter delay={320}>
        <p className="m-0 mt-8 font-sans text-[15px] font-medium text-black/45">
          {t('joinReturning')}{' '}
          <Link
            href={`/signin?next=${encodeURIComponent(claimNext)}`}
            className="text-[#0B0B0C] transition-opacity hover:opacity-70"
          >
            {t('ctaSignIn')}
          </Link>
        </p>
      </SheetEnter>
    </div>
  );
}
