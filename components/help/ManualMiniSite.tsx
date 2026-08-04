'use client';

import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import FjorrMark from '@/components/help/FjorrMark';
import { ManualEntryArticle } from '@/components/help/ManualEntryArticle';
import ManualScrollKnob from '@/components/help/ManualScrollKnob';
import {
  MANUAL_ENTRIES,
  MANUAL_UPDATED,
  MANUAL_VERSION,
  getManualEntry,
  getManualPlates,
  manualEntryHref,
  type ManualAudience,
} from '@/lib/help/content';

type Mode = 'page' | 'modal';

/** Cap body height to match card max (header is h-14 / 3.5rem). */
const MANUAL_HEADER_PX = 56;
/** Mobile inset so the page bag shows as a border (p-3 × 2). */
const MANUAL_MOBILE_INSET_PX = 24;

function isManualDesktop() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(min-width: 640px)').matches
  );
}

function getManualBodyMaxPx() {
  if (typeof window === 'undefined') return 36 * 16 - MANUAL_HEADER_PX;
  const dvh = window.innerHeight;
  if (!isManualDesktop()) {
    return Math.max(200, dvh - MANUAL_MOBILE_INSET_PX - MANUAL_HEADER_PX);
  }
  const cardMax = Math.min(dvh * 0.76, 38 * 16);
  return cardMax - MANUAL_HEADER_PX;
}

/**
 * Compact Manual “website” in one card —
 * sticky chrome (Fjorr Manual · Exit), in-card index, scrolling body.
 * Overflow: edge fades + red drag knob on the right edge.
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
  const [plateIndex, setPlateIndex] = useState(0);

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
    const max = getManualBodyMaxPx();
    // Mobile: fill the tall card. Desktop: hug content up to the cap.
    const next = isManualDesktop()
      ? Math.min(content.scrollHeight, max)
      : max;
    setBodyHeight(next);
  }, []);

  // Sync from URL / parent when it catches up (or external nav).
  useEffect(() => {
    setActiveSlug(slug ?? null);
  }, [slug]);

  useEffect(() => {
    setPlateOpen(false);
    setPlateIndex(0);
  }, [activeSlug, menuOpen]);

  const entry = activeSlug ? getManualEntry(activeSlug) : null;
  const plates = entry ? getManualPlates(entry) : [];
  const activePlate = plates[plateIndex] ?? null;

  const openPlate = useCallback((index: number) => {
    setPlateIndex(index);
    setPlateOpen(true);
  }, []);

  const stepPlate = useCallback(
    (delta: number) => {
      if (plates.length < 2) return;
      setPlateIndex((i) => (i + delta + plates.length) % plates.length);
    },
    [plates.length]
  );

  useEffect(() => {
    if (!plateOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setPlateOpen(false);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        stepPlate(1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        stepPlate(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [plateOpen, stepPlate]);

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
    referenceLabel: t('referenceLabel'),
    referenceAria: t('referenceAria'),
    referenceAriaNamed: t('referenceAriaNamed'),
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

  const goHome = () => {
    setActiveSlug(null);
    setMenuOpen(false);
    if (mode === 'page') {
      router.push('/manual');
    }
  };

  return (
    <div className="relative w-full max-w-[28rem] h-[calc(100dvh-1.5rem)] max-h-[calc(100dvh-1.5rem)] sm:h-auto sm:max-h-[min(76dvh,38rem)] flex flex-col rounded-[16px] bg-page-elevated text-page overflow-visible">
      {/* Card chrome */}
      <header className="shrink-0 flex items-center justify-between gap-3 px-10 sm:px-11 h-14 border-b border-[color-mix(in_srgb,var(--page-fg)_8%,transparent)] bg-page-elevated rounded-t-[16px]">
        <button
          type="button"
          aria-label={t('indexBrandAria')}
          onClick={goHome}
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
            onClick={() => setMenuOpen((v) => !v)}
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

      {/* Body — hugs content; height eases between entries. Fades + red edge knob. */}
      <div
        className={`relative min-h-0 overflow-hidden rounded-b-[16px]${heightReady ? ' manual-body-height' : ''}`}
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
                      className={`w-full text-left px-0 py-0.5 bg-transparent border-0 cursor-pointer font-sans text-[14px] font-semibold tracking-tight transition-colors ${
                        active ? 'text-page' : 'text-page-muted hover:text-page'
                      }`}
                    >
                      {item.title}
                    </button>
                  );
                })}
                <p className="m-0 mt-2.5 pt-2.5 border-t border-[color-mix(in_srgb,var(--page-fg)_8%,transparent)] font-sans text-[12px] font-medium text-page-faint tabular-nums tracking-tight">
                  <span>{MANUAL_VERSION}</span>
                  <span aria-hidden className="mx-1.5">
                    ·
                  </span>
                  <span>{t('footerUpdated', { date: MANUAL_UPDATED })}</span>
                </p>
              </nav>
            ) : entry ? (
              <ManualEntryArticle
                entry={entry}
                audience={audience}
                labels={labels}
                bare
                onOpenPlate={plates.length > 0 ? openPlate : undefined}
              />
            ) : (
              <div className="px-10 pt-7 sm:pt-8 pb-10 flex flex-col gap-5">
                <h1 className="m-0 font-interTight font-extrabold tracking-tight text-[clamp(1.75rem,4.5vw,2.25rem)] text-page leading-[1.08] text-balance">
                  {t('homeHeadline')}
                </h1>
                <p className="m-0 font-sans text-[16px] text-page-muted leading-relaxed whitespace-pre-line">
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

      {/* Sibling of body so overflow doesn’t clip the edge knob — hide while plate is open */}
      {!plateOpen ? (
        <div className="absolute top-14 bottom-0 right-0 z-20 overflow-visible">
          <ManualScrollKnob scrollRef={scrollRef} label={t('scrollKnobAria')} />
        </div>
      ) : null}

      {/* Full-bleed plate — covers chrome; next/prev when multiple */}
      {plateOpen && activePlate ? (
        <div
          className="absolute inset-0 z-30 overflow-hidden rounded-[16px] bg-[#0B0B0C]"
          role="dialog"
          aria-modal="true"
          aria-label={
            activePlate.label
              ? t('referenceAriaNamed', { label: activePlate.label })
              : t('referenceAria')
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activePlate.src}
            alt={activePlate.label || ''}
            className="absolute inset-0 h-full w-full object-contain"
          />
          <button
            type="button"
            onClick={() => setPlateOpen(false)}
            aria-label={t('closePlateAria')}
            className="absolute top-3 right-3 sm:top-3.5 sm:right-3.5 z-10 inline-flex items-center justify-center size-9 rounded-full bg-black/35 text-white hover:bg-black/50 transition-colors border-0 cursor-pointer"
          >
            <X size={18} strokeWidth={1.75} aria-hidden />
          </button>
          {plates.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => stepPlate(-1)}
                aria-label={t('platePrevAria')}
                className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-10 inline-flex items-center justify-center size-9 rounded-full bg-black/35 text-white hover:bg-black/50 transition-colors border-0 cursor-pointer"
              >
                <ChevronLeft size={20} strokeWidth={1.75} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => stepPlate(1)}
                aria-label={t('plateNextAria')}
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-10 inline-flex items-center justify-center size-9 rounded-full bg-black/35 text-white hover:bg-black/50 transition-colors border-0 cursor-pointer"
              >
                <ChevronRight size={20} strokeWidth={1.75} aria-hidden />
              </button>
              <p className="absolute bottom-3 inset-x-0 text-center m-0 font-sans text-[12px] font-medium text-white/70 tabular-nums pointer-events-none">
                {t('plateCount', {
                  current: plateIndex + 1,
                  total: plates.length,
                })}
              </p>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
