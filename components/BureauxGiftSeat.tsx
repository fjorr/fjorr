'use client';

import React, { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { startBureauxGiftCheckout } from '@/lib/bureaux-gift-actions';

const FIELD_LABEL =
  'font-sans text-[13px] font-semibold normal-case tracking-normal text-page-muted';

/** Gift a seat — quiet section, same chrome as other Bureaux forms. */
export default function BureauxGiftSeat({
  canGift,
  reason,
  openGiftUrl,
  openGiftEmail,
}: {
  canGift: boolean;
  reason: 'ok' | 'notActive' | 'hasOpen' | 'quotaUsed';
  openGiftUrl?: string | null;
  openGiftEmail?: string | null;
}) {
  const t = useTranslations('Bureaux');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="font-sans text-[15px] font-semibold tracking-tight text-page">
          {t('giftTitle')}
        </h2>
        <p className="font-sans text-[14px] text-page-muted leading-relaxed max-w-md">
          {t('giftLead')}
        </p>
      </div>

      {reason === 'hasOpen' && openGiftUrl ? (
        <div className="flex flex-col gap-2 max-w-md">
          <p className="font-sans text-[13px] text-page leading-snug">
            {t('giftOpen', { email: openGiftEmail || '…' })}
          </p>
          <p className="font-mono text-[12px] text-page-faint break-all">
            {openGiftUrl}
          </p>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(openGiftUrl);
            }}
            className="self-start font-sans text-[13px] font-semibold text-page underline underline-offset-2"
          >
            {t('giftCopyLink')}
          </button>
        </div>
      ) : null}

      {reason === 'quotaUsed' ? (
        <p className="font-sans text-[13px] text-page-faint leading-snug max-w-md">
          {t('giftQuotaUsed')}
        </p>
      ) : null}

      {canGift ? (
        <form
          className="flex flex-col gap-3 max-w-md"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            startTransition(async () => {
              const result = await startBureauxGiftCheckout(email);
              if (!result.ok) {
                setError(t(`giftError.${result.error}`));
                return;
              }
              window.location.assign(result.url);
            });
          }}
        >
          <label className="flex flex-col gap-2">
            <span className={FIELD_LABEL}>{t('giftEmailLabel')}</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('giftEmailPlaceholder')}
              disabled={pending}
              className="h-11 rounded-[10px] bg-page-chip px-4 font-sans text-[15px] text-page placeholder:text-page-faint focus:outline-none disabled:opacity-50"
            />
          </label>
          {error ? (
            <p className="font-sans text-[13px] text-red-400/90">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={pending || !email.trim()}
            className="self-start h-11 px-5 rounded-full bg-[var(--page-fg)] text-[var(--page-bg)] font-sans text-[13px] font-bold hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {pending ? t('ctaPending') : t('giftCta')}
          </button>
        </form>
      ) : null}
    </section>
  );
}
