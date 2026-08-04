'use client';

import React, { useEffect, useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import ColorSchemeToggle from '@/components/ColorSchemeToggle';
import FjorrMark from '@/components/help/FjorrMark';
import {
  MANUAL_ENTRIES,
  MANUAL_UPDATED,
  manualEntryHref,
} from '@/lib/help/content';

/**
 * The Manual chrome — filled master card on a lighter inset field, spine, sidebar colophon.
 */
export default function HelpShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations('Help');
  const pathname = usePathname() || '/manual';
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

  const isIndex = pathname === '/manual';
  const activeEntry = isIndex
    ? null
    : MANUAL_ENTRIES.find((e) => pathname === manualEntryHref(e.slug)) || null;
  const activeSlug = activeEntry?.slug ?? null;

  const spine = (
    <nav aria-label={t('navLabel')} className="flex flex-col gap-0">
      <Link
        href="/manual"
        onClick={close}
        aria-current={isIndex ? 'page' : undefined}
        className={`flex items-baseline gap-2.5 px-0 py-1 transition-colors ${
          isIndex ? 'text-page' : 'text-page-faint hover:text-page'
        }`}
      >
        <span className="font-mono text-[11px] font-semibold tabular-nums tracking-[0.08em] w-6 shrink-0">
          —
        </span>
        <span className="font-sans text-[13px] font-semibold tracking-tight">
          {t('index')}
        </span>
      </Link>
      {MANUAL_ENTRIES.map((entry) => {
        const href = manualEntryHref(entry.slug);
        const active = activeSlug === entry.slug;
        return (
          <Link
            key={entry.slug}
            href={href}
            onClick={close}
            aria-current={active ? 'page' : undefined}
            className={`flex items-baseline gap-2.5 px-0 py-1 transition-colors ${
              active ? 'text-page' : 'text-page-faint hover:text-page'
            }`}
          >
            <span className="font-mono text-[11px] font-semibold tabular-nums tracking-[0.08em] w-6 shrink-0">
              {entry.number}
            </span>
            <span className="font-sans text-[13px] font-semibold tracking-tight">
              {entry.title}
            </span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="w-full min-h-screen bg-page-elevated text-page p-5 sm:p-10 lg:p-[60px]">
      {/* Shadow lives on the wrapper — overflow-hidden on the card would clip it. */}
      <div className="rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.55)]">
      <div className="min-h-[calc(100dvh-2.5rem)] sm:min-h-[calc(100dvh-5rem)] lg:min-h-[calc(100dvh-120px)] bg-page flex flex-col rounded-[20px] overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden w-full px-4 py-3.5 flex items-center justify-between gap-3">
          <Link href="/manual" className="flex items-center gap-3 min-w-0">
            <FjorrMark className="w-[34px] shrink-0 text-page opacity-70" />
            <p className="font-futura text-[1.35rem] tracking-tighter text-page truncate select-none">
              {t('title')}
            </p>
          </Link>
          <div className="flex items-center gap-4 shrink-0">
            <Link
              href="/"
              aria-label={t('exitAria')}
              className="font-sans text-[12px] font-medium text-page-faint hover:text-page transition-colors"
            >
              {t('exit')}
            </Link>
            <button
              type="button"
              aria-label={open ? t('closeMenu') : t('openMenu')}
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpen((v) => !v)}
              className="font-sans text-[12px] font-medium text-page-faint hover:text-page transition-colors bg-transparent border-0 p-0 cursor-pointer"
            >
              {t('menu')}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          id={panelId}
          className={`md:hidden fixed inset-0 z-[100040] transition-[visibility] duration-300 ${
            open ? 'visible' : 'invisible pointer-events-none'
          }`}
        >
          <button
            type="button"
            aria-label={t('closeMenu')}
            onClick={close}
            className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
              open ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('navLabel')}
            className={`absolute inset-x-5 top-5 max-h-[min(88vh,40rem)] overflow-y-auto bg-page-elevated shadow-lg transition-transform duration-300 ease-out ${
              open ? 'translate-y-0' : '-translate-y-3 opacity-0'
            }`}
          >
            <div className="px-5 pt-5 pb-8 flex flex-col gap-8">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-3">
                  <p className="font-futura text-[1.75rem] tracking-tighter leading-[0.95] select-none">
                    {t('title')}
                  </p>
                  <p className="font-sans text-[14px] text-page-muted leading-snug">
                    Short films of the greatest stories — explained.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={t('closeMenu')}
                  onClick={close}
                  className="font-sans text-[12px] font-medium text-page-faint hover:text-page shrink-0 transition-colors bg-transparent border-0 p-0 cursor-pointer"
                >
                  {t('close')}
                </button>
              </div>
              {spine}
              <Link
                href="/"
                onClick={close}
                aria-label={t('exitAria')}
                className="font-sans text-[12px] font-medium text-page-faint hover:text-page transition-colors"
              >
                {t('exit')}
                <span className="text-page-faint/50">
                  {' · '}
                  {t('backToSite')}
                </span>
              </Link>
              <ColorSchemeToggle className="self-start" />
              <p className="m-0 font-sans text-[11px] leading-snug text-page-faint text-pretty pt-2">
                <span>{t('colophonMark')}</span>
                <span>
                  {' · '}
                  {t('footerUpdated', { date: MANUAL_UPDATED })}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Frame body: sidebar + square */}
        <div className="flex flex-1 min-h-0 flex-col md:flex-row">
          <aside className="hidden md:flex w-[14.5rem] shrink-0 px-5 py-8 flex-col gap-8 relative border-r border-[color-mix(in_srgb,var(--page-fg)_12%,transparent)]">
            <Link href="/manual" className="flex flex-col gap-4 group">
              <FjorrMark className="w-[44px] text-page opacity-70" />
              <div className="flex flex-col gap-3">
                <p className="font-futura text-[1.85rem] tracking-tighter leading-[0.95] text-page select-none group-hover:opacity-80 transition-opacity">
                  {t('title')}
                </p>
                <p className="font-sans text-[14px] text-page-muted leading-snug">
                  Short films of the greatest stories — explained.
                </p>
              </div>
            </Link>
            <div className="flex-1 min-h-0">{spine}</div>
            <div className="mt-auto pt-6 flex flex-col gap-4">
              <Link
                href="/"
                aria-label={t('exitAria')}
                className="font-sans text-[12px] font-medium text-page-faint hover:text-page transition-colors"
              >
                {t('exit')}
                <span className="text-page-faint/50">
                  {' · '}
                  {t('backToSite')}
                </span>
              </Link>
              <ColorSchemeToggle className="w-full justify-stretch [&>button]:flex-1" />
              <p className="m-0 font-sans text-[11px] leading-snug text-page-faint text-pretty">
                <span>{t('colophonMark')}</span>
                <span>
                  {' · '}
                  {t('footerUpdated', { date: MANUAL_UPDATED })}
                </span>
              </p>
            </div>
          </aside>

          <main
            className={`flex-1 min-w-0 min-h-0 overflow-y-auto px-5 sm:px-8 lg:pl-12 py-8 sm:py-10 lg:py-12 ${
              isIndex ? 'lg:pr-12' : 'lg:pr-0'
            }`}
          >
            {children}
          </main>
        </div>
      </div>
      </div>
    </div>
  );
}
