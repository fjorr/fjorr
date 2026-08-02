'use client';

import React, { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { redeemBureauxGiftAction } from '@/lib/bureaux-gift-redeem-actions';

export default function BureauxGiftRedeem({ token }: { token: string }) {
  const t = useTranslations('Bureaux');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      {error ? (
        <p className="font-sans text-[13px] text-[#C45B4A]">{error}</p>
      ) : null}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await redeemBureauxGiftAction(token);
            if (result && !result.ok) {
              setError(t(`giftError.${result.error}`));
            }
          });
        }}
        className="self-start inline-flex h-12 items-center px-7 rounded-full bg-[var(--page-fg)] text-[var(--page-bg)] font-sans text-[14px] font-bold disabled:opacity-40"
      >
        {pending ? t('ctaPending') : t('giftRedeemCta')}
      </button>
    </div>
  );
}
