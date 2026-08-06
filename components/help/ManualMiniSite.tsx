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
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import {
  localeLabels,
  locales,
  stripLocalePrefix,
  type AppLocale,
} from '@/i18n/config';
import FjorrMark from '@/components/help/FjorrMark';
import { ManualCardProvider } from '@/components/help/ManualCardContext';
import {
  ManualEntryArticle,
  type ManualEntryLabels,
} from '@/components/help/ManualEntryArticle';
import ManualScrollKnob from '@/components/help/ManualScrollKnob';
import { Icon } from '@/components/ui/Icons';
import {
  MANUAL_MENU_GROUPS,
  MANUAL_UPDATED,
  MANUAL_VERSION,
  getManualEntry,
  getManualMenuNeighbors,
  getManualPlates,
  manualEntryHref,
  type ManualAudience,
} from '@/lib/help/content';

type Mode = 'page' | 'modal';
type Panel = 'closed' | 'menu' | 'lang';

const DOC_INTRO_KEY = 'fjorr-manual-doc-intro';

function initialDocIntro(
  mode: Mode,
  slug: string | null | undefined
): 'pending' | 'play' | 'skip' {
  if (mode !== 'page' || slug != null) return 'skip';
  if (typeof window === 'undefined') return 'pending';
  try {
    if (sessionStorage.getItem(DOC_INTRO_KEY)) return 'skip';
  } catch {
    /* ignore */
  }
  return 'pending';
}

/**
 * Compact Manual “website” in one card —
 * sticky chrome (Fjorr Manual · Menu · Language · Exit), in-card index.
 * Article body can be server-passed as `children` for the active slug.
 * Overflow: edge fades + chrome divider scrub.
 */
export default function ManualMiniSite({
  mode = 'page',
  slug,
  audience = 'guest',
  bureauxNumber = null,
  onExit,
  onPlateOpenChange,
  initialMenuOpen = false,
  children,
  labels: labelsProp,
}: {
  mode?: Mode;
  /** Active entry slug. Omit / null shows the home blurb when the menu is closed. */
  slug?: string | null;
  audience?: ManualAudience;
  bureauxNumber?: number | null;
  /** Modal close — page mode defaults to navigating home. */
  onExit?: () => void;
  /** Let a parent modal defer Escape while a plate is open. */
  onPlateOpenChange?: (open: boolean) => void;
  initialMenuOpen?: boolean;
  /**
   * Server-rendered (or parent-provided) article for the initial `slug`.
   * Used while still on that entry so the shell doesn’t remount the body.
   */
  children?: React.ReactNode;
  /** Optional labels from the server; falls back to client translations. */
  labels?: ManualEntryLabels;
}) {
  const t = useTranslations('Help');
  const tNav = useTranslations('Nav');
  const locale = useLocale() as AppLocale;
  const pathname = usePathname() || '';
  const router = useRouter();
  const menuId = useId();
  const langId = useId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [panel, setPanel] = useState<Panel>(
    initialMenuOpen ? 'menu' : 'closed'
  );
  const menuOpen = panel === 'menu';
  const langOpen = panel === 'lang';
  /** Display slug — updated immediately on nav so the old entry never flashes. */
  const [activeSlug, setActiveSlug] = useState(slug ?? null);
  const [fadeTop, setFadeTop] = useState(false);
  const [fadeBottom, setFadeBottom] = useState(false);
  const [plateOpen, setPlateOpen] = useState(false);
  const [plateIndex, setPlateIndex] = useState(0);
  /**
   * /manual home — technical-document settle once per session.
   * pending → hide one frame; play → animate; skip → show immediately.
   */
  const [docIntro, setDocIntro] = useState<'pending' | 'play' | 'skip'>(() =>
    initialDocIntro(mode, slug)
  );

  useLayoutEffect(() => {
    if (mode !== 'page' || slug != null) {
      setDocIntro('skip');
      return;
    }
    try {
      if (sessionStorage.getItem(DOC_INTRO_KEY)) {
        setDocIntro('skip');
        return;
      }
      sessionStorage.setItem(DOC_INTRO_KEY, '1');
    } catch {
      /* ignore */
    }
    setDocIntro('play');
  }, [mode, slug]);

  const updateFades = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const overflow = scrollHeight > clientHeight + 2;
    setFadeTop(overflow && scrollTop > 4);
    setFadeBottom(overflow && scrollTop + clientHeight < scrollHeight - 4);
  }, []);

  // Sync from URL / parent when it catches up (or external nav).
  useEffect(() => {
    setActiveSlug(slug ?? null);
  }, [slug]);

  useEffect(() => {
    setPlateOpen(false);
    setPlateIndex(0);
  }, [activeSlug, panel]);

  useEffect(() => {
    onPlateOpenChange?.(plateOpen);
  }, [plateOpen, onPlateOpenChange]);

  const entry = activeSlug ? getManualEntry(activeSlug) : null;
  const plates = entry ? getManualPlates(entry) : [];
  const activePlate = plates[plateIndex] ?? null;
  /** Prefer server/parent children while still on the routed entry. */
  const useChildren =
    Boolean(children) &&
    activeSlug != null &&
    activeSlug === (slug ?? null) &&
    !menuOpen &&
    !langOpen;

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
        e.stopImmediatePropagation();
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
    updateFades();
  }, [panel, activeSlug, updateFades]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateFades();
    el.addEventListener('scroll', updateFades, { passive: true });
    const onResize = () => updateFades();
    window.addEventListener('resize', onResize);
    return () => {
      el.removeEventListener('scroll', updateFades);
      window.removeEventListener('resize', onResize);
    };
  }, [updateFades, panel, activeSlug]);

  const labels: ManualEntryLabels = labelsProp ?? {
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

  const goToEntry = useCallback(
    (nextSlug: string) => {
      setActiveSlug(nextSlug);
      setPanel('closed');
      if (mode === 'page') {
        router.push(manualEntryHref(nextSlug));
      }
    },
    [mode, router]
  );

  const neighbors = activeSlug ? getManualMenuNeighbors(activeSlug) : null;
  const showEntryPager =
    Boolean(activeSlug) && !menuOpen && !langOpen && !plateOpen;

  useEffect(() => {
    if (!showEntryPager || !neighbors) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === 'ArrowLeft' && neighbors.prev) {
        e.preventDefault();
        goToEntry(neighbors.prev.slug);
      } else if (e.key === 'ArrowRight' && neighbors.next) {
        e.preventDefault();
        goToEntry(neighbors.next.slug);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showEntryPager, neighbors, goToEntry]);

  const goHome = () => {
    setActiveSlug(null);
    setPanel('closed');
    if (mode === 'page') {
      router.push('/manual');
    }
  };

  const setLocale = (next: AppLocale) => {
    if (next === locale) {
      setPanel('closed');
      return;
    }
    setPanel('closed');
    const raw =
      typeof window !== 'undefined' ? window.location.pathname : pathname;
    const href = stripLocalePrefix(raw || '/manual') || '/manual';
    router.replace(href, { locale: next });
  };

  const cardCtx = {
    onNavigateEntry: goToEntry,
    onOpenPlate: plates.length > 0 ? openPlate : undefined,
    pager: showEntryPager ? neighbors ?? undefined : undefined,
  };

  return (
    <div
      className={`relative w-full max-w-[28rem] h-full min-h-0 max-h-full sm:h-auto sm:max-h-[min(76dvh,38rem)] flex flex-col rounded-[16px] bg-page-elevated text-page overflow-hidden${
        docIntro === 'play' ? ' manual-doc-in' : ''
      }`}
      style={docIntro === 'pending' ? { opacity: 0 } : undefined}
    >
      {/* Card chrome — divider becomes a horizontal scrub when body overflows */}
      <header className="manual-doc-chrome shrink-0 flex items-center justify-between gap-3 px-10 sm:px-11 h-14 bg-page-elevated rounded-t-[16px] relative">
        {!plateOpen ? (
          <ManualScrollKnob
            scrollRef={scrollRef}
            label={t('scrollKnobAria')}
          />
        ) : (
          <div
            aria-hidden
            className="manual-doc-rule absolute left-10 right-10 sm:left-11 sm:right-11 bottom-0 h-px bg-[color-mix(in_srgb,var(--page-fg)_12%,transparent)]"
          />
        )}
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
            onClick={() => setPanel((p) => (p === 'menu' ? 'closed' : 'menu'))}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            className="font-sans text-[14px] font-semibold text-page hover:opacity-75 transition-opacity bg-transparent border-0 p-0 cursor-pointer"
          >
            {menuOpen ? t('closeMenu') : t('menu')}
          </button>
          <button
            type="button"
            onClick={() => setPanel((p) => (p === 'lang' ? 'closed' : 'lang'))}
            aria-label={tNav('language')}
            aria-expanded={langOpen}
            aria-controls={langId}
            className="flex items-center gap-1.5 font-sans text-[13px] font-medium text-page-faint hover:text-page transition-colors bg-transparent border-0 p-0 cursor-pointer"
          >
            <Icon name="globe" className="w-[14px] h-[14px]" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.05em] leading-none">
              {locale}
            </span>
          </button>
          <button
            type="button"
            onClick={handleExit}
            aria-label={t('exitAria')}
            title={t('exit')}
            className="inline-flex items-center justify-center size-7 -mr-1 rounded-full text-page-faint hover:text-page hover:bg-[color-mix(in_srgb,var(--page-fg)_6%,transparent)] transition-colors bg-transparent border-0 p-0 cursor-pointer"
          >
            <X size={15} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </header>

      {/* Body — hug content up to card max-height, then scroll (no JS measure). */}
      <div className="manual-doc-body relative min-h-0 flex-auto overflow-hidden rounded-b-[16px]">
        <ManualCardProvider value={cardCtx}>
          <div
            ref={scrollRef}
            className="manual-scroll h-full max-h-full overflow-y-auto overscroll-contain"
          >
            {menuOpen ? (
              <nav
                id={menuId}
                aria-label={t('navLabel')}
                className="dot-grid min-h-full px-10 pt-3.5 pb-8 flex flex-col"
              >
                {MANUAL_MENU_GROUPS.map((group, groupIndex) => {
                  const items = group.slugs
                    .map((s) => getManualEntry(s))
                    .filter((e): e is NonNullable<typeof e> => e != null);
                  if (items.length === 0) return null;
                  const groupLabel =
                    group.id === 'understand'
                      ? t('menuGroupUnderstand')
                      : group.id === 'participate'
                        ? t('menuGroupParticipate')
                        : group.id === 'membership'
                          ? t('menuGroupMembership')
                          : t('menuGroupFinePrint');
                  return (
                    <div
                      key={group.id}
                      className={
                        groupIndex === 0
                          ? 'flex flex-col'
                          : 'flex flex-col mt-3.5'
                      }
                    >
                      <p className="m-0 mb-1 font-sans text-[12px] font-medium tracking-tight text-page-faint leading-none">
                        {groupLabel}
                      </p>
                      <div className="flex flex-col">
                        {items.map((item) => {
                          const active = activeSlug === item.slug;
                          return (
                            <button
                              key={item.slug}
                              type="button"
                              onClick={() => goToEntry(item.slug)}
                              aria-current={active ? 'page' : undefined}
                              className={`w-full min-w-0 text-left px-0 py-[3px] bg-transparent border-0 cursor-pointer font-sans text-[14px] font-semibold tracking-tight leading-snug transition-colors ${
                                active
                                  ? 'text-page'
                                  : 'text-page-muted hover:text-page'
                              }`}
                            >
                              {item.title}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                <p className="m-0 mt-3.5 font-sans text-[12px] font-medium text-page-faint tabular-nums tracking-tight">
                  <span>{MANUAL_VERSION}</span>
                  <span aria-hidden className="mx-1.5">
                    ·
                  </span>
                  <span>{t('footerUpdated', { date: MANUAL_UPDATED })}</span>
                </p>
              </nav>
            ) : langOpen ? (
              <nav
                id={langId}
                aria-label={tNav('languages')}
                className="px-10 pt-5 pb-10 flex flex-col gap-3"
              >
                <p className="m-0 font-sans text-[15px] font-semibold tracking-tight text-page">
                  {tNav('languagesHeadline')}
                </p>
                <div className="flex flex-col gap-1.5">
                  {locales.map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setLocale(code)}
                      className={`w-full text-left px-0 py-0.5 bg-transparent border-0 cursor-pointer font-sans text-[15px] font-semibold tracking-tight transition-colors ${
                        locale === code
                          ? 'text-page-faint cursor-default'
                          : 'text-page hover:opacity-70'
                      }`}
                    >
                      {localeLabels[code]}
                    </button>
                  ))}
                </div>
              </nav>
            ) : useChildren ? (
              children
            ) : entry ? (
              <ManualEntryArticle
                entry={entry}
                audience={audience}
                labels={labels}
                bare
              />
            ) : (
              <div className="px-10 pt-7 sm:pt-8 pb-10 flex flex-col gap-5">
                <h1 className="manual-doc-line manual-doc-line-1 m-0 font-interTight font-extrabold tracking-tight text-[clamp(2.25rem,6vw,3.25rem)] text-page leading-[1.05] text-balance">
                  {t('homeHeadline')}
                </h1>
                <p className="manual-doc-line manual-doc-line-2 m-0 font-sans text-[16px] text-page-muted leading-relaxed whitespace-pre-line">
                  {audience === 'member' && bureauxNumber != null
                    ? t('homeLeadMember', { number: bureauxNumber })
                    : t('homeLead')}
                </p>
                <button
                  type="button"
                  onClick={() => setPanel('menu')}
                  aria-expanded={menuOpen}
                  aria-controls={menuId}
                  className="manual-doc-line manual-doc-line-3 self-start inline-flex h-9 items-center px-3.5 rounded-[8px] bg-[var(--page-fg)] text-[var(--page-bg)] font-sans text-[13px] font-semibold tracking-tight hover:opacity-90 transition-opacity border-0 cursor-pointer"
                >
                  {t('menu')}
                </button>
              </div>
            )}
          </div>
        </ManualCardProvider>

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
