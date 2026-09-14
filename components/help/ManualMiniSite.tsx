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
import { ManualCardProvider } from '@/components/help/ManualCardContext';
import {
  ManualEntryArticle,
  type ManualEntryLabels,
} from '@/components/help/ManualEntryArticle';
import ManualScrollKnob from '@/components/help/ManualScrollKnob';
import {
  MANUAL_MENU_GROUPS,
  MANUAL_UPDATED,
  MANUAL_VERSION,
  getManualEntry,
  getManualMenuNeighbors,
  getManualPlates,
  manualEntryHref,
  type ManualAudience,
  type ManualEntry,
} from '@/lib/help/content';

type Mode = 'page' | 'modal' | 'stage';
type Panel = 'closed' | 'menu';

/** Soft gray surface for the house poster Manual (contrasts white chrome). */
const STAGE_SURFACE = '#F3F3F4';
const DOC_INTRO_KEY = 'fjorr-manual-doc-intro';

/** Shared horizontal inset — generous card breathing room. */
const PAD_X = 'px-11 sm:px-12 lg:px-14';

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

function groupLabel(id: string, t: (key: string) => string) {
  if (id === 'understand') return t('menuGroupUnderstand');
  if (id === 'participate') return t('menuGroupParticipate');
  if (id === 'membership') return t('menuGroupMembership');
  return t('menuGroupFinePrint');
}

function ManualIndexNav({
  id,
  activeSlug,
  onSelect,
  className = '',
}: {
  id?: string;
  activeSlug: string | null;
  onSelect: (slug: string) => void;
  className?: string;
}) {
  const t = useTranslations('Help');

  return (
    <nav id={id} aria-label={t('navLabel')} className={className}>
      {MANUAL_MENU_GROUPS.map((group, groupIndex) => {
        const items = group.slugs
          .map((s) => getManualEntry(s))
          .filter((e): e is ManualEntry => e != null);
        if (items.length === 0) return null;
        return (
          <div
            key={group.id}
            className={
              groupIndex === 0 ? 'flex flex-col' : 'mt-5 flex flex-col'
            }
          >
            <p className="m-0 mb-1.5 font-sans text-[12px] font-medium leading-none tracking-tight text-page-faint">
              {groupLabel(group.id, t)}
            </p>
            <div className="flex flex-col">
              {items.map((item) => {
                const active = activeSlug === item.slug;
                return (
                  <button
                    key={item.slug}
                    type="button"
                    onClick={() => onSelect(item.slug)}
                    aria-current={active ? 'page' : undefined}
                    className={`w-full min-w-0 cursor-pointer border-0 bg-transparent px-0 py-1 text-left font-sans text-[15px] font-semibold leading-snug tracking-tight transition-colors ${
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
      <p className="m-0 mt-6 font-sans text-[12px] font-medium tabular-nums tracking-tight text-page-faint">
        <span>{MANUAL_VERSION}</span>
        <span aria-hidden className="mx-1.5">
          ·
        </span>
        <span>{t('footerUpdated', { date: MANUAL_UPDATED })}</span>
      </p>
    </nav>
  );
}

/**
 * Compact Manual in one card — single column, Menu for index, generous padding.
 * Stage fills the house poster; page/modal float as an elevated card.
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
  slug?: string | null;
  audience?: ManualAudience;
  bureauxNumber?: number | null;
  onExit?: () => void;
  onPlateOpenChange?: (open: boolean) => void;
  initialMenuOpen?: boolean;
  children?: React.ReactNode;
  labels?: ManualEntryLabels;
}) {
  const t = useTranslations('Help');
  const router = useRouter();
  const menuId = useId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [panel, setPanel] = useState<Panel>(
    initialMenuOpen ? 'menu' : 'closed'
  );
  const menuOpen = panel === 'menu';
  const [activeSlug, setActiveSlug] = useState(slug ?? null);
  const [fadeTop, setFadeTop] = useState(false);
  const [fadeBottom, setFadeBottom] = useState(false);
  const [plateOpen, setPlateOpen] = useState(false);
  const [plateIndex, setPlateIndex] = useState(0);
  const [docIntro, setDocIntro] = useState<'pending' | 'play' | 'skip'>(() =>
    initialDocIntro(mode, slug)
  );

  const fillStage = mode === 'stage';

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
  const useChildren =
    Boolean(children) &&
    activeSlug != null &&
    activeSlug === (slug ?? null) &&
    !menuOpen;

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
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
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
  const showEntryPager = Boolean(activeSlug) && !plateOpen && !menuOpen;

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
      router.push('/about');
    }
  };

  const cardCtx = {
    onNavigateEntry: goToEntry,
    onOpenPlate: plates.length > 0 ? openPlate : undefined,
    pager: showEntryPager ? neighbors ?? undefined : undefined,
  };

  const fadeFrom = fillStage ? STAGE_SURFACE : 'var(--page-elevated)';

  const homeBlurb = (
    <div className={`flex flex-col gap-6 ${PAD_X} pb-12 pt-8 sm:gap-7 sm:pb-14 sm:pt-10`}>
      <h1 className="manual-doc-line manual-doc-line-1 m-0 max-w-[22rem] text-balance font-interTight text-[clamp(2.25rem,5.5vw,3rem)] font-extrabold leading-[1.05] tracking-tight text-page">
        {t('homeHeadline')}
      </h1>
      <p className="manual-doc-line manual-doc-line-2 m-0 max-w-[22rem] whitespace-pre-line font-sans text-[16px] leading-relaxed text-page-muted sm:text-[17px]">
        {audience === 'member' && bureauxNumber != null
          ? t('homeLeadMember', { number: bureauxNumber })
          : t('homeLead')}
      </p>
      <button
        type="button"
        onClick={() => setPanel('menu')}
        aria-expanded={menuOpen}
        aria-controls={menuId}
        className="manual-doc-line manual-doc-line-3 inline-flex h-9 cursor-pointer items-center self-start rounded-full border-0 bg-[var(--page-fg)] px-4 font-sans text-[13px] font-semibold tracking-tight text-[var(--page-bg)] transition-opacity hover:opacity-90"
      >
        {t('menu')}
      </button>
    </div>
  );

  const mainContent = menuOpen ? (
    <ManualIndexNav
      id={menuId}
      activeSlug={activeSlug}
      onSelect={goToEntry}
      className={`dot-grid flex min-h-full flex-col ${PAD_X} pb-12 pt-4 sm:pb-14 sm:pt-5`}
    />
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
    homeBlurb
  );

  const plateOverlay =
    plateOpen && activePlate ? (
      <div
        className={`absolute inset-0 z-30 overflow-hidden bg-[#0B0B0C] ${
          fillStage ? 'rounded-2xl' : 'rounded-[16px]'
        }`}
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
          className="absolute right-3 top-3 z-10 inline-flex size-9 cursor-pointer items-center justify-center rounded-full border-0 bg-black/35 text-white transition-colors hover:bg-black/50 sm:right-3.5 sm:top-3.5"
        >
          <X size={18} strokeWidth={1.75} aria-hidden />
        </button>
        {plates.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => stepPlate(-1)}
              aria-label={t('platePrevAria')}
              className="absolute left-2 top-1/2 z-10 inline-flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-0 bg-black/35 text-white transition-colors hover:bg-black/50 sm:left-3"
            >
              <ChevronLeft size={20} strokeWidth={1.75} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => stepPlate(1)}
              aria-label={t('plateNextAria')}
              className="absolute right-2 top-1/2 z-10 inline-flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-0 bg-black/35 text-white transition-colors hover:bg-black/50 sm:right-3"
            >
              <ChevronRight size={20} strokeWidth={1.75} aria-hidden />
            </button>
            <p className="pointer-events-none absolute inset-x-0 bottom-3 m-0 text-center font-sans text-[12px] font-medium tabular-nums text-white/70">
              {t('plateCount', {
                current: plateIndex + 1,
                total: plates.length,
              })}
            </p>
          </>
        ) : null}
      </div>
    ) : null;

  const scrollFades = (
    <>
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 h-8 transition-opacity duration-200 ${
          fadeTop ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          backgroundImage: `linear-gradient(to bottom, ${fadeFrom}, transparent)`,
        }}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-10 transition-opacity duration-200 ${
          fadeBottom ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          backgroundImage: `linear-gradient(to top, ${fadeFrom}, transparent)`,
        }}
      />
    </>
  );

  const shellClass = fillStage
    ? 'relative flex h-full max-h-full w-full min-h-0 flex-col overflow-hidden rounded-2xl text-page'
    : `relative flex h-full max-h-full w-full min-h-0 max-w-[30rem] flex-col overflow-hidden rounded-[16px] bg-page-elevated text-page sm:h-auto sm:max-h-[min(78dvh,40rem)]${
        docIntro === 'play' ? ' manual-doc-in' : ''
      }`;

  return (
    <div
      className={shellClass}
      style={{
        ...(fillStage ? { backgroundColor: STAGE_SURFACE } : undefined),
        ...(!fillStage && docIntro === 'pending' ? { opacity: 0 } : undefined),
      }}
    >
      <header
        className={`manual-doc-chrome relative flex h-14 shrink-0 items-center justify-between gap-3 ${PAD_X} ${
          fillStage ? '' : 'rounded-t-[16px] bg-page-elevated'
        }`}
      >
        {!plateOpen && !fillStage ? (
          <ManualScrollKnob
            scrollRef={scrollRef}
            label={t('scrollKnobAria')}
          />
        ) : !plateOpen ? (
          <div
            aria-hidden
            className={`manual-doc-rule absolute bottom-0 left-11 right-11 h-px bg-[color-mix(in_srgb,var(--page-fg)_10%,transparent)] sm:left-12 sm:right-12 lg:left-14 lg:right-14`}
          />
        ) : (
          <div
            aria-hidden
            className="manual-doc-rule absolute bottom-0 left-11 right-11 h-px bg-[color-mix(in_srgb,var(--page-fg)_12%,transparent)] sm:left-12 sm:right-12 lg:left-14 lg:right-14"
          />
        )}

        <button
          type="button"
          aria-label={t('indexBrandAria')}
          onClick={goHome}
          className="group inline-flex min-w-0 cursor-pointer items-center gap-2 border-0 bg-transparent p-0 transition-opacity hover:opacity-85"
        >
          {!fillStage ? (
            <FjorrMark className="h-[20px] w-auto shrink-0 translate-y-[2px] text-page sm:h-[21px]" />
          ) : null}
          <span
            className={
              fillStage
                ? 'font-sans text-[17px] font-bold leading-none tracking-tight text-[#0B0B0C] md:text-[20px]'
                : 'font-sans text-[13.5px] font-semibold leading-none tracking-tight text-page-muted transition-colors group-hover:text-page'
            }
          >
            {t('indexBrand')}
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-3.5">
          <button
            type="button"
            onClick={() => setPanel((p) => (p === 'menu' ? 'closed' : 'menu'))}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            className="cursor-pointer border-0 bg-transparent p-0 font-sans text-[14px] font-semibold text-page transition-opacity hover:opacity-75"
          >
            {menuOpen ? t('closeMenu') : t('menu')}
          </button>
          <button
            type="button"
            onClick={handleExit}
            aria-label={t('exitAria')}
            title={t('exit')}
            className="inline-flex size-7 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-page-faint transition-colors hover:bg-[color-mix(in_srgb,var(--page-fg)_6%,transparent)] hover:text-page"
          >
            <X size={15} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </header>

      <div
        className={`manual-doc-body relative min-h-0 flex-auto overflow-hidden ${
          fillStage ? '' : 'rounded-b-[16px]'
        }`}
      >
        <ManualCardProvider value={cardCtx}>
          <div
            ref={scrollRef}
            className="manual-scroll h-full max-h-full overflow-y-auto overscroll-contain"
          >
            {mainContent}
          </div>
        </ManualCardProvider>
        {scrollFades}
      </div>

      {plateOverlay}
    </div>
  );
}
