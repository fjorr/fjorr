'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import MembersGateActions from '@/components/MembersGateActions';
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
  bureauxActive,
}: {
  bounty: BountyRow;
  bureauxActive: boolean;
}) {
  const t = useTranslations('Bounties');
  const locale = useLocale();
  const isOpen = bounty.status === 'open';
  const nominateHref = `/nominate?bounty=${encodeURIComponent(bounty.slug)}`;

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

  return (
    <main className="w-full min-h-[calc(100dvh-72px)] bg-[var(--page-bg)] text-page flex items-center justify-center px-5 sm:px-8 py-10 sm:py-14">
      <div className="w-full max-w-[980px] flex flex-col lg:flex-row lg:items-center gap-8 sm:gap-10 lg:gap-12">
        {/* Poster — first on mobile, left on desktop */}
        <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 order-1 opacity-0 animate-slide-up style-delay-body">
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

        {/* Brief — below poster on mobile, right on desktop */}
        <aside className="w-full lg:flex-1 min-w-0 flex flex-col justify-center order-2">
          <Link
            href="/bounties"
            className="inline-flex items-center gap-1.5 font-sans text-[13px] font-semibold text-page-faint hover:text-page-muted transition-colors w-fit mb-6 opacity-0 animate-slide-up style-delay-headline"
          >
            <ArrowLeft
              size={14}
              strokeWidth={1.75}
              className="shrink-0 translate-y-px"
              aria-hidden
            />
            {t('backToGrid')}
          </Link>

          <h1 className="font-futura text-[clamp(2rem,5vw,2.75rem)] font-extrabold uppercase tracking-tighter text-page !leading-[0.92] select-none mb-5 opacity-0 animate-slide-up style-delay-headline">
            {bounty.title}
          </h1>

          <div className="opacity-0 animate-slide-up style-delay-body">
          <p className="font-sans text-[18px] sm:text-[20px] font-semibold tracking-tight tabular-nums text-page leading-none mb-3">
            {rewardLabel}
          </p>

          <p className="font-sans text-[13px] sm:text-[14px] font-medium leading-snug text-page-muted mb-6">
            {metaLine}
          </p>

          {bounty.brief ? (
            <p className="font-sans text-[16px] font-medium leading-[1.55] tracking-normal text-page whitespace-pre-wrap max-w-md mb-8">
              {bounty.brief}
            </p>
          ) : null}
          </div>

          <div className="opacity-0 animate-slide-up style-delay-form">
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
            bureauxActive ? (
              <Link
                href={nominateHref}
                className="inline-flex h-12 px-8 rounded-full bg-[var(--page-fg)] text-[var(--page-bg)] font-sans text-[14px] font-bold items-center justify-center w-fit hover:opacity-90 active:scale-[0.98] transition-all"
              >
                {t('pitchThis')}
              </Link>
            ) : (
              <div className="flex flex-col items-start gap-5">
                <p className="font-sans font-medium text-[14px] leading-relaxed text-page-muted tracking-tight max-w-sm">
                  {t('membersNote')}
                </p>
                <MembersGateActions
                  joinLabel={t('joinToPitch')}
                  signInLabel={t('signInToPitch')}
                  nextPath={`/bounties/${bounty.slug}`}
                  className="items-start max-w-none"
                />
              </div>
            )
          ) : (
            <p className="font-sans text-[14px] text-page-muted leading-snug max-w-sm">
              {t('archiveBriefNote')}
            </p>
          )}

          {bureauxActive ? (
            <Link
              href="/principles"
              className="mt-5 font-sans text-[13px] sm:text-[14px] font-semibold text-page-muted hover:text-page transition-colors underline underline-offset-2 w-fit"
            >
              {t('principlesLink')}
            </Link>
          ) : null}
          </div>
        </aside>
      </div>
    </main>
  );
}
