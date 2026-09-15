'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuthPresence } from '@/components/AuthPresenceProvider';
import { storySettingDisplay } from '@/lib/story-year';
import { resolveTitleArtColor, sanitizeTitleArtSvg } from '@/lib/sanitize-svg';
import RatingBadge from '@/components/house/RatingBadge';
import { getOwnVoyageurStampForFilm } from '@/lib/film-record-actions';

const FilmSendSheet = dynamic(() => import('@/components/FilmSendSheet'), {
  ssr: false,
});

export type HouseHeroCopyFilm = {
  id?: string | null;
  name?: string | null;
  slug: string;
  teaser?: string | null;
  sponsor?: string | null;
  rating?: string | null;
  location?: string | string[] | { name?: string } | null;
  storyDate?: string | null;
  runtime?: number | null;
  comingSoon?: boolean;
  titleArtCode?: string | null;
  titleArtHex?: string | null;
  titleArtScale?: number | null;
  blokTall?: string | null;
  heroTall?: string | null;
  /** House intro slide — black frame, custom copy + CTA. */
  kind?: 'intro';
};

function runtimeLabel(seconds?: number | null) {
  const minutes = Math.ceil((seconds || 0) / 60);
  return minutes === 0 ? '1m' : `${minutes}m`;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(
      typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }, []);
  return reduced;
}

type Props = {
  film: HouseHeroCopyFilm | null;
  /** Fade only — position stays fixed over the stage. */
  visible: boolean;
  titleAs?: 'h1' | 'h2';
  onWatch: () => void;
  /** Film stage: button opens sheet. Home: omit and pass infoHref. */
  onInfo?: () => void;
  infoHref?: string;
  /** Hide returning-viewer Voyageur chip (e.g. early release owns that corner). */
  showVoyageurChip?: boolean;
  /** Share / send CTA — off for early release (not public yet). */
  showSend?: boolean;
};

/** Hero title / meta / CTAs — fixed in place; parent fades visibility on slide. */
export default function HouseHeroCopy({
  film,
  visible,
  titleAs = 'h2',
  onWatch,
  onInfo,
  infoHref,
  showVoyageurChip = true,
  showSend = true,
}: Props) {
  const t = useTranslations('Film');
  const tHome = useTranslations('Home');
  const { signedIn } = useAuthPresence();
  const reduced = usePrefersReducedMotion();
  const [sendOpen, setSendOpen] = useState(false);
  const [voyageurNumber, setVoyageurNumber] = useState<number | null>(null);

  useEffect(() => {
    setSendOpen(false);
  }, [film?.slug]);

  useEffect(() => {
    setVoyageurNumber(null);
    const filmId = film?.id ? String(film.id) : '';
    if (!filmId || film?.kind === 'intro' || signedIn !== true || !showVoyageurChip)
      return;

    let cancelled = false;
    void getOwnVoyageurStampForFilm(filmId).then((row) => {
      if (!cancelled) setVoyageurNumber(row?.voyageurNumber ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [film?.id, film?.kind, signedIn, showVoyageurChip]);

  if (!film) return null;

  const TitleTag = titleAs;
  const isIntro = film.kind === 'intro';
  const setting = storySettingDisplay(film.storyDate);
  const place = (() => {
    const raw = film.location as unknown;
    if (!raw) return null;
    if (typeof raw === 'string') return raw.trim() || null;
    if (Array.isArray(raw)) {
      const parts = raw.map((v) => String(v).trim()).filter(Boolean);
      return parts.length ? parts.join(', ') : null;
    }
    if (typeof raw === 'object' && raw !== null && 'name' in raw) {
      return String((raw as { name?: string }).name || '').trim() || null;
    }
    return null;
  })();
  const title = isIntro ? null : film.name;
  const body = isIntro ? null : film.teaser;
  const titleArtSvg = !isIntro ? sanitizeTitleArtSvg(film.titleArtCode) : null;
  const titleArtWidth = `${300 * (film.titleArtScale || 1)}px`;
  const introMotion = isIntro && visible && !reduced;

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-20 transition-opacity duration-500 ease-out ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden={!visible}
      {...(isIntro ? { 'aria-label': tHome('introAria') } : {})}
    >
      {isIntro ? (
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @keyframes fjorr-intro-up {
                from {
                  opacity: 0;
                  transform: translate3d(0, 0.55em, 0);
                }
                to {
                  opacity: 1;
                  transform: translate3d(0, 0, 0);
                }
              }
            `,
          }}
        />
      ) : null}
      {!isIntro ? (
        <div
          className="absolute inset-x-0 bottom-0 h-1/2"
          style={{
            background:
              'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 100%)',
          }}
        />
      ) : null}
      {!isIntro && voyageurNumber != null ? (
        <div
          aria-hidden={!visible}
          className="pointer-events-none absolute left-8 top-4 z-10 rounded-[6px] bg-black/40 px-2.5 py-1 font-sans text-[12px] font-semibold tracking-normal text-white/85 backdrop-blur-sm md:left-12 md:top-5"
        >
          {t('voyageurBadgeTitle', { number: voyageurNumber })}
        </div>
      ) : null}
      <div
        className={
          isIntro
            ? 'absolute inset-0 flex flex-col items-center justify-center px-8 text-center'
            : 'absolute inset-x-0 bottom-0 flex flex-col items-center px-8 pb-14 pt-16 text-center md:items-start md:px-12 md:pb-10 md:text-left'
        }
      >
        {!isIntro && film.sponsor ? (
          <div className="mb-2.5 font-sans text-[13px] font-bold tracking-wide text-white/90">
            {film.sponsor}{' '}
            <span className="font-medium text-white/70">{t('presents')}</span>
          </div>
        ) : null}

        {isIntro ? (
          <h2
            key={visible ? 'intro-in' : 'intro-out'}
            className="m-0 mb-8 max-w-4xl font-futura text-[clamp(3.25rem,10vw,5.5rem)] leading-[0.9] tracking-tighter text-balance text-[#f5f5f7] will-change-[transform,opacity] md:mb-10"
            style={
              introMotion
                ? {
                    opacity: 0,
                    animation:
                      'fjorr-intro-up 0.9s cubic-bezier(0.25, 0.1, 0.25, 1) both',
                  }
                : undefined
            }
          >
            {tHome('introHeadline')}
          </h2>
        ) : titleArtSvg ? (
          <>
            {film.name ? <TitleTag className="sr-only">{film.name}</TitleTag> : null}
            <div
              className="mb-4 flex w-full max-w-[220px] items-center justify-center md:max-w-[340px] md:justify-start [&>svg]:h-auto [&>svg]:w-full"
              style={
                {
                  color: resolveTitleArtColor(film.titleArtHex),
                  '--title-art-width': titleArtWidth,
                } as React.CSSProperties
              }
            >
              <div
                className="w-full md:w-[var(--title-art-width)]"
                dangerouslySetInnerHTML={{ __html: titleArtSvg }}
              />
            </div>
          </>
        ) : title ? (
          <TitleTag className="mb-3 max-w-lg font-interTight text-[40px] font-bold leading-[0.95] tracking-tight text-white md:text-[52px]">
            {title}
          </TitleTag>
        ) : null}

        {!isIntro && (setting || film.rating || place) ? (
          <div className="mb-3 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 md:justify-start">
            {setting ? (
              <span
                className="font-sans text-[13px] font-medium tracking-normal text-white/55"
                aria-label={`${t('storyYearLabel')} ${setting}`}
              >
                {setting}
              </span>
            ) : null}
            {film.rating ? (
              <RatingBadge rating={film.rating} tone="onDark" />
            ) : null}
            {place ? (
              <span className="font-sans text-[13px] font-medium tracking-normal text-white/55">
                {place}
              </span>
            ) : null}
          </div>
        ) : null}

        {body ? (
          <p className="mb-5 max-w-xs font-sans text-sm font-medium leading-[1.4em] text-white/80">
            {body}
          </p>
        ) : null}

        <div
          key={isIntro && visible ? 'intro-cta-in' : 'intro-cta'}
          className={`pointer-events-auto flex flex-wrap items-center gap-x-3.5 gap-y-2 will-change-[transform,opacity] ${
            isIntro
              ? 'justify-center'
              : 'justify-center md:justify-start'
          }`}
          style={
            introMotion
              ? {
                  opacity: 0,
                  animation:
                    'fjorr-intro-up 0.9s cubic-bezier(0.25, 0.1, 0.25, 1) 0.18s both',
                }
              : undefined
          }
          onClick={(event) => event.stopPropagation()}
        >
          {isIntro ? (
            <>
              <button
                type="button"
                onClick={onWatch}
                tabIndex={visible ? 0 : -1}
                className="inline-flex h-10 items-center rounded-full bg-white px-5 font-sans text-[14px] font-semibold tracking-tight text-[#0B0B0C] transition-opacity hover:opacity-90"
              >
                {tHome('introCta')}
              </button>
              <Link
                href="/about"
                tabIndex={visible ? 0 : -1}
                className="inline-flex h-10 items-center rounded-full border border-white/25 bg-white/12 px-5 font-sans text-[14px] font-semibold tracking-tight text-white/90 backdrop-blur-md transition-colors hover:bg-white/18 hover:text-white"
              >
                {tHome('introLearnMore')}
              </Link>
            </>
          ) : film.comingSoon ? (
            <span className="inline-flex items-center rounded-full border border-white/25 bg-white/12 px-4 py-2 font-sans text-[14px] font-semibold tracking-normal text-white/85 backdrop-blur-md">
              {t('comingSoon')}
            </span>
          ) : (
            <>
              <button
                type="button"
                onClick={onWatch}
                tabIndex={visible ? 0 : -1}
                className="inline-flex h-10 items-center rounded-full bg-white px-5 font-sans text-[14px] font-semibold tracking-tight text-[#0B0B0C] transition-opacity hover:opacity-90"
              >
                {runtimeLabel(film.runtime)
                  ? t('watch', { runtime: runtimeLabel(film.runtime) })
                  : t('watchPlain')}
              </button>
              {infoHref ? (
                <Link
                  href={infoHref}
                  tabIndex={visible ? 0 : -1}
                  className="inline-flex h-10 items-center rounded-full border border-white/25 bg-white/12 px-5 font-sans text-[14px] font-semibold tracking-tight text-white/90 backdrop-blur-md transition-colors hover:bg-white/18 hover:text-white"
                >
                  {t('info')}
                </Link>
              ) : onInfo ? (
                <button
                  type="button"
                  onClick={onInfo}
                  tabIndex={visible ? 0 : -1}
                  className="inline-flex h-10 items-center rounded-full border border-white/25 bg-white/12 px-5 font-sans text-[14px] font-semibold tracking-tight text-white/90 backdrop-blur-md transition-colors hover:bg-white/18 hover:text-white"
                >
                  {t('info')}
                </button>
              ) : null}
              {showSend ? (
                <button
                  type="button"
                  onClick={() => setSendOpen(true)}
                  tabIndex={visible ? 0 : -1}
                  className="inline-flex h-10 items-center rounded-full border border-white/25 bg-white/12 px-5 font-sans text-[14px] font-semibold tracking-tight text-white/90 backdrop-blur-md transition-colors hover:bg-white/18 hover:text-white"
                >
                  {t('send')}
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>

      {showSend && sendOpen && !isIntro ? (
        <FilmSendSheet
          open={sendOpen}
          onClose={() => setSendOpen(false)}
          film={{
            id: film.id,
            name: film.name,
            slug: film.slug,
            teaser: film.teaser,
            runtime: film.runtime,
            blok_tall: film.blokTall,
            hero_tall: film.heroTall,
          }}
        />
      ) : null}
    </div>
  );
}
