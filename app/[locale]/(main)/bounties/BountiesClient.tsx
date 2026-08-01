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

function BountyPosterCard({
  bounty,
  index,
  archived,
  awardedLabel,
}: {
  bounty: BountyRow;
  index: number;
  archived?: boolean;
  awardedLabel: string;
}) {
  return (
    <li
      className="flex flex-col opacity-0 animate-bounty-in"
      style={{ animationDelay: `${80 + index * 70}ms` }}
    >
      <Link
        href={`/bounties/${bounty.slug}`}
        className="group block overflow-hidden rounded-[5px] bg-page-chip"
      >
        {bounty.poster_image_url ? (
          <img
            src={bounty.poster_image_url}
            alt={bounty.title}
            className="w-full aspect-[2/3] object-cover object-center block opacity-90 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-700"
          />
        ) : (
          <div className="w-full aspect-[2/3] bg-page-chip flex items-end p-4">
            <span className="font-sans text-[13px] font-semibold text-page-muted">
              {bounty.title}
            </span>
          </div>
        )}
      </Link>
      <div className="mt-3 flex flex-col gap-0.5 min-w-0">
        <Link
          href={`/bounties/${bounty.slug}`}
          className="font-sans text-[13px] sm:text-[14px] font-semibold text-page tracking-normal truncate hover:opacity-70 transition-opacity"
        >
          {bounty.title}
        </Link>
        {archived ? (
          <span className="font-sans text-[13px] sm:text-[14px] font-semibold tracking-normal text-page-muted">
            {awardedLabel}
          </span>
        ) : (
          <span className="font-sans text-[15px] sm:text-[16px] font-semibold tracking-normal text-page-muted tabular-nums">
            {formatMoney(bounty.reward_amount, bounty.currency)}
          </span>
        )}
      </div>
    </li>
  );
}

export default function BountiesClient({
  bounties,
  archivedBounties = [],
  bureauxActive,
}: {
  bounties: BountyRow[];
  archivedBounties?: BountyRow[];
  bureauxActive: boolean;
}) {
  const t = useTranslations('Bounties');

  return (
    <div className="w-full min-h-screen bg-[var(--page-bg)] text-page pb-28">
      <div className="w-full max-w-4xl mx-auto px-[10%] pt-14 sm:pt-20 flex flex-col items-center text-center">
        <div className="w-full flex flex-col items-center">
          <div className="flex flex-col items-center w-full">
            <p className="font-sans text-lg sm:text-xl font-semibold normal-case tracking-normal text-page select-none">
              {t('eyebrow')}
            </p>
            <h1 className="mt-2 sm:mt-2.5 mb-5 sm:mb-6 font-futura tracking-tighter text-page select-none text-[clamp(2.5rem,8vw,4.5rem)] !leading-[0.9] text-center max-w-[16ch] sm:max-w-[18ch]">
              {t('title')
                .split('\n')
                .filter(Boolean)
                .map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
            </h1>
            <p className="font-sans font-medium text-[15px] sm:text-[16px] leading-[1.55] tracking-normal text-page max-w-md">
              {t('description')}
            </p>
          </div>

          <Link
            href="/principles"
            className="mt-4 font-sans text-[13px] sm:text-[14px] font-semibold text-page-muted hover:text-page transition-colors underline underline-offset-2"
          >
            {t('principlesLink')}
          </Link>
          <p className="mt-3 font-sans text-[13px] sm:text-[14px] leading-snug text-page-muted max-w-sm tracking-normal">
            {t('generalBlurb')}{' '}
            <Link
              href="/nominate"
              className="font-semibold underline underline-offset-2 hover:text-page transition-colors"
            >
              {t('generalPitch')}
            </Link>
          </p>
          {!bureauxActive && (
            <p className="mt-3 font-sans text-[13px] sm:text-[14px] text-page-muted leading-snug max-w-sm">
              {t('membersNote')}{' '}
              <Link
                href="/bureaux"
                className="font-semibold underline underline-offset-2 hover:text-page transition-colors"
              >
                {t('joinToPitch')}
              </Link>
            </p>
          )}
        </div>
      </div>

      {bounties.length === 0 ? (
        <div className="w-full max-w-5xl mx-auto px-5 sm:px-8 mt-10 text-center">
          <p className="font-sans text-[15px] text-page-muted">{t('empty')}</p>
        </div>
      ) : (
        <div className="w-full max-w-5xl mx-auto px-5 sm:px-8 mt-10">
          <h2 className="mb-5 sm:mb-6 font-sans text-[15px] sm:text-[16px] font-semibold normal-case tracking-normal text-page text-left">
            {t('openHeading')}
          </h2>
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {bounties.map((bounty, index) => (
              <BountyPosterCard
                key={bounty.id}
                bounty={bounty}
                index={index}
                awardedLabel={t('awarded')}
              />
            ))}
          </ul>
        </div>
      )}

      {archivedBounties.length > 0 ? (
        <div className="w-full max-w-5xl mx-auto px-5 sm:px-8 mt-16 sm:mt-20">
          <h2 className="mb-5 sm:mb-6 font-sans text-[15px] sm:text-[16px] font-semibold normal-case tracking-normal text-page text-left">
            {t('archiveHeading')}
          </h2>
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {archivedBounties.map((bounty, index) => (
              <BountyPosterCard
                key={bounty.id}
                bounty={bounty}
                index={index}
                archived
                awardedLabel={t('awarded')}
              />
            ))}
          </ul>
        </div>
      ) : null}

      {(bounties.length > 0 || archivedBounties.length > 0) && (
        <p className="mt-8 sm:mt-10 mx-auto max-w-xl px-5 text-center font-sans text-[12px] sm:text-[13px] leading-snug text-page-muted tracking-normal text-pretty">
          {t('legalLine')}{' '}
          <Link
            href="/terms"
            className="whitespace-nowrap underline underline-offset-2 hover:text-page transition-colors"
          >
            {t('legalTerms')}
          </Link>
        </p>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes bountyIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-bounty-in {
          animation: bountyIn 700ms cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
      `,
        }}
      />
    </div>
  );
}
