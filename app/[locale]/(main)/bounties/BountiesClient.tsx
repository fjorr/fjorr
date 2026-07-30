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

export default function BountiesClient({
  bounties,
  signedIn,
}: {
  bounties: BountyRow[];
  signedIn: boolean;
}) {
  const t = useTranslations('Bounties');

  const openSignIn = () => {
    window.dispatchEvent(
      new CustomEvent('fjorr_open_signin', {
        detail: { nextPath: '/bounties' },
      })
    );
  };

  return (
    <div className="w-full min-h-screen bg-[var(--page-bg)] text-page pb-28">
      <header className="w-full max-w-2xl mx-auto px-5 sm:px-8 pt-14 sm:pt-20 mb-12 sm:mb-16 text-center">
        <p className="mb-4 sm:mb-5 font-sans text-[15px] sm:text-[16px] font-semibold normal-case tracking-normal text-page select-none">
          {t('eyebrow')}
        </p>
        <h1 className="font-futura tracking-tighter text-page select-none text-4xl sm:text-5xl md:text-[4rem] leading-[1.05] text-balance">
          {t('title')}
        </h1>
        <p className="mt-5 sm:mt-6 font-sans font-medium text-[15px] sm:text-[16px] leading-snug tracking-normal text-page-muted max-w-md mx-auto">
          {t('description')}
        </p>
        <p className="mt-4 font-sans text-[13px] sm:text-[14px] leading-snug text-page-faint max-w-sm mx-auto tracking-normal">
          {t('principlesLead')}{' '}
          <Link
            href="/principles"
            className="underline underline-offset-2 hover:text-page-muted transition-colors"
          >
            {t('principlesLink')}
          </Link>
          .
        </p>
        {!signedIn && (
          <p className="mt-3 font-sans text-[13px] text-page-faint leading-snug max-w-sm mx-auto">
            {t('membersNote')}{' '}
            <button
              type="button"
              onClick={openSignIn}
              className="underline underline-offset-2 hover:text-page-muted transition-colors"
            >
              {t('signIn')}
            </button>
          </p>
        )}
      </header>

      {bounties.length === 0 ? (
        <div className="w-full max-w-5xl mx-auto px-5 sm:px-8">
          <p className="font-sans text-[15px] text-page-muted">{t('empty')}</p>
        </div>
      ) : (
        <div className="w-full max-w-5xl mx-auto px-5 sm:px-8">
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            {bounties.map((bounty, index) => (
              <li
                key={bounty.id}
                className="flex flex-col gap-2.5 opacity-0 animate-bounty-in"
                style={{ animationDelay: `${80 + index * 70}ms` }}
              >
                <Link
                  href={`/bounties/${bounty.slug}`}
                  className="group block bg-page-chip overflow-hidden"
                >
                  {bounty.hero_image_url ? (
                    <img
                      src={bounty.hero_image_url}
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
                <div className="px-0.5 flex flex-col gap-0.5 min-w-0">
                  <Link
                    href={`/bounties/${bounty.slug}`}
                    className="font-sans text-[13px] sm:text-[14px] font-semibold text-page tracking-tight truncate hover:opacity-70 transition-opacity"
                  >
                    {bounty.title}
                  </Link>
                  <span className="font-mono text-[11px] text-page-faint tabular-nums">
                    {formatMoney(bounty.amount_cents, bounty.currency)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="w-full max-w-5xl mx-auto px-5 sm:px-8 mt-16 sm:mt-24 pt-10 border-t border-page-faint flex flex-col items-center gap-3 text-center">
        <p className="font-sans text-[14px] text-page-muted leading-relaxed max-w-md tracking-normal">
          {t('generalBlurb')}
        </p>
        <Link
          href="/nominate"
          className="font-sans text-[14px] font-semibold text-page-muted hover:text-page transition-colors underline underline-offset-4 decoration-page-faint"
        >
          {t('generalPitch')} →
        </Link>
      </div>

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
