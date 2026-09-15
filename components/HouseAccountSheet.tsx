'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthPresence } from '@/components/AuthPresenceProvider';
import { HOUSE_STAGE_SIDE_CLASS } from '@/components/house/house-stage-margins';
import SheetEnter from '@/components/house/SheetEnter';

type NavItem = {
  href: '/account/voyages' | '/account/bureaux' | '/account/early';
  labelKey: 'navLogs' | 'navBureaux' | 'navEarlyRelease';
  hintKey?: 'navLogsHint' | 'navEarlyReleaseHint' | 'navBureauxHint';
};

const ITEMS: NavItem[] = [
  { href: '/account/voyages', labelKey: 'navLogs', hintKey: 'navLogsHint' },
  {
    href: '/account/early',
    labelKey: 'navEarlyRelease',
    hintKey: 'navEarlyReleaseHint',
  },
  {
    href: '/account/bureaux',
    labelKey: 'navBureaux',
    hintKey: 'navBureauxHint',
  },
];

/**
 * Account doorway — framed like the house hero poster.
 * Identity comes from AuthPresence (prefetched) so open doesn’t jump.
 */
export default function HouseAccountSheet({
  onNavigate,
}: {
  onNavigate: (href: string) => void;
}) {
  const t = useTranslations('Account');
  const tNav = useTranslations('Nav');
  const pathname = usePathname() || '';
  const router = useRouter();
  const { displayName, bureauxNumber } = useAuthPresence();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      onNavigate('/');
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-label={tNav('account')}
      className={`absolute inset-0 ${HOUSE_STAGE_SIDE_CLASS}`}
    >
      <SheetEnter className="relative flex h-full w-full flex-col overflow-hidden rounded-[8px] bg-[#F5F5F7] text-[#0B0B0C]">
        <div className="flex min-h-0 flex-1 flex-col px-8 py-9 md:px-12 md:py-12">
          <div className="flex flex-col gap-8 md:gap-10">
            <div className="flex flex-col gap-2">
              <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-black/35">
                {tNav('account')}
              </p>
              <p className="m-0 min-h-[clamp(2rem,5vw,2.75rem)] font-interTight text-[clamp(2rem,5vw,2.75rem)] font-extrabold leading-none tracking-tight text-[#0B0B0C]">
                {displayName || '\u00a0'}
              </p>
              <p className="m-0 min-h-[1.25rem] font-sans text-[14px] font-semibold tabular-nums tracking-tight text-black/45">
                {bureauxNumber != null
                  ? `${t('bureauxNo')} ${bureauxNumber}`
                  : '\u00a0'}
              </p>
            </div>

            <nav
              aria-label={tNav('account')}
              className="flex flex-col gap-4 md:gap-5"
            >
              {ITEMS.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      onNavigate(item.href);
                    }}
                    className="group flex flex-col gap-0.5 text-left"
                  >
                    <span className="font-sans text-[17px] font-bold tracking-tight text-[#0B0B0C] transition-opacity group-hover:opacity-70 md:text-[18px]">
                      {t(item.labelKey)}
                    </span>
                    {item.hintKey ? (
                      <span className="font-sans text-[13px] font-medium text-black/40 md:text-[14px]">
                        {t(item.hintKey)}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </div>

          <button
            type="button"
            disabled={signingOut}
            onClick={() => void handleSignOut()}
            className="mt-auto self-start border-0 bg-transparent p-0 pt-8 font-sans text-[14px] font-semibold text-black/40 transition-colors hover:text-[#0B0B0C] disabled:opacity-40"
          >
            {t('signOut')}
          </button>
        </div>
      </SheetEnter>
    </div>
  );
}
