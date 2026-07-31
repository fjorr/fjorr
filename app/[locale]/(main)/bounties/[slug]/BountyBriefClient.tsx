'use client';

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { BountyRow, BountyStatus } from '@/lib/nomination-actions';

const HAIRLINE = 'color-mix(in srgb, var(--page-fg) 10%, transparent)';

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

function formatDate(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
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
  const locale = useLocale();
  const isOpen = bounty.status === 'open';
  const nominateHref = `/nominate?bounty=${encodeURIComponent(bounty.slug)}`;

  const openSignIn = () => {
    window.dispatchEvent(
      new CustomEvent('fjorr_open_signin', {
        detail: { nextPath: nominateHref },
      })
    );
  };

  const statusLabel = (status: BountyStatus) => {
    switch (status) {
      case 'open':
        return t('statusOpen');
      case 'claimed':
        return t('awarded');
      case 'in_production':
        return t('statusInProduction');
      case 'closed':
        return t('statusClosed');
      default:
        return status;
    }
  };

  const kindLabel =
    bounty.kind === 'fiction'
      ? t('kindFiction')
      : bounty.kind === 'both'
        ? t('kindBoth')
        : t('kindTrue');

  const rewardLabel = formatMoney(bounty.reward_amount, bounty.currency);
  const metaLine = [statusLabel(bounty.status), kindLabel]
    .filter(Boolean)
    .join(' · ');

  const legal = (
    <p className="font-sans text-[12px] leading-snug text-page-muted tracking-normal text-pretty max-w-sm">
      {t('legalLine')}{' '}
      <Link
        href="/terms"
        className="whitespace-nowrap underline underline-offset-2 hover:text-page transition-colors"
      >
        {t('legalTerms')}
      </Link>
    </p>
  );

  return (
    <main className="w-full min-h-[calc(100dvh-72px)] bg-[var(--page-bg)] text-page flex items-center justify-center px-5 sm:px-8 py-10 sm:py-14">
      <div className="w-full max-w-[980px] flex flex-col lg:flex-row lg:items-center gap-8 sm:gap-10 lg:gap-12">
        {/* Poster — left on desktop, below copy on mobile */}
        <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 order-2 lg:order-1">
          {bounty.poster_image_url ? (
            <img
              src={bounty.poster_image_url}
              alt={bounty.title}
              className="w-full aspect-[2/3] object-cover object-center rounded-[10px] bg-page-chip block"
            />
          ) : (
            <div
              className="w-full aspect-[2/3] rounded-[10px] bg-page-chip flex items-end p-5"
              aria-hidden
            >
              <span className="font-sans text-[14px] font-semibold text-page-muted">
                {bounty.title}
              </span>
            </div>
          )}
        </div>

        {/* Brief — first on mobile, right on desktop */}
        <aside className="w-full lg:flex-1 min-w-0 flex flex-col justify-center order-1 lg:order-2">
          <Link
            href="/bounties"
            className="font-sans text-[13px] font-semibold text-page-faint hover:text-page-muted transition-colors w-fit mb-6"
          >
            ← {t('backToGrid')}
          </Link>

          <span className="font-sans text-[10px] font-medium uppercase tracking-[0.08em] text-page-muted mb-3">
            {t('creativeBrief')}
          </span>

          <h1 className="font-futura text-[clamp(2rem,5vw,2.75rem)] font-extrabold uppercase tracking-tighter text-page !leading-[0.92] select-none mb-5">
            {bounty.title}
          </h1>

          <p className="font-sans text-[18px] sm:text-[20px] font-semibold tracking-tight tabular-nums text-page leading-none mb-3">
            {rewardLabel}
          </p>

          <p className="font-sans text-[13px] sm:text-[14px] font-medium leading-snug text-page-muted mb-6">
            {metaLine}
          </p>

          {bounty.brief ? (
            <p className="font-sans text-[15px] sm:text-[16px] font-medium leading-[1.55] tracking-normal text-page whitespace-pre-wrap max-w-md mb-8">
              {bounty.brief}
            </p>
          ) : null}

          {bounty.claimed_at ? (
            <dl
              className="m-0 border-t mb-8"
              style={{ borderColor: HAIRLINE }}
            >
              <div
                className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-4 py-3 border-b items-baseline"
                style={{ borderColor: HAIRLINE }}
              >
                <dt className="font-sans text-[12px] font-semibold text-page-muted">
                  {t('fieldAwarded')}
                </dt>
                <dd className="font-sans text-[14px] font-medium text-page m-0">
                  {formatDate(bounty.claimed_at, locale)}
                </dd>
              </div>
            </dl>
          ) : null}

          {isOpen ? (
            <div className="flex flex-col gap-3">
              {signedIn ? (
                <Link
                  href={nominateHref}
                  className="inline-flex h-12 px-8 rounded-full bg-[var(--page-fg)] text-[var(--page-bg)] font-sans text-[14px] font-bold items-center justify-center w-fit hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  {t('pitchThis')}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={openSignIn}
                  className="inline-flex h-12 px-8 rounded-full bg-[var(--page-fg)] text-[var(--page-bg)] font-sans text-[14px] font-bold items-center justify-center w-fit hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  {t('signInToPitch')}
                </button>
              )}
              {!signedIn && (
                <p className="font-sans text-[13px] text-page-faint leading-snug max-w-sm">
                  {t('membersNote')}
                </p>
              )}
            </div>
          ) : (
            <p className="font-sans text-[14px] text-page-muted leading-snug max-w-sm">
              {t('archiveBriefNote')}
            </p>
          )}

          <div className="mt-10 hidden lg:block">{legal}</div>
        </aside>

        {/* Legal — under poster on mobile */}
        <div className="order-3 lg:hidden">{legal}</div>
      </div>
    </main>
  );
}
