'use client';

import React, { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import {
  cancelBureauxAtPeriodEnd,
  resumeBureauxSubscription,
} from '@/lib/bureaux-actions';

/** Cancel / resume — sits above delete account. */
export default function BureauxCancelMembership({
  cancelAtPeriodEnd,
}: {
  cancelAtPeriodEnd: boolean;
}) {
  const t = useTranslations('Account');
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = () => router.refresh();

  const onCancel = () => {
    setMessage(null);
    setConfirmCancel(false);
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

  return (
    <div className="flex flex-col gap-2 items-start">
      {cancelAtPeriodEnd ? (
        <button
          type="button"
          disabled={pending}
          onClick={onResume}
          className="self-start font-sans text-[13px] font-medium text-page-muted underline underline-offset-2 decoration-[color-mix(in_srgb,var(--page-fg)_25%,transparent)] hover:text-page hover:decoration-[color-mix(in_srgb,var(--page-fg)_45%,transparent)] disabled:opacity-40 transition-colors"
        >
          {pending ? t('bureauxPending') : t('bureauxResume')}
        </button>
      ) : confirmCancel ? (
        <div className="flex flex-col gap-2 items-start">
          <p className="font-sans text-[13px] text-page-muted leading-snug">
            {t('bureauxCancelConfirm')}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <button
              type="button"
              disabled={pending}
              onClick={onCancel}
              className="font-sans text-[13px] font-semibold text-page underline underline-offset-2 decoration-[color-mix(in_srgb,var(--page-fg)_25%,transparent)] hover:decoration-[color-mix(in_srgb,var(--page-fg)_45%,transparent)] disabled:opacity-40 transition-colors"
            >
              {pending ? t('bureauxPending') : t('bureauxCancelConfirmYes')}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirmCancel(false)}
              className="font-sans text-[13px] font-medium text-page-faint hover:text-page-muted disabled:opacity-40 transition-colors"
            >
              {t('bureauxCancelConfirmNo')}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setMessage(null);
            setConfirmCancel(true);
          }}
          className="self-start font-sans text-[13px] font-medium text-page-muted underline underline-offset-2 decoration-[color-mix(in_srgb,var(--page-fg)_25%,transparent)] hover:text-page hover:decoration-[color-mix(in_srgb,var(--page-fg)_45%,transparent)] disabled:opacity-40 transition-colors"
        >
          {t('bureauxCancel')}
        </button>
      )}

      {cancelAtPeriodEnd ? (
        <p className="font-sans text-[12px] text-page-faint leading-relaxed max-w-md">
          {t('bureauxCancelHint')}
        </p>
      ) : null}

      {message ? (
        <p className="font-sans text-[13px] text-page-muted leading-snug">
          {message}
        </p>
      ) : null}
    </div>
  );
}
