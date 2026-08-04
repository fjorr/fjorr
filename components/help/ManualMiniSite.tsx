'use client';

import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import FjorrMark from '@/components/help/FjorrMark';
import { ManualEntryArticle } from '@/components/help/ManualEntryArticle';
import {
  MANUAL_ENTRIES,
  getManualEntry,
  manualEntryHref,
  type ManualAudience,
} from '@/lib/help/content';

type Mode = 'page' | 'modal';

/** Cap body height to match card max (header is h-12 / 3rem). */
function getManualBodyMaxPx() {
  if (typeof window === 'undefined') return 36 * 16 - 48;
  const dvh = window.innerHeight;
  const isSm = window.matchMedia('(min-width: 640px)').matches;
  const cardMax = isSm
    ? Math.min(dvh * 0.76, 38 * 16)
    : Math.min(dvh * 0.72, 36 * 16);
  return cardMax - 48;
}

/**
 * Compact Manual “website” in one card —
 * sticky chrome (Fjorr Manual · Exit), in-card index, scrolling body.
 * No scrollbar — soft edge fades when there’s more to read.
 */
export default function ManualMiniSite({
  mode = 'page',
  slug,
  audience = 'guest',
  onExit,
  initialMenuOpen = false,
}: {
  mode?: Mode;
  /** Active entry slug. Omit / null shows the home blurb when the menu is closed. */
  slug?: string | null;
  audience?: ManualAudience;
  /** Modal close — page mode defaults to navigating home. */
  onExit?: () => void;
  initialMenuOpen?: boolean;
}) {
  const t = useTranslations('Help');
  const router = useRouter();
  const menuId = useId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(initialMenuOpen);
  /** Display slug — updated immediately on nav so the old entry never flashes. */
  const [activeSlug, setActiveSlug] = useState(slug ?? null);
  const [fadeTop, setFadeTop] = useState(false);
  const [fadeBottom, setFadeBottom] = useState(false);
  const [bodyHeight, setBodyHeight] = useState<number | null>(null);
  const [heightReady, setHeightReady] = useState(false);
  const [plateOpen, setPlateOpen] = useState(false);

  const updateFades = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const overflow = scrollHeight > clientHeight + 2;
    setFadeTop(overflow && scrollTop > 4);
    setFadeBottom(overflow && scrollTop + clientHeight < scrollHeight - 4);
  }, []);

  const syncBodyHeight = useCallback(() => {
    const content = contentRef.current;
    if (!content) return;
    const next = Math.min(content.scrollHeight, getManualBodyMaxPx());
    setBodyHeight(next);
  }, []);

  // Sync from URL / parent when it catches up (or external nav).
  useEffect(() => {
    setActiveSlug(slug ?? null);
  }, [slug]);

  useEffect(() => {
    setPlateOpen(false);
  }, [activeSlug, menuOpen]);

  useEffect(() => {
    if (!plateOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPlateOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [plateOpen]);

  const entry = activeSlug ? getManualEntry(activeSlug) : null;

  useLayoutEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    syncBodyHeight();
    // Enable height easing only after the first measure (avoids grow-from-zero).
    const id = requestAnimationFrame(() => setHeightReady(true));
    return () => cancelAnimationFrame(id);
  }, [menuOpen, activeSlug, syncBodyHeight]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const ro = new ResizeObserver(() => {
      syncBodyHeight();
      updateFades();
    });
    ro.observe(content);
    const onResize = () => syncBodyHeight();
    window.addEventListener('resize', onResize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, [menuOpen, activeSlug, syncBodyHeight, updateFades]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateFades();
    el.addEventListener('scroll', updateFades, { passive: true });
    return () => {
      el.removeEventListener('scroll', updateFades);
    };
  }, [updateFades, menuOpen, activeSlug, bodyHeight]);

  const labels = {
    labelWhat: t('labelWhat'),
    labelHappens: t('labelHappens'),
    actionRequired: t('actionRequired'),
    actionNone: t('actionNone'),
    referenceLabel: t('referenceLabel'),
    referenceAria: t('referenceAria'),
  };

  const handleExit = () => {
    if (onExit) {
      onExit();
      return;
    }
    router.push('/');
  };

  const goToEntry = (nextSlug: string) => {
    setActiveSlug(nextSlug);
    setMenuOpen(false);
    if (mode === 'page') {
      router.push(manualEntryHref(nextSlug));
    }
  };

  return (
    <div className="relative w-full max-w-[28rem] max-h-[min(72dvh,36rem)] sm:max-h-[min(76dvh,38rem)] flex flex-col rounded-[16px] bg-page-elevated overflow-hidden text-page">
      {/* Card chrome */}
      <header className="shrink-0 flex items-center justify-between gap-3 px-10 h-12 border-b border-[color-mix(in_srgb,var(--page-fg)_8%,transparent)] bg-page-elevated">
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          aria-label={t('indexBrandAria')}
          onClick={() => setMenuOpen((v) => !v)}
          className="group inline-flex items-center gap-2 min-w-0 bg-transparent border-0 p-0 cursor-pointer transition-opacity hover:opacity-85"
        >
          {/* Mark sits a hair low — SVG viewBox includes the j descender */}
          <FjorrMark className="h-[20px] sm:h-[21px] w-auto shrink-0 translate-y-[2px] text-page" />
          <span className="font-sans text-[13.5px] font-semibold leading-none tracking-tight text-page-muted group-hover:text-page transition-colors">
            {t('indexBrand')}
          </span>
        </button>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            className="font-sans text-[12px] font-medium text-page-faint hover:text-page transition-colors bg-transparent border-0 p-0 cursor-pointer"
          >
            {t('menu')}
          </button>
          <button
            type="button"
            onClick={handleExit}
            aria-label={t('exitAria')}
            className="font-sans text-[12px] font-medium text-page-faint hover:text-page transition-colors bg-transparent border-0 p-0 cursor-pointer"
          >
            {t('exit')}
          </button>
        </div>
      </header>

      {/* Body — hugs content; height eases between entries. No scrollbar — edge fades. */}
      <div
        className={`relative min-h-0 overflow-hidden${heightReady ? ' manual-body-height' : ''}`}
        style={bodyHeight != null ? { height: bodyHeight } : undefined}
      >
        <div
          ref={scrollRef}
          className="manual-scroll h-full overflow-y-auto overscroll-contain"
        >
          <div ref={contentRef}>
            {menuOpen ? (
              <nav
                id={menuId}
                aria-label={t('navLabel')}
                className="px-10 pt-3 pb-10 flex flex-col gap-0"
              >
                {MANUAL_ENTRIES.map((item) => {
                  const active = activeSlug === item.slug;
                  return (
                    <button
                      key={item.slug}
                      type="button"
                      onClick={() => goToEntry(item.slug)}
                      aria-current={active ? 'page' : undefined}
                      className={`w-full text-left px-0 py-1 bg-transparent border-0 cursor-pointer font-sans text-[14px] font-semibold tracking-tight transition-colors ${
                        active ? 'text-page' : 'text-page-muted hover:text-page'
                      }`}
                    >
                      {item.title}
                    </button>
                  );
                })}
                {mode === 'page' ? (
                  <Link
                    href="/manual"
                    onClick={() => {
                      setActiveSlug(null);
                      setMenuOpen(false);
                    }}
                    className="mt-2.5 pt-2.5 border-t border-[color-mix(in_srgb,var(--page-fg)_8%,transparent)] font-sans text-[12px] font-medium text-page-faint hover:text-page transition-colors"
                  >
                    {t('homeLink')}
                  </Link>
                ) : null}
              </nav>
            ) : entry ? (
              <ManualEntryArticle
                entry={entry}
                audience={audience}
                labels={labels}
                bare
                onOpenPlate={
                  entry.plate ? () => setPlateOpen(true) : undefined
                }
              />
            ) : (
              <div className="px-10 pt-7 sm:pt-8 pb-10 flex flex-col gap-5">
                <h1 className="m-0 font-interTight font-bold tracking-tight text-[clamp(1.75rem,4.5vw,2.25rem)] text-page leading-[1.08] text-balance">
                  {t('homeHeadline')}
                </h1>
                <p className="m-0 font-sans text-[15px] text-page-muted leading-relaxed whitespace-pre-line">
                  {t('homeLead')}
                </p>
                {MANUAL_ENTRIES[0] ? (
                  <button
                    type="button"
                    onClick={() => goToEntry(MANUAL_ENTRIES[0].slug)}
                    className="self-start inline-flex h-9 items-center px-3.5 rounded-[8px] bg-[var(--page-fg)] text-[var(--page-bg)] font-sans text-[13px] font-semibold tracking-tight hover:opacity-90 transition-opacity border-0 cursor-pointer"
                  >
                    {t('beginCta', {
                      number: MANUAL_ENTRIES[0].number,
                      title: MANUAL_ENTRIES[0].title,
                    })}
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 top-0 h-7 bg-gradient-to-b from-[var(--page-elevated)] to-transparent transition-opacity duration-200 ${
            fadeTop ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[var(--page-elevated)] to-transparent transition-opacity duration-200 ${
            fadeBottom ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>

      {/* Full-bleed figure — covers chrome; green placeholder until real art */}
      {plateOpen && entry?.plate ? (
        <div
          className="absolute inset-0 z-30 bg-[#1B7A3D]"
          role="dialog"
          aria-modal="true"
          aria-label={t('referenceLabel')}
        >
          <button
            type="button"
            onClick={() => setPlateOpen(false)}
            aria-label={t('closePlateAria')}
            className="absolute top-3 right-3 sm:top-3.5 sm:right-3.5 inline-flex items-center justify-center size-9 rounded-full bg-black/20 text-white hover:bg-black/30 transition-colors border-0 cursor-pointer"
          >
            <X size={18} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  );
}
