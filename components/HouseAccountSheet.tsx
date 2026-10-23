'use client';

import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthPresence } from '@/components/AuthPresenceProvider';
import SheetEnter from '@/components/house/SheetEnter';

type NavItem = {
  href:
    | '/account/voyages'
    | '/account/bureaux'
    | '/account/early'
    | '/account/nominations'
    | '/account/bureaux';
  labelKey:
    | 'navLogs'
    | 'navBureaux'
    | 'navEarlyRelease'
    | 'navNominations';
  membersOnly?: boolean;
};

const ITEMS: NavItem[] = [
  { href: '/account/voyages', labelKey: 'navLogs' },
  { href: '/account/early', labelKey: 'navEarlyRelease', membersOnly: true },
  { href: '/account/nominations', labelKey: 'navNominations', membersOnly: true },
  { href: '/account/bureaux', labelKey: 'navBureaux' },
];

const ACCOUNT_HEAD =
  "m-0 mb-8 text-center text-balance font-[family-name:var(--font-circular-black)] text-[clamp(2.25rem,5.5vw,3rem)] font-[900] leading-[1.05] tracking-[-0.045em] text-[#0B0B0C]";

/**
 * Account doorway — same centered white sheet as Languages and Shortcuts.
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
  const { displayName, bureauxNumber, bureauxMember } = useAuthPresence();
  const [signingOut, setSigningOut] = useState(false);
  const isMember = bureauxMember === true;
  const unpaid = bureauxMember === false;

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

  const visibleItems = ITEMS.filter(
    (item) => !item.membersOnly || isMember
  );

  return (
    <div
      role="dialog"
      aria-label={tNav('account')}
      className="absolute inset-0 z-50 flex flex-col bg-white text-[#0B0B0C]"
    >
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6">
        <SheetEnter className="flex w-full max-w-[36rem] flex-col items-center">
          <h1 className={ACCOUNT_HEAD}>{displayName?.trim() || '\u00a0'}</h1>

          {isMember && bureauxNumber != null ? (
            <p className="m-0 inline-flex h-12 items-center gap-3.5 rounded-full bg-[#F5F5F7] pl-6 pr-5">
              <span className="font-sans text-[15px] font-semibold tracking-tight text-[#0B0B0C]">
                {t('bureauxNo')}
              </span>
              <span className="font-sans text-[13px] font-medium tabular-nums tracking-[0.08em] text-black/35">
                {bureauxNumber}
              </span>
            </p>
          ) : unpaid ? (
            <p className="m-0 inline-flex h-12 items-center rounded-full bg-[#F5F5F7] px-6 font-sans text-[15px] font-semibold tracking-tight text-[#0B0B0C]">
              {t('unpaidStatus')}
            </p>
          ) : (
            <p className="m-0 h-12" aria-hidden />
          )}

          <nav aria-label={tNav('account')} className="mt-8">
            <ul className="m-0 flex list-none flex-col items-center gap-1.5 p-0">
              {visibleItems.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      onClick={(event) => {
                        event.preventDefault();
                        onNavigate(item.href);
                      }}
                      className={`bg-transparent p-0 font-sans text-[15px] font-medium tracking-tight transition-colors hover:text-[#0B0B0C] ${
                        active ? 'text-[#0B0B0C]' : 'text-black/45'
                      }`}
                    >
                      {t(item.labelKey)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <button
            type="button"
            disabled={signingOut}
            onClick={() => void handleSignOut()}
            className="mt-8 inline-flex items-center gap-1.5 border-0 bg-transparent p-0 font-sans text-[15px] font-medium tracking-tight text-black/30 transition-colors hover:text-[#0B0B0C] disabled:opacity-40"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
            {t('signOut')}
          </button>
        </SheetEnter>
      </div>
    </div>
  );
}
