'use client';

import React, { useEffect, useId, useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';

type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const GROUPS: NavGroup[] = [
  {
    label: 'Intelligence',
    items: [
      { href: '/admin', label: 'Overview', exact: true },
      { href: '/admin/nominations', label: 'Nominations' },
      { href: '/admin/bounties', label: 'Bounties' },
    ],
  },
  {
    label: 'Craft',
    items: [
      { href: '/admin/plus', label: 'Plus Machine' },
      { href: '/admin/cabinet', label: 'Cabinet' },
    ],
  },
];

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/**
 * Control — admin chrome aligned with account (sidebar + soft dividers).
 */
export default function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() || '/admin';
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const close = () => setOpen(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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
    `flex rounded-[8px] px-2.5 py-1.5 transition-colors ${
      active
        ? 'bg-page-chip text-page'
        : 'text-page-muted hover:bg-page-chip hover:text-page'
    }`;

  const navList = (
    <nav aria-label="Control" className="flex flex-col gap-5 flex-1 min-h-0">
      {GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <p className="px-2.5 font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-page-faint">
            {group.label}
          </p>
          <ul className="flex flex-col gap-0.5 list-none m-0 p-0">
            {group.items.map((item) => {
              const active = isActive(pathname, item);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={close}
                    aria-current={active ? 'page' : undefined}
                    className={linkClass(active)}
                  >
                    <span className="font-sans text-[14px] font-semibold tracking-tight">
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="w-full min-h-screen bg-page text-page flex flex-col md:flex-row">
      {/* Mobile trigger */}
      <div className="md:hidden w-full border-b border-page-faint px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0 flex flex-col gap-0.5">
          <p className="font-sans text-[13px] font-semibold tracking-tight text-page">
            Control
          </p>
          <p className="font-mono text-[11px] text-page-faint truncate">
            {email}
          </p>
        </div>
        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 inline-flex items-center h-9 px-3 rounded-[8px] bg-page-chip hover:bg-page-chip-hover transition-colors font-sans text-[13px] font-semibold text-page"
        >
          Menu
        </button>
      </div>

      {/* Mobile overlay */}
      <div
        id={panelId}
        className={`md:hidden fixed inset-0 z-[100040] transition-[visibility] duration-300 ${
          open ? 'visible' : 'invisible pointer-events-none'
        }`}
      >
        <button
          type="button"
          aria-label="Close menu"
          onClick={close}
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
            open ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Control menu"
          className={`absolute inset-x-0 top-0 border-b border-page-faint bg-page transition-transform duration-300 ease-out ${
            open ? 'translate-y-0' : '-translate-y-3 opacity-0'
          }`}
        >
          <div className="px-4 pt-4 pb-8 flex flex-col gap-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <p className="font-sans text-[15px] font-semibold tracking-tight text-page">
                  Control
                </p>
                <p className="font-mono text-[11px] text-page-faint truncate max-w-[16rem]">
                  {email}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close menu"
                onClick={close}
                className="h-9 px-3 rounded-[8px] bg-page-chip font-sans text-[13px] font-semibold text-page"
              >
                Close
              </button>
            </div>
            {navList}
            <Link
              href="/"
              onClick={close}
              className="self-start font-sans text-[13px] font-semibold text-page-faint hover:text-page-muted transition-colors"
            >
              ← Site
            </Link>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[15.5rem] shrink-0 border-r border-page-faint px-4 py-8 md:min-h-screen flex-col gap-6">
        <div className="px-2 flex flex-col gap-1.5">
          <p className="font-sans text-[15px] font-semibold tracking-tight text-page">
            Control
          </p>
          <p
            className="font-mono text-[11px] text-page-faint truncate"
            title={email}
          >
            {email}
          </p>
        </div>

        {navList}

        <Link
          href="/"
          className="mt-auto self-start mx-2 font-sans text-[13px] font-semibold text-page-faint hover:text-page-muted transition-colors"
        >
          ← Site
        </Link>
      </aside>

      <main className="flex-1 min-w-0 px-5 sm:px-8 md:px-10 py-8 md:py-10">
        {children}
      </main>
    </div>
  );
}
