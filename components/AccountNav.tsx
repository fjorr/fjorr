'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';

type NavItem = {
  href:
    | '/account/voyages'
    | '/account/nominations'
    | '/account/plus'
    | '/account/bureaux'
    | '/account/cabinet';
  labelKey:
    | 'navLogs'
    | 'navNominations'
    | 'navPlus'
    | 'navBureaux'
    | 'navCabinet';
};

function isActive(pathname: string, item: NavItem) {
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function buildItems(): NavItem[] {
  return [
    { href: '/account/voyages', labelKey: 'navLogs' },
    { href: '/account/nominations', labelKey: 'navNominations' },
    { href: '/account/plus', labelKey: 'navPlus' },
    { href: '/account/cabinet', labelKey: 'navCabinet' },
    { href: '/account/bureaux', labelKey: 'navBureaux' },
  ];
}

function AccountDisplayName({
  name,
  size = 'sidebar',
}: {
  name: string;
  size?: 'sidebar' | 'bar';
}) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  if (size === 'bar') {
    return (
      <p className="font-interTight font-extrabold text-[15px] tracking-normal text-page leading-none truncate select-none">
        {trimmed}
      </p>
    );
  }
  return (
    <p className="font-interTight font-extrabold text-[18px] tracking-normal text-page leading-none truncate select-none">
      {trimmed}
    </p>
  );
}

function AccountIdentity({
  name,
  bureauxNoLabel,
  bureauxNumber,
  broughtByLabel,
  broughtByNumber,
  broughtInLabel,
  broughtInCount,
}: {
  name: string | null;
  bureauxNoLabel: string;
  bureauxNumber: number | null;
  broughtByLabel: string;
  broughtByNumber: number | null;
  broughtInLabel: string;
  broughtInCount: number;
}) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      {name ? <AccountDisplayName name={name} size="sidebar" /> : null}
      <div className="flex flex-col gap-0.5">
        {bureauxNumber != null ? (
          <p className="font-sans text-[15px] font-semibold tracking-tight text-page tabular-nums">
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
    </div>
  );
}

/** Account sidebar (desktop) + navbar-style dropdown (mobile). */
export default function AccountNav({
  displayName,
  bureauxNumber = null,
  broughtByNumber = null,
  broughtInCount = 0,
}: {
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
  const rootRef = useRef<HTMLDivElement>(null);

  const close = () => setOpen(false);

  const handleSignOut = async () => {
    close();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open]);

  const linkClass = (active: boolean) =>
    `flex flex-col gap-0.5 rounded-[8px] px-2.5 py-1.5 transition-colors ${
      active
        ? 'bg-page-chip text-page'
        : 'text-page-muted hover:bg-page-chip hover:text-page'
    }`;

  const identity = (
    <AccountIdentity
      name={name}
      bureauxNoLabel={t('bureauxNo')}
      bureauxNumber={bureauxNumber}
      broughtByLabel={t('bureauxBroughtBy')}
      broughtByNumber={broughtByNumber}
      broughtInLabel={t('bureauxBroughtIn')}
      broughtInCount={broughtInCount}
    />
  );

  const desktopNav = (
    <>
      <div className="px-2 flex flex-col gap-2">{identity}</div>

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
      {/*
        Mobile — same horizontal rhythm as Navbar:
        header px-4 + bar pl-3 / pr-4 → name under logo, Account under language.
      */}
      <div className="md:hidden w-full px-4 pt-3 pb-4">
        <div
          ref={rootRef}
          className="relative z-20 w-full max-w-[calc(100vw-2rem)]"
        >
          <div
            className={`rounded-[10px] bg-page-chip pl-3 pr-4 transition-shadow duration-300 ${
              open ? 'menu-surface shadow-[0_12px_40px_rgba(0,0,0,0.35)]' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-4 py-2.5">
              <div className="min-w-0">
                {name ? <AccountDisplayName name={name} size="bar" /> : null}
              </div>
              <button
                type="button"
                aria-label={open ? t('closeAccountMenu') : t('openAccountMenu')}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpen((v) => !v)}
                className="shrink-0 inline-flex items-center gap-1.5 font-sans text-[13px] font-semibold tracking-tight text-page-muted hover:text-page transition-colors"
              >
                <span>{t('accountMenu')}</span>
                <svg
                  aria-hidden
                  viewBox="0 0 12 12"
                  className={`w-2.5 h-2.5 transition-transform duration-300 ${
                    open ? 'rotate-180' : ''
                  }`}
                  fill="none"
                >
                  <path
                    d="M2.5 4.25 6 7.75l3.5-3.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <div
              id={panelId}
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden min-h-0">
                <div
                  role="dialog"
                  aria-label={t('accountMenu')}
                  className="flex flex-col gap-5 pb-5 pt-1"
                >
                  <nav
                    aria-label={t('accountTitle')}
                    className="flex flex-col gap-1.5"
                  >
                    {items.map((item) => {
                      const active = isActive(pathname, item);
                      const label = t(item.labelKey);
                      if (active) {
                        return (
                          <span
                            key={item.href}
                            aria-current="page"
                            className="font-sans text-[15px] font-semibold tracking-tight text-page-faint cursor-default select-none"
                          >
                            {label}
                          </span>
                        );
                      }
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={close}
                          className="font-sans text-[15px] font-semibold tracking-tight text-page hover:opacity-70 transition-opacity"
                        >
                          {label}
                        </Link>
                      );
                    })}
                  </nav>

                  <div className="pt-4 border-t border-page-faint">
                    <button
                      type="button"
                      onClick={() => void handleSignOut()}
                      className="font-sans text-[15px] font-semibold tracking-tight text-page-faint hover:text-page-muted transition-colors"
                    >
                      {t('signOut')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex w-[15.5rem] shrink-0 border-r border-page-faint px-4 py-8 md:min-h-[calc(100vh-4rem)] flex-col gap-6 relative overflow-hidden"
        style={{
          backgroundImage: `radial-gradient(
            color-mix(in srgb, var(--page-fg) 14%, transparent) 0.7px,
            transparent 0.7px
          )`,
          backgroundSize: '7px 7px',
        }}
      >
        <div className="relative flex flex-col gap-6 flex-1 min-h-0">
          {desktopNav}
        </div>
      </aside>
    </>
  );
}
