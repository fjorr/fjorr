import React from 'react';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import type { ScoutProfile } from '@/lib/profile';

type IndexLink = {
  href:
    | '/account/logs'
    | '/account/nominations'
    | '/account/plus'
    | '/account/profile';
  titleKey: 'navLogs' | 'navNominations' | 'navPlus' | 'navProfile';
  hintKey:
    | 'navLogsHint'
    | 'navNominationsHint'
    | 'navPlusHint'
    | 'navProfileHint';
  meta?: string | null;
};

/** Rams-style directory — identity + three destinations. Not a dashboard. */
export default async function AccountIndex({
  profile,
  nominationsActiveCount = 0,
}: {
  profile: ScoutProfile;
  nominationsActiveCount?: number;
}) {
  const t = await getTranslations('Account');
  const name = profile.display_name?.trim() || null;

  const links: IndexLink[] = [
    {
      href: '/account/logs',
      titleKey: 'navLogs',
      hintKey: 'navLogsHint',
    },
    {
      href: '/account/nominations',
      titleKey: 'navNominations',
      hintKey: 'navNominationsHint',
      meta:
        nominationsActiveCount > 0
          ? t('navNominationsMeta', { count: nominationsActiveCount })
          : null,
    },
    {
      href: '/account/plus',
      titleKey: 'navPlus',
      hintKey: 'navPlusHint',
    },
    {
      href: '/account/profile',
      titleKey: 'navProfile',
      hintKey: 'navProfileHint',
    },
  ];

  return (
    <div className="w-full max-w-sm flex flex-col gap-12">
      <div className="flex flex-col gap-3 text-left">
        <p className="font-mono text-[13px] text-white/40 tabular-nums">
          {name
            ? t('indexIdentity', { number: profile.member_number, name })
            : t('memberNumberLabel', { number: profile.member_number })}
        </p>
        <h1 className="font-sans text-2xl font-bold tracking-tight text-white">
          {t('accountTitle')}
        </h1>
        <p className="font-sans text-[15px] text-white/50 leading-relaxed">
          {t('accountBody')}
        </p>
      </div>

      <nav aria-label={t('accountTitle')} className="flex flex-col">
        <ul className="flex flex-col divide-y divide-white/8 border-y border-white/8 list-none m-0 p-0">
          {links.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group flex items-baseline justify-between gap-4 py-4"
              >
                <span className="min-w-0 flex flex-col gap-0.5">
                  <span className="font-sans text-[16px] font-semibold text-white/90 group-hover:text-white transition-colors">
                    {t(item.titleKey)}
                  </span>
                  <span className="font-sans text-[13px] text-white/35 leading-snug">
                    {t(item.hintKey)}
                  </span>
                </span>
                <span className="shrink-0 flex items-center gap-3">
                  {item.meta ? (
                    <span className="font-mono text-[12px] text-white/45 tabular-nums">
                      {item.meta}
                    </span>
                  ) : null}
                  <span
                    aria-hidden
                    className="font-sans text-[16px] text-white/30 group-hover:text-white/60 transition-colors"
                  >
                    →
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
