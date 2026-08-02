'use client';

import React, { useEffect, useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';

type NavItem = {
  href:
    | '/account/voyages'
    | '/account/nominations'
    | '/account/plus'
    | '/bureaux'
    | '/cabinet'
    | '/account/profile'
    | '/account/privacy';
  labelKey:
    | 'navLogs'
    | 'navNominations'
    | 'navPlus'
    | 'navBureaux'
    | 'navCabinet'
    | 'navProfile'
    | 'navPrivacy';
};

function isActive(pathname: string, item: NavItem) {
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function buildItems(): NavItem[] {
  return [
    { href: '/account/voyages', labelKey: 'navLogs' },
    { href: '/bureaux', labelKey: 'navBureaux' },
    { href: '/account/nominations', labelKey: 'navNominations' },
    { href: '/account/plus', labelKey: 'navPlus' },
    { href: '/cabinet', labelKey: 'navCabinet' },
    { href: '/account/profile', labelKey: 'navProfile' },
    { href: '/account/privacy', labelKey: 'navPrivacy' },
  ];
}

function splitDisplayName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.length === 1) return { first: parts[0], rest: null as string | null };
  return { first: parts[0], rest: parts.slice(1).join(' ') };
}

function AccountDisplayName({ name }: { name: string }) {
  const parts = splitDisplayName(name);
  if (!parts) return null;
  return (
    <p className="font-futura text-[22px] tracking-tighter text-page leading-[1.05] select-none">
      <span className="block">{parts.first}</span>
      {parts.rest ? <span className="block">{parts.rest}</span> : null}
    </p>
  );
}

function AccountIdentity({
  memberNumber,
  name,
  memberNoLabel,
  bureauxNoLabel,
  bureauxNumber,
  broughtByLabel,
  broughtByNumber,
  broughtInLabel,
  broughtInCount,
}: {
  memberNumber: number;
  name: string | null;
  memberNoLabel: string;
  bureauxNoLabel: string;
  bureauxNumber: number | null;
  broughtByLabel: string;
  broughtByNumber: number | null;
  broughtInLabel: string;
  broughtInCount: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-col gap-0.5">
        <p className="font-sans text-[15px] font-semibold tracking-tight text-page tabular-nums">
          {memberNoLabel} {memberNumber}
        </p>
        {bureauxNumber != null ? (
          <p className="font-sans text-[13px] font-semibold tracking-tight text-page-muted tabular-nums">
            {bureauxNoLabel} {bureauxNumber}
          </p>
        ) : null}
        {broughtByNumber != null ? (
          <p className="font-sans text-[12px] text-page-faint tabular-nums">
            {broughtByLabel} № {broughtByNumber}
          </p>
        ) : null}
        {broughtInCount > 0 ? (
          <p className="font-sans text-[12px] text-page-faint tabular-nums">
            {broughtInLabel} {broughtInCount}
          </p>
        ) : null}
      </div>
      {name ? <AccountDisplayName name={name} /> : null}
    </div>
  );
}

/** Mercury-style account sidebar — Apple-like menu overlay on mobile. */
export default function AccountNav({
  memberNumber,
  displayName,
  bureauxNumber = null,
  broughtByNumber = null,
  broughtInCount = 0,
}: {
  memberNumber: number;
  displayName?: string | null;
  bureauxNumber?: number | null;
  broughtByNumber?: number | null;
  broughtInCount?: number;
}) {
  const t = useTranslations('Account');
  const pathname = usePathname() || '/account/voyages';
  const router = useRouter();
  const name = displayName?.trim() || null;
  const items = buildItems();
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const close = () => setOpen(false);

  const handleSignOut = async () => {
    close();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape + body scroll lock
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const linkClass = (active: boolean) =>
    `flex flex-col gap-0.5 rounded-[8px] px-2.5 py-1.5 transition-colors ${
      active
        ? 'bg-page-chip text-page'
        : 'text-page-muted hover:bg-page-chip hover:text-page'
    }`;

  const desktopNav = (
    <>
      <div className="px-2 flex flex-col gap-2">
        <AccountIdentity
          memberNumber={memberNumber}
          name={name}
          memberNoLabel={t('memberNo')}
          bureauxNoLabel={t('bureauxNo')}
          bureauxNumber={bureauxNumber}
          broughtByLabel={t('bureauxBroughtBy')}
          broughtByNumber={broughtByNumber}
          broughtInLabel={t('bureauxBroughtIn')}
          broughtInCount={broughtInCount}
        />
        <p className="font-sans text-[12px] text-page-faint leading-snug">
          {t('navMembershipHint')}
        </p>
      </div>

      <nav
        aria-label={t('accountTitle')}
        className="flex flex-col px-1 flex-1 min-h-0"
      >
        <ul className="flex flex-col gap-0.5 list-none m-0 p-0">
          {items.map((item) => {
            const active = isActive(pathname, item);
            return (
              <li key={item.href} className="min-w-0">
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={linkClass(active)}
                >
                  <span className="font-sans text-[14px] font-semibold tracking-tight">
                    {t(item.labelKey)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <button
        type="button"
        onClick={() => void handleSignOut()}
        className="mt-auto self-start mx-2 font-sans text-[13px] font-semibold text-page-faint hover:text-page-muted transition-colors"
      >
        {t('signOut')}
      </button>
    </>
  );

  return (
    <>
      {/* Mobile: Account menu trigger bar */}
      <div className="md:hidden w-full border-b border-page-faint px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0 flex flex-col gap-1">
          <p className="font-sans text-[13px] font-semibold tracking-tight text-page-muted tabular-nums">
            {t('memberNo')} {memberNumber}
          </p>
          {name ? <AccountDisplayName name={name} /> : null}
        </div>
        <button
          type="button"
          aria-label={open ? t('closeAccountMenu') : t('openAccountMenu')}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 inline-flex items-center gap-2 h-9 px-3 rounded-[8px] bg-page-chip hover:bg-page-chip-hover transition-colors"
        >
          <span className="font-sans text-[13px] font-semibold text-page">
            {t('accountMenu')}
          </span>
          <span className="relative w-[14px] h-[14px]" aria-hidden>
            <span
              className={`absolute left-1/2 top-1/2 block w-[12px] h-[1.5px] rounded-full bg-[var(--page-fg)] transition-transform duration-300 ease-out origin-center ${
                open
                  ? '-translate-x-1/2 -translate-y-1/2 rotate-45'
                  : '-translate-x-1/2 -translate-y-[3px]'
              }`}
            />
            <span
              className={`absolute left-1/2 top-1/2 block w-[12px] h-[1.5px] rounded-full bg-[var(--page-fg)] transition-transform duration-300 ease-out origin-center ${
                open
                  ? '-translate-x-1/2 -translate-y-1/2 -rotate-45'
                  : '-translate-x-1/2 translate-y-[3px]'
              }`}
            />
          </span>
        </button>
      </div>

      {/* Mobile: Apple-style full overlay menu */}
      <div
        id={panelId}
        className={`md:hidden fixed inset-0 z-[100040] transition-[visibility] duration-300 ${
          open ? 'visible' : 'invisible pointer-events-none'
        }`}
      >
        <button
          type="button"
          aria-label={t('closeAccountMenu')}
          onClick={close}
          className={`absolute inset-0 bg-black/55 backdrop-blur-[2px] transition-opacity duration-300 ${
            open ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('accountMenu')}
          className={`absolute inset-x-0 top-0 max-h-[min(100dvh,100%)] overflow-y-auto border-b border-page-faint bg-[color-mix(in_srgb,var(--page-bg)_92%,transparent)] backdrop-blur-[28px] shadow-[0_24px_80px_rgba(0,0,0,0.55)] transition-transform duration-300 ease-out ${
            open ? 'translate-y-0' : '-translate-y-3 opacity-0'
          } ${open ? 'opacity-100' : ''}`}
          style={{
            WebkitBackdropFilter: 'blur(28px) saturate(1.4)',
          }}
        >
          <div className="px-5 pt-4 pb-10 flex flex-col gap-8">
            <div className="flex items-start justify-between gap-3">
              <AccountIdentity
                memberNumber={memberNumber}
                name={name}
                memberNoLabel={t('memberNo')}
                bureauxNoLabel={t('bureauxNo')}
                bureauxNumber={bureauxNumber}
                broughtByLabel={t('bureauxBroughtBy')}
                broughtByNumber={broughtByNumber}
                broughtInLabel={t('bureauxBroughtIn')}
                broughtInCount={broughtInCount}
              />
              <button
                type="button"
                aria-label={t('closeAccountMenu')}
                onClick={close}
                className="relative mt-1 w-9 h-9 shrink-0 rounded-[8px] bg-page-chip hover:bg-page-chip-hover transition-colors"
              >
                <span
                  aria-hidden
                  className="absolute left-1/2 top-1/2 block w-[14px] h-[1.5px] rounded-full bg-[var(--page-fg)] -translate-x-1/2 -translate-y-1/2 rotate-45"
                />
                <span
                  aria-hidden
                  className="absolute left-1/2 top-1/2 block w-[14px] h-[1.5px] rounded-full bg-[var(--page-fg)] -translate-x-1/2 -translate-y-1/2 -rotate-45"
                />
              </button>
            </div>

            <nav aria-label={t('accountTitle')}>
              <ul className="flex flex-col list-none m-0 p-0">
                {items.map((item) => {
                  const active = isActive(pathname, item);
                  return (
                    <li key={item.href}>
                      {active ? (
                        <span
                          aria-current="page"
                          className="block py-2.5 font-sans text-[28px] font-semibold tracking-tight leading-none text-page-faint cursor-default select-none"
                        >
                          {t(item.labelKey)}
                        </span>
                      ) : (
                        <Link
                          href={item.href}
                          onClick={close}
                          className="block py-2.5 font-sans text-[28px] font-semibold tracking-tight leading-none text-page hover:opacity-70 transition-opacity"
                        >
                          {t(item.labelKey)}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>

            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="self-start pt-2 font-sans text-[15px] font-semibold text-page-faint hover:text-page-muted transition-colors"
            >
              {t('signOut')}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[15.5rem] shrink-0 border-r border-page-faint px-4 py-8 md:min-h-[calc(100vh-4rem)] flex-col gap-6">
        {desktopNav}
      </aside>
    </>
  );
}
