'use client';

import React, { useMemo, useState } from 'react';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useColorScheme } from '@/components/ColorSchemeProvider';
import { fjorrStripeAppearance } from '@/lib/stripe-appearance';
import {
  createBureauxSetupSecret,
  setBureauxDefaultPaymentMethod,
} from '@/lib/bureaux-actions';
import { routing } from '@/i18n/routing';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

function localizedReturnUrl(locale: string, path: string) {
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${window.location.origin}${prefix}${normalized}`;
}

function UpdateCardForm({
  email,
  returnPath,
  onDone,
  onCancel,
}: {
  email: string | null;
  returnPath: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations('Account');
  const locale = useLocale();
  const stripe = useStripe();
  const elements = useElements();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || pending) return;
    setPending(true);
    setMessage(null);

    const { error, setupIntent } = await stripe.confirmSetup({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: localizedReturnUrl(locale, returnPath),
        ...(email
          ? {
              payment_method_data: {
                billing_details: { email },
              },
            }
          : {}),
      },
    });

    if (error) {
      setMessage(error.message || t('bureauxCardError'));
      setPending(false);
      return;
    }

    const pm = setupIntent?.payment_method;
    const pmId = typeof pm === 'string' ? pm : pm?.id;
    if (!pmId) {
      setMessage(t('bureauxCardError'));
      setPending(false);
      return;
    }

    const saved = await setBureauxDefaultPaymentMethod(pmId);
    if (!saved.ok) {
      setMessage(saved.error || t('bureauxCardError'));
      setPending(false);
      return;
    }

    onDone();
  };

  return (
    <form onSubmit={submit} className="w-full flex flex-col gap-4">
      <PaymentElement
        options={{
          layout: 'tabs',
          wallets: { link: 'never', applePay: 'never', googlePay: 'never' },
          fields: { billingDetails: { email: 'never' } },
        }}
        onReady={() => setReady(true)}
      />
      {message ? (
        <p className="font-sans text-[13px] text-red-400/90 leading-snug">
          {message}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={!stripe || !elements || !ready || pending}
          className="h-11 px-5 rounded-full bg-[var(--page-fg)] text-[var(--page-bg)] font-sans text-[13px] font-bold hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          {pending ? t('bureauxPending') : t('bureauxCardSave')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="h-11 px-5 rounded-full border border-page-faint font-sans text-[13px] font-semibold text-page-muted hover:text-page disabled:opacity-40 transition-colors"
        >
          {t('bureauxCardCancel')}
        </button>
      </div>
    </form>
  );
}

export default function BureauxManage({
  returnPath = '/account/bureaux',
  onOpen,
  onClose,
}: {
  /** Stripe SetupIntent return path (locale prefix added by the browser origin). */
  returnPath?: string;
  onOpen?: () => void;
  onClose?: () => void;
}) {
  const t = useTranslations('Account');
  const router = useRouter();
  const { isLight } = useColorScheme();
  const [message, setMessage] = useState<string | null>(null);
  const [updatingCard, setUpdatingCard] = useState(false);
  const [setupSecret, setSetupSecret] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [cardLoading, setCardLoading] = useState(false);

  const stripePromise = useMemo(() => {
    if (!publishableKey) return null;
    return loadStripe(publishableKey);
  }, []);

  const refresh = () => router.refresh();

  const closeCard = () => {
    setUpdatingCard(false);
    setSetupSecret(null);
    onClose?.();
  };

  const startCardUpdate = async () => {
    setMessage(null);
    setCardLoading(true);
    onOpen?.();
    const result = await createBureauxSetupSecret();
    setCardLoading(false);
    if (!result.ok) {
      setMessage(result.error);
      onClose?.();
      return;
    }
    setEmail(result.email);
    setSetupSecret(result.clientSecret);
    setUpdatingCard(true);
  };

  return (
    <div
      className={`flex flex-col gap-4 items-start${
        updatingCard ? ' basis-full w-full max-w-md' : ''
      }`}
    >
      {updatingCard && setupSecret && stripePromise ? (
        <div className="w-full flex flex-col gap-3">
          <p className="font-sans text-[13px] text-page-muted leading-snug">
            {t('bureauxCardBody')}
          </p>
          <Elements
            key={setupSecret}
            stripe={stripePromise}
            options={{
              clientSecret: setupSecret,
              appearance: fjorrStripeAppearance(isLight),
            }}
          >
            <UpdateCardForm
              email={email}
              returnPath={returnPath}
              onDone={() => {
                closeCard();
                setMessage(t('bureauxCardDone'));
                refresh();
              }}
              onCancel={closeCard}
            />
          </Elements>
        </div>
      ) : (
        <button
          type="button"
          disabled={cardLoading}
          onClick={() => void startCardUpdate()}
          className="self-start h-11 px-5 rounded-full bg-white text-black font-sans text-[13px] font-semibold hover:bg-white/90 disabled:opacity-40 transition-colors"
        >
          {cardLoading ? t('bureauxPending') : t('bureauxUpdateCard')}
        </button>
      )}

      {message ? (
        <p className="font-sans text-[13px] text-page-muted leading-snug">
          {message}
        </p>
      ) : null}
    </div>
  );
}
