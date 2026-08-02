'use client';

import React, { useEffect, useId, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import ColorSchemeToggle from '@/components/ColorSchemeToggle';
import FjorrMark from '@/components/help/FjorrMark';
import {
  MANUAL_ENTRIES,
  MANUAL_UPDATED,
  getManualEntryNeighbors,
  manualEntryHref,
} from '@/lib/help/content';

/**
 * The Manual chrome — Unimark frame (~60px inset), spine, four-column footer.
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

  const footerPage = activeEntry
    ? `Page ${activeEntry.number}`
    : 'Page —';
  const neighbors = activeEntry
    ? getManualEntryNeighbors(activeEntry.slug)
    : null;
  const prevHref = neighbors?.prev
    ? manualEntryHref(neighbors.prev.slug)
    : null;
  const nextHref = neighbors?.next
    ? manualEntryHref(neighbors.next.slug)
    : null;

  return (
    <div className="w-full min-h-screen bg-page text-page p-5 sm:p-10 lg:p-[60px]">
      <div className="min-h-[calc(100dvh-2.5rem)] sm:min-h-[calc(100dvh-5rem)] lg:min-h-[calc(100dvh-120px)] border border-[color-mix(in_srgb,var(--page-fg)_45%,transparent)] flex flex-col">
        {/* Mobile top bar */}
        <div className="md:hidden w-full border-b border-[color-mix(in_srgb,var(--page-fg)_45%,transparent)] px-4 py-3.5 flex items-center justify-between gap-3">
          <Link href="/manual" className="flex items-center gap-3 min-w-0">
            <FjorrMark className="w-[34px] shrink-0 text-page opacity-70" />
            <p className="font-futura text-[1.35rem] tracking-tighter text-page truncate select-none">
              {t('title')}
            </p>
          </Link>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/"
              aria-label={t('exitAria')}
              className="inline-flex items-center h-9 px-3 font-sans text-[13px] font-semibold text-page-faint hover:text-page border border-[color-mix(in_srgb,var(--page-fg)_45%,transparent)] transition-colors"
            >
              {t('exit')}
            </Link>
            <button
              type="button"
              aria-label={open ? t('closeMenu') : t('openMenu')}
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center h-9 px-3 font-sans text-[13px] font-semibold text-page border border-[color-mix(in_srgb,var(--page-fg)_45%,transparent)]"
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
            className={`absolute inset-x-5 top-5 max-h-[min(88vh,40rem)] overflow-y-auto border border-[color-mix(in_srgb,var(--page-fg)_45%,transparent)] bg-page transition-transform duration-300 ease-out ${
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
                  className="h-9 px-3 border border-[color-mix(in_srgb,var(--page-fg)_45%,transparent)] font-sans text-[13px] font-semibold text-page shrink-0"
                >
                  {t('close')}
                </button>
              </div>
              <div
                className="h-px w-full bg-[color-mix(in_srgb,var(--page-fg)_45%,transparent)]"
                aria-hidden
              />
              {spine}
              <Link
                href="/"
                onClick={close}
                aria-label={t('exitAria')}
                className="font-sans text-[13px] font-semibold text-page-faint hover:text-page transition-colors"
              >
                {t('exit')}
                <span className="text-page-faint/50 font-medium">
                  {' · '}
                  {t('backToSite')}
                </span>
              </Link>
              <ColorSchemeToggle className="self-start" />
            </div>
          </div>
        </div>

        {/* Frame body: sidebar + square */}
        <div className="flex flex-1 min-h-0 flex-col md:flex-row">
          <aside
            className="hidden md:flex w-[14.5rem] shrink-0 border-r border-[color-mix(in_srgb,var(--page-fg)_45%,transparent)] px-5 py-8 flex-col gap-8 relative overflow-hidden"
            style={{
              backgroundImage: `radial-gradient(
                color-mix(in srgb, var(--page-fg) 14%, transparent) 0.7px,
                transparent 0.7px
              )`,
              backgroundSize: '7px 7px',
            }}
          >
            <Link href="/manual" className="flex flex-col gap-4 group relative">
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
            <div
              className="h-px w-full bg-[color-mix(in_srgb,var(--page-fg)_45%,transparent)] relative"
              aria-hidden
            />
            <div className="relative flex-1 min-h-0">{spine}</div>
            <div className="relative mt-auto pt-4 flex flex-col gap-3">
              <Link
                href="/"
                aria-label={t('exitAria')}
                className="font-sans text-[13px] font-semibold text-page-faint hover:text-page transition-colors"
              >
                {t('exit')}
                <span className="text-page-faint/50 font-medium">
                  {' · '}
                  {t('backToSite')}
                </span>
              </Link>
              <ColorSchemeToggle className="w-full justify-stretch [&>button]:flex-1" />
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

        {/* Two-column footer — version / updated · page */}
        <footer className="border-t border-[color-mix(in_srgb,var(--page-fg)_45%,transparent)] shrink-0">
          <div className="flex items-start justify-between gap-6 px-5 sm:px-6 py-3.5 font-sans text-[11px] sm:text-[12px] leading-snug text-page">
            <div className="min-w-0 truncate flex items-center gap-2.5">
              <Link
                href="/"
                aria-label={t('exitAria')}
                className="shrink-0 font-semibold text-page-faint hover:text-page transition-colors"
              >
                {t('exit')}
              </Link>
              <span className="text-page-faint/40" aria-hidden>
                ·
              </span>
              <span className="min-w-0 truncate">
                <span>{t('colophonMark')}</span>
                <span className="text-page-faint">
                  {' · '}
                  {t('footerUpdated', { date: MANUAL_UPDATED })}
                </span>
              </span>
            </div>
            <div className="shrink-0 flex items-center gap-2.5">
              {activeEntry ? (
                <div className="flex items-center gap-1">
                  {prevHref ? (
                    <Link
                      href={prevHref}
                      aria-label={t('pagerPrev')}
                      className="inline-flex h-6 w-6 items-center justify-center text-page-faint hover:text-page transition-colors"
                    >
                      <ArrowLeft size={13} strokeWidth={1.75} aria-hidden />
                    </Link>
                  ) : (
                    <span className="inline-flex h-6 w-6 items-center justify-center text-page-faint/35" aria-hidden>
                      <ArrowLeft size={13} strokeWidth={1.75} />
                    </span>
                  )}
                  {nextHref ? (
                    <Link
                      href={nextHref}
                      aria-label={t('pagerNext')}
                      className="inline-flex h-6 w-6 items-center justify-center text-page-faint hover:text-page transition-colors"
                    >
                      <ArrowRight size={13} strokeWidth={1.75} aria-hidden />
                    </Link>
                  ) : (
                    <span className="inline-flex h-6 w-6 items-center justify-center text-page-faint/35" aria-hidden>
                      <ArrowRight size={13} strokeWidth={1.75} />
                    </span>
                  )}
                </div>
              ) : null}
              <span className="font-mono tabular-nums tracking-[0.06em]">
                {footerPage}
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
