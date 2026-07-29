'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { BountyRow } from '@/lib/nomination-actions';

function formatMoney(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  } catch {
    return `$${Math.round(cents / 100)}`;
  }
}

export default function BountyBriefClient({
  bounty,
  signedIn,
}: {
  bounty: BountyRow;
  signedIn: boolean;
}) {
  const t = useTranslations('Bounties');
  const nominateHref = `/nominate?bounty=${encodeURIComponent(bounty.slug)}`;

  const openSignIn = () => {
    window.dispatchEvent(
      new CustomEvent('fjorr_open_signin', {
        detail: { nextPath: nominateHref },
      })
    );
  };

  return (
    <div className="w-full min-h-screen bg-[var(--page-bg)] text-page pb-28">
      {bounty.hero_image_url ? (
        <div className="w-full bg-page-chip overflow-hidden">
          <img
            src={bounty.hero_image_url}
            alt=""
            className="w-full h-auto max-h-[72vh] object-cover object-center block"
          />
        </div>
      ) : (
        <div className="w-full h-48 sm:h-64 bg-page-chip" aria-hidden />
      )}

      <div className="w-full max-w-2xl mx-auto px-6 sm:px-10 pt-8 sm:pt-10 flex flex-col gap-6">
        <Link
          href="/bounties"
          className="font-sans text-[13px] font-semibold text-page-faint hover:text-page-muted transition-colors w-fit"
        >
          ← {t('backToGrid')}
        </Link>

        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1 className="font-futura text-4xl sm:text-5xl md:text-6xl font-extrabold uppercase tracking-tighter text-page leading-[0.95] select-none">
            {bounty.title}
          </h1>
          <span className="font-mono text-[15px] text-page-muted tabular-nums">
            {formatMoney(bounty.amount_cents, bounty.currency)}
          </span>
        </div>

        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-page-faint">
          {t('active')} · {t('creativeBrief')}
        </p>

        {bounty.brief && (
          <p className="font-sans text-[16px] sm:text-[17px] leading-relaxed text-page-muted whitespace-pre-wrap max-w-xl">
            {bounty.brief}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4 pt-2">
          {signedIn ? (
            <Link
              href={nominateHref}
              className="inline-flex h-12 px-8 rounded-full bg-[var(--page-fg)] text-[var(--page-bg)] font-sans text-[14px] font-bold items-center hover:opacity-90 active:scale-[0.98] transition-all"
            >
              {t('pitchThis')}
            </Link>
          ) : (
            <button
              type="button"
              onClick={openSignIn}
              className="inline-flex h-12 px-8 rounded-full bg-[var(--page-fg)] text-[var(--page-bg)] font-sans text-[14px] font-bold items-center hover:opacity-90 active:scale-[0.98] transition-all"
            >
              {t('signInToPitch')}
            </button>
          )}
        </div>

        {!signedIn && (
          <p className="font-sans text-[13px] text-page-faint leading-snug max-w-sm">
            {t('membersNote')}
          </p>
        )}
      </div>
    </div>
  );
}
