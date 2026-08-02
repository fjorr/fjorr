'use client';

import React, { useMemo, useState, useTransition } from 'react';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useColorScheme } from '@/components/ColorSchemeProvider';
import { fjorrStripeAppearance } from '@/lib/stripe-appearance';
import {
  cancelBureauxAtPeriodEnd,
  createBureauxSetupSecret,
  resumeBureauxSubscription,
  setBureauxDefaultPaymentMethod,
} from '@/lib/bureaux-actions';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

function UpdateCardForm({
  email,
  onDone,
  onCancel,
}: {
  email: string | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations('Account');
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
        return_url: `${window.location.origin}/bureaux`,
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
        <p className="font-sans text-[13px] text-[#C45B4A] leading-snug">
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
  cancelAtPeriodEnd,
}: {
  cancelAtPeriodEnd: boolean;
}) {
  const t = useTranslations('Account');
  const router = useRouter();
  const { isLight } = useColorScheme();
  const [pending, startTransition] = useTransition();
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

  const onCancel = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await cancelBureauxAtPeriodEnd();
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage(t('bureauxCancelDone'));
      refresh();
    });
  };

  const onResume = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await resumeBureauxSubscription();
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage(t('bureauxResumeDone'));
      refresh();
    });
  };

  const startCardUpdate = async () => {
    setMessage(null);
    setCardLoading(true);
    const result = await createBureauxSetupSecret();
    setCardLoading(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setEmail(result.email);
    setSetupSecret(result.clientSecret);
    setUpdatingCard(true);
  };

  return (
    <div className="w-full max-w-md flex flex-col gap-4 items-start">
      <h2 className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-page-faint">
        {t('bureauxManage')}
      </h2>

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
              onDone={() => {
                setUpdatingCard(false);
                setSetupSecret(null);
                setMessage(t('bureauxCardDone'));
                refresh();
              }}
              onCancel={() => {
                setUpdatingCard(false);
                setSetupSecret(null);
              }}
            />
          </Elements>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 items-start">
          <button
            type="button"
            disabled={cardLoading || pending}
            onClick={() => void startCardUpdate()}
            className="self-start h-11 px-5 rounded-full border border-page-faint bg-transparent font-sans text-[13px] font-semibold text-page-muted hover:text-page hover:border-page-muted disabled:opacity-40 transition-colors"
          >
            {cardLoading ? t('bureauxPending') : t('bureauxUpdateCard')}
          </button>

          {cancelAtPeriodEnd ? (
            <button
              type="button"
              disabled={pending}
              onClick={onResume}
              className="self-start h-11 px-5 rounded-full border border-page-faint bg-transparent font-sans text-[13px] font-semibold text-page-muted hover:text-page hover:border-page-muted disabled:opacity-40 transition-colors"
            >
              {pending ? t('bureauxPending') : t('bureauxResume')}
            </button>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={onCancel}
              className="self-start h-11 px-5 rounded-full border border-page-faint bg-transparent font-sans text-[13px] font-semibold text-page-muted hover:text-page hover:border-page-muted disabled:opacity-40 transition-colors"
            >
              {pending ? t('bureauxPending') : t('bureauxCancel')}
            </button>
          )}
        </div>
      )}

      {message ? (
        <p className="font-sans text-[13px] text-page-muted leading-snug">
          {message}
        </p>
      ) : null}

      {cancelAtPeriodEnd ? (
        <p className="font-sans text-[12px] text-page-faint leading-relaxed">
          {t('bureauxCancelHint')}{' '}
          <Link
            href="/manual/cancel"
            className="font-semibold text-page-muted underline underline-offset-2 hover:text-page transition-colors"
          >
            Manual · Cancel
          </Link>
        </p>
      ) : (
        <p className="font-sans text-[12px] text-page-faint leading-relaxed">
          <Link
            href="/manual/cancel"
            className="font-semibold text-page-muted underline underline-offset-2 hover:text-page transition-colors"
          >
            Manual · Cancel
          </Link>
        </p>
      )}
    </div>
  );
}
