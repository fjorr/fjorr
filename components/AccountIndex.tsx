import React from 'react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { ScoutProfile } from '@/lib/profile';

/** Account overview — main pane content; navigation lives in AccountShell. */
export default async function AccountIndex({
  profile,
  nominationsActiveCount = 0,
}: {
  profile: ScoutProfile;
  nominationsActiveCount?: number;
}) {
  const t = await getTranslations('Account');
  const name = profile.display_name?.trim() || null;

  const shortcuts = [
    {
      href: '/account/voyages' as const,
      title: t('navLogs'),
      hint: t('navLogsHint'),
    },
    {
      href: '/account/nominations' as const,
      title: t('navNominations'),
      hint: t('navNominationsHint'),
      meta:
        nominationsActiveCount > 0
          ? t('navNominationsMeta', { count: nominationsActiveCount })
          : null,
    },
    {
      href: '/account/plus' as const,
      title: t('navPlus'),
      hint: t('navPlusHint'),
    },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2 text-left">
        <p className="font-mono text-[13px] text-white/40 tabular-nums">
          {name
            ? t('indexIdentity', { number: profile.member_number, name })
            : t('memberNumberLabel', { number: profile.member_number })}
        </p>
      </div>

      <ul className="m-0 p-0 list-none grid grid-cols-1 sm:grid-cols-3 gap-3">
        {shortcuts.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="group flex flex-col gap-1.5 rounded-[12px] border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] px-4 py-4 transition-colors h-full"
            >
              <span className="font-sans text-[15px] font-semibold text-white/90 group-hover:text-white">
                {item.title}
              </span>
              <span className="font-sans text-[13px] text-white/40 leading-snug">
                {item.hint}
              </span>
              {item.meta ? (
                <span className="font-mono text-[11px] text-white/45 tabular-nums mt-1">
                  {item.meta}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
