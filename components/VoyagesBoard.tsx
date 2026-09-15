'use client';

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Icon } from '@/components/ui/Icons';
import SheetEnter from '@/components/house/SheetEnter';
import type { FilmLogEntry } from '@/lib/film-record-actions';

const VIEW_KEY = 'fjorr-voyages-view';
const NUMBER_MAX_PX = 64;
const NUMBER_MIN_PX = 40;

type ViewMode = 'card' | 'list';

const RAIL_CSS = `
  .fjorr-voyages-rail::-webkit-scrollbar { display: none !important; }
  .fjorr-voyages-rail {
    -ms-overflow-style: none;
    scrollbar-width: none;
    overflow-x: scroll;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-x;
    overscroll-behavior-x: contain;
  }
`;

function formatStampDate(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

function formatVoyageurNumber(n: number, locale: string) {
  try {
    return new Intl.NumberFormat(locale).format(n);
  } catch {
    return String(n);
  }
}

/** Light IntroCard twin — natural height; rail aligns tops. */
function VoyageCard({ entry }: { entry: FilmLogEntry }) {
  const t = useTranslations('Account');
  const locale = useLocale();
  const numberRef = useRef<HTMLSpanElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const code = formatVoyageurNumber(entry.viewer_number, locale);
  const date = formatStampDate(entry.recorded_at, locale);
  const href = entry.film_slug ? `/film/${entry.film_slug}` : undefined;

  const fitNumber = useCallback(() => {
    const el = numberRef.current;
    const card = cardRef.current;
    if (!el || !card) return;

    el.style.fontSize = `${NUMBER_MAX_PX}px`;
    let size = NUMBER_MAX_PX;
    const maxWidth = card.clientWidth - 64;
    while (size > NUMBER_MIN_PX && el.scrollWidth > maxWidth) {
      size -= 2;
      el.style.fontSize = `${size}px`;
    }
  }, []);

  useLayoutEffect(() => {
    fitNumber();
    const card = cardRef.current;
    const ro =
      typeof ResizeObserver !== 'undefined' && card
        ? new ResizeObserver(() => fitNumber())
        : null;
    if (card) ro?.observe(card);
    window.addEventListener('resize', fitNumber);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', fitNumber);
    };
  }, [code, fitNumber]);

  const className =
    'box-border flex w-full flex-col items-center gap-5 rounded-[22px] bg-[#F5F5F7] px-8 py-8 text-[#0B0B0C] transition-[opacity,transform] duration-200 ease-out md:gap-6 md:rounded-[28px] md:px-10 md:py-10' +
    (href ? ' hover:opacity-70 hover:scale-[0.985] active:scale-[0.97]' : '');

  const body = (
    <>
      <span className="shrink-0 font-sans text-[15px] font-semibold tracking-normal text-black/45 sm:text-[16px]">
        {t('voyageurEyebrow')}
      </span>
      <span
        ref={numberRef}
        className="inline-block max-w-full whitespace-nowrap font-interTight font-bold leading-none tracking-tight text-[#0B0B0C]"
        style={{ fontSize: NUMBER_MAX_PX }}
      >
        {code}
      </span>
      <div className="flex w-full flex-col items-center gap-1 text-center">
        <span className="line-clamp-3 font-sans text-[18px] font-semibold leading-snug tracking-tight text-black/70 md:text-[20px]">
          {entry.film_name}
        </span>
        {date ? (
          <span className="font-sans text-[13px] font-medium text-black/40">
            {date}
          </span>
        ) : null}
      </div>
    </>
  );

  return (
    <div
      ref={cardRef}
      className="w-[16.5rem] shrink-0 snap-start md:w-[18rem]"
    >
      {href ? (
        <Link href={href} className={className}>
          {body}
        </Link>
      ) : (
        <div className={className}>{body}</div>
      )}
    </div>
  );
}

export default function VoyagesBoard({
  logs,
  title,
  emptyCtaLabel,
}: {
  logs: FilmLogEntry[];
  title: string;
  emptyCtaLabel: string;
}) {
  const t = useTranslations('Account');
  const tFilm = useTranslations('Film');
  const locale = useLocale();
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const railRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(VIEW_KEY);
      if (stored === 'card' || stored === 'list') setViewMode(stored);
    } catch {
      /* ignore */
    }
  }, []);

  const setView = (mode: ViewMode) => {
    setViewMode(mode);
    try {
      window.localStorage.setItem(VIEW_KEY, mode);
    } catch {
      /* ignore */
    }
  };

  const syncRailEdges = useCallback(() => {
    const el = railRef.current;
    if (!el) {
      setCanPrev(false);
      setCanNext(false);
      return;
    }
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(max > 4 && el.scrollLeft < max - 4);
  }, []);

  useEffect(() => {
    if (viewMode !== 'card') return;
    const el = railRef.current;
    if (!el) return;
    syncRailEdges();
    el.addEventListener('scroll', syncRailEdges, { passive: true });
    window.addEventListener('resize', syncRailEdges);
    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => syncRailEdges())
        : null;
    ro?.observe(el);
    return () => {
      el.removeEventListener('scroll', syncRailEdges);
      window.removeEventListener('resize', syncRailEdges);
      ro?.disconnect();
    };
  }, [logs.length, syncRailEdges, viewMode]);

  const scrollRail = useCallback((direction: -1 | 1) => {
    const el = railRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-voyage-card]');
    const step = card ? card.offsetWidth + 16 : Math.round(el.clientWidth * 0.7);
    el.scrollBy({ left: direction * step, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (viewMode !== 'card' || logs.length < 2) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        scrollRail(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        scrollRail(1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [logs.length, scrollRail, viewMode]);

  const viewToggle = (
    <div className="flex shrink-0 items-center justify-center gap-2.5">
      <button
        type="button"
        onClick={() => setView('list')}
        aria-pressed={viewMode === 'list'}
        aria-label={tFilm('browseViewIndex')}
        className={`inline-flex size-7 items-center justify-center border-0 bg-transparent p-0 transition-colors ${
          viewMode === 'list'
            ? 'text-[#0B0B0C]'
            : 'text-black/30 hover:text-black/50'
        }`}
      >
        <Icon name="heroView" className="h-[14px] w-[14px]" />
      </button>
      <button
        type="button"
        onClick={() => setView('card')}
        aria-pressed={viewMode === 'card'}
        aria-label={tFilm('browseViewGrid')}
        className={`inline-flex size-7 items-center justify-center border-0 bg-transparent p-0 transition-colors ${
          viewMode === 'card'
            ? 'text-[#0B0B0C]'
            : 'text-black/30 hover:text-black/50'
        }`}
      >
        <Icon name="cardView" className="h-[15px] w-[12px]" />
      </button>
    </div>
  );

  const pageHeader = (
    <header className="flex w-full flex-col items-center gap-3 text-center">
      <h1 className="m-0 select-none font-interTight text-3xl font-bold tracking-tight text-[#0B0B0C] sm:text-4xl">
        {title}
      </h1>
      {viewToggle}
    </header>
  );

  if (logs.length === 0) {
    return (
      <div className="flex w-full flex-col items-center gap-10">
        {pageHeader}
        <div className="flex flex-col items-center gap-6 py-6 text-center">
          <p className="m-0 max-w-[28ch] font-sans text-[16px] font-medium leading-relaxed text-black/45">
            {t('filmLogsEmpty')}
          </p>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-full bg-[#0B0B0C] px-5 font-sans text-[14px] font-semibold text-white transition-opacity hover:opacity-85"
          >
            {emptyCtaLabel}
          </Link>
        </div>
      </div>
    );
  }

  const showRailNav = logs.length > 1 && (canPrev || canNext);

  const railNav =
    showRailNav && viewMode === 'card' ? (
      <nav
        aria-label={title}
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3"
      >
        <div className="pointer-events-auto flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => scrollRail(-1)}
            disabled={!canPrev}
            aria-label={t('voyagesPrevious')}
            className="flex h-9 w-9 items-center justify-center border-0 bg-transparent p-0 transition-opacity hover:enabled:opacity-80 disabled:cursor-default disabled:opacity-35"
          >
            <Icon name="circleNavBack" className="!h-9 !w-9" aria-hidden />
          </button>
          <span className="min-w-[2rem] text-center font-sans text-[13px] font-semibold tabular-nums tracking-tight text-black/45">
            {logs.length}
          </span>
          <button
            type="button"
            onClick={() => scrollRail(1)}
            disabled={!canNext}
            aria-label={t('voyagesNext')}
            className="flex h-9 w-9 items-center justify-center border-0 bg-transparent p-0 transition-opacity hover:enabled:opacity-80 disabled:cursor-default disabled:opacity-35"
          >
            <Icon name="circleNavForward" className="!h-9 !w-9" aria-hidden />
          </button>
        </div>
      </nav>
    ) : null;

  return (
    <div className="relative flex min-h-[calc(100dvh-11rem)] w-full flex-col gap-8">
      {pageHeader}
      {railNav}

      {viewMode === 'card' ? (
        <SheetEnter className="flex min-h-0 w-full flex-1 flex-col justify-center pb-16 md:pb-20">
          <style dangerouslySetInnerHTML={{ __html: RAIL_CSS }} />
          {/* Break out of AccountShell padding on the right so cards bleed off-screen. */}
          <div
            ref={railRef}
            className="fjorr-voyages-rail -mr-5 flex items-start snap-x snap-mandatory gap-4 pb-1 sm:-mr-8 sm:gap-5 md:-mr-10 md:gap-6"
            aria-label={title}
          >
            {logs.map((entry) => (
              <div
                key={`${entry.film_id}-${entry.viewer_number}`}
                data-voyage-card
                className="shrink-0"
              >
                <VoyageCard entry={entry} />
              </div>
            ))}
            {/* End spacer so the last card can clear the right edge a little. */}
            <div className="w-5 shrink-0 sm:w-8 md:w-10" aria-hidden />
          </div>
        </SheetEnter>
      ) : (
        <div className="mx-auto w-full max-w-[44rem]">
          <ul className="m-0 list-none p-0" aria-label={title}>
            {logs.map((entry) => {
              const date = formatStampDate(entry.recorded_at, locale);
              const voyageur = formatVoyageurNumber(
                entry.viewer_number,
                locale
              );
              const href = entry.film_slug
                ? `/film/${entry.film_slug}`
                : undefined;

              return (
                <li
                  key={`${entry.film_id}-${entry.viewer_number}`}
                  className="border-b border-black/[0.06] bg-transparent last:border-b-0"
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_5.5rem_6.5rem] items-center gap-3 bg-transparent py-2.5 md:grid-cols-[minmax(0,1fr)_6rem_7rem] md:gap-4">
                    {href ? (
                      <Link
                        href={href}
                        className="min-w-0 truncate text-left font-interTight text-[15px] font-bold leading-tight tracking-tight text-[#0B0B0C] transition-opacity duration-200 hover:opacity-55 md:text-[16px]"
                      >
                        {entry.film_name}
                      </Link>
                    ) : (
                      <span className="min-w-0 truncate text-left font-interTight text-[15px] font-bold leading-tight tracking-tight text-[#0B0B0C] md:text-[16px]">
                        {entry.film_name}
                      </span>
                    )}
                    <span className="min-w-0 truncate text-left font-sans text-[12px] font-medium tabular-nums text-black/40 md:text-[13px]">
                      {voyageur}
                    </span>
                    <span className="min-w-0 truncate text-left font-sans text-[12px] font-medium text-black/40 md:text-[13px]">
                      {date || '—'}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
