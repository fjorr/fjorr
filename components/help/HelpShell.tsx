'use client';

import React, { useEffect, useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import FjorrMark from '@/components/help/FjorrMark';
import {
  HELP_CATEGORIES,
  getHelpArticle,
  helpArticleHref,
} from '@/lib/help/content';

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The Manual chrome — logo + title in the left sidebar (Control/Account pattern).
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

  const linkClass = (active: boolean) =>
    `flex rounded-[8px] px-2.5 py-1.5 transition-colors ${
      active
        ? 'bg-page-chip text-page'
        : 'text-page-muted hover:bg-page-chip hover:text-page'
    }`;

  const brand = (
    <Link
      href="/manual"
      onClick={close}
      className="flex flex-col gap-3 px-2 group"
    >
      <FjorrMark className="w-[46px] text-page" />
      <div className="flex flex-col gap-0.5">
        <p className="font-sans text-[15px] font-semibold tracking-tight text-page group-hover:opacity-80 transition-opacity">
          {t('title')}
        </p>
        <p className="font-sans text-[12px] text-page-faint leading-snug">
          {t('tagline')}
        </p>
      </div>
    </Link>
  );

  const navList = (
    <nav aria-label={t('navLabel')} className="flex flex-col gap-5 flex-1 min-h-0">
      <div className="flex flex-col gap-1">
        <ul className="flex flex-col gap-0.5 list-none m-0 p-0">
          <li>
            <Link
              href="/manual"
              onClick={close}
              aria-current={pathname === '/manual' ? 'page' : undefined}
              className={linkClass(pathname === '/manual')}
            >
              <span className="font-sans text-[14px] font-semibold tracking-tight">
                {t('home')}
              </span>
            </Link>
          </li>
        </ul>
      </div>

      {HELP_CATEGORIES.map((group) => (
        <div key={group.id} className="flex flex-col gap-1">
          <p className="px-2.5 font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-page-faint">
            {group.label}
          </p>
          <ul className="flex flex-col gap-0.5 list-none m-0 p-0">
            {group.articleSlugs.map((slug) => {
              const article = getHelpArticle(slug);
              if (!article) return null;
              const href = helpArticleHref(slug);
              const active = isActive(pathname, href);
              return (
                <li key={slug}>
                  <Link
                    href={href}
                    onClick={close}
                    aria-current={active ? 'page' : undefined}
                    className={linkClass(active)}
                  >
                    <span className="font-sans text-[14px] font-semibold tracking-tight">
                      {article.title}
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
      <div className="md:hidden w-full border-b border-page-faint px-4 py-3 flex items-center justify-between gap-3">
        <Link href="/manual" className="flex items-center gap-3 min-w-0">
          <FjorrMark className="w-[36px] shrink-0 text-page" />
          <p className="font-sans text-[14px] font-semibold tracking-tight text-page truncate">
            {t('title')}
          </p>
        </Link>
        <button
          type="button"
          aria-label={open ? t('closeMenu') : t('openMenu')}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 inline-flex items-center h-9 px-3 rounded-[8px] bg-page-chip hover:bg-page-chip-hover transition-colors font-sans text-[13px] font-semibold text-page"
        >
          {t('menu')}
        </button>
      </div>

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
          className={`absolute inset-x-0 top-0 max-h-[min(92vh,40rem)] overflow-y-auto border-b border-page-faint bg-page transition-transform duration-300 ease-out ${
            open ? 'translate-y-0' : '-translate-y-3 opacity-0'
          }`}
        >
          <div className="px-4 pt-4 pb-8 flex flex-col gap-6">
            <div className="flex items-start justify-between gap-3">
              {brand}
              <button
                type="button"
                aria-label={t('closeMenu')}
                onClick={close}
                className="h-9 px-3 rounded-[8px] bg-page-chip font-sans text-[13px] font-semibold text-page shrink-0"
              >
                {t('close')}
              </button>
            </div>
            {navList}
            <Link
              href="/"
              onClick={close}
              className="self-start font-sans text-[13px] font-semibold text-page-faint hover:text-page-muted transition-colors"
            >
              {t('backToSite')}
            </Link>
          </div>
        </div>
      </div>

      <aside className="hidden md:flex w-[16.5rem] shrink-0 border-r border-page-faint px-4 py-8 md:min-h-screen flex-col gap-7">
        {brand}
        {navList}
        <Link
          href="/"
          className="mt-auto self-start mx-2 font-sans text-[13px] font-semibold text-page-faint hover:text-page-muted transition-colors"
        >
          {t('backToSite')}
        </Link>
      </aside>

      <main className="flex-1 min-w-0 px-5 sm:px-8 md:px-10 py-8 md:py-10">
        <div className="w-full max-w-2xl">{children}</div>
      </main>
    </div>
  );
}
