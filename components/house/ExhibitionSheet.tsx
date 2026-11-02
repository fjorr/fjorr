'use client';

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { parseLocale } from '@/i18n/config';
import { parseVttCues, type VttCue } from '@/lib/vtt';
import type { ProcessImage } from '@/components/house/ProcessLightbox';
import { storySettingDisplay } from '@/lib/story-year';
import RatingBadge from '@/components/house/RatingBadge';
import FilmCopy from '@/components/house/FilmCopy';
import {
  FILM_FRAME_CLASS,
} from '@/components/house/house-stage-margins';

export type SheetCredit = {
  name: string;
  role: string;
  slug?: string | null;
  image?: string | null;
};
export type SheetArtifact = {
  slug: string;
  name: string;
  image: string | null;
  meta: string | null;
};
export type SheetTranscript = { language_code: string; content: string };
export type SheetTrack = { code: string; name: string; vtt_url?: string };

export type ExhibitionFilm = {
  name: string;
  teaser: string | null;
  description: string | null;
  directorNote: string | null;
  storyDate: string | null;
  rating: string | null;
  runtime: number | null;
  theme: string | null;
  location: string | null;
  releaseDate: string | null;
  /** Spoken / mix languages — English until we have a DB field. */
  audioLanguages: string[];
  credits: SheetCredit[];
  artifacts: SheetArtifact[];
  processImages: ProcessImage[];
  transcripts: SheetTranscript[];
  tracks: SheetTrack[];
};

function clock(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function runtimeLabel(seconds?: number | null) {
  if (!seconds) return null;
  const minutes = Math.ceil(seconds / 60);
  return minutes === 0 ? '1m' : `${minutes}m`;
}

function formatLocation(raw: unknown): string | null {
  if (!raw) return null;
  if (typeof raw === 'string') return raw.trim() || null;
  if (Array.isArray(raw)) {
    const parts = raw.map((v) => String(v).trim()).filter(Boolean);
    return parts.length ? parts.join(', ') : null;
  }
  return null;
}

function releaseYear(raw?: string | null): string | null {
  if (!raw) return null;
  const year = new Date(raw).getFullYear();
  return Number.isFinite(year) ? String(year) : null;
}

/** Vertical titled posters. Two fill the reading column (min(34rem, viewport − 3rem)) with a 12px gap. */
const ARTIFACT_CARD_CLASS =
  'w-[calc((min(34rem,100vw-3rem)-0.75rem)/2)] shrink-0 snap-center text-left';

/**
 * Always centered: a row that fits sits in the middle; a longer row opens
 * scrolled to its middle so posters run off both edges (like More films).
 */
export function FilmArtifactRail({ film }: { film: ExhibitionFilm }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollLeft = Math.max(0, (scroller.scrollWidth - scroller.clientWidth) / 2);
  }, [film.artifacts.length]);

  if (!film.artifacts.length) return null;
  return (
    <section id="film-info" className="scroll-mt-[54px] bg-white pt-10 text-[#0B0B0C] md:pt-12">
      <h2
        className={`${FILM_FRAME_CLASS} mb-4 text-center font-[family-name:var(--font-circular-black)] text-[1.25rem] font-[900] leading-normal tracking-[-0.03em]`}
      >
        Artifacts
      </h2>
      <div
        ref={scrollerRef}
        className="snap-x snap-mandatory overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="mx-auto flex w-max gap-3 px-6 pb-1 md:px-12">
          {film.artifacts.map((artifact) => (
            <Link
              key={artifact.slug}
              href={`/artifact/${artifact.slug}`}
              aria-label={artifact.meta ? `${artifact.name}, ${artifact.meta}` : artifact.name}
              className={`group ${ARTIFACT_CARD_CLASS}`}
            >
              <div className="aspect-[2/3] w-full overflow-hidden rounded-[8px] bg-[#F3F3F4]">
                {artifact.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={artifact.image}
                    alt=""
                    className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-90"
                  />
                ) : null}
              </div>
              {artifact.meta ? (
                <p className="mt-2 truncate font-sans text-[12px] font-medium leading-snug tracking-tight text-black/45">
                  {artifact.meta}
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Cabinet / craft leads first — recognition hierarchy. */
const CABINET_ROLE_ORDER = [
  'director',
  'writer',
  'written by',
  'editor',
  'edited by',
  'composer',
  'music',
  'cinematographer',
  'director of photography',
  'dp',
  'producer',
  'produced by',
];

function roleRank(role: string) {
  const key = role.trim().toLowerCase();
  const i = CABINET_ROLE_ORDER.findIndex(
    (lead) => key === lead || key.includes(lead)
  );
  return i === -1 ? 100 : i;
}

/** Demo portraits until creator.image is filled in CMS. Thor omitted to try text-only. */
const LOCAL_CREDIT_PORTRAITS = new Set(['ted-sorensen', 'john-f-kennedy']);

/**
 * One card per person. Multiple roles collapse to `Director · Writer`.
 * Temporary local portraits under /credits/{slug}.jpg until CMS images fill in.
 */
function buildCreditCards(credits: SheetCredit[]) {
  const byPerson = new Map<
    string,
    { name: string; slug: string | null; image: string | null; roles: string[] }
  >();

  for (const credit of credits) {
    const name = credit.name?.trim();
    if (!name) continue;
    const key = (credit.slug || name).toLowerCase();
    const existing = byPerson.get(key);
    const role = credit.role?.trim();
    if (existing) {
      if (role && !existing.roles.includes(role)) existing.roles.push(role);
      if (!existing.image && credit.image) existing.image = credit.image;
      if (!existing.slug && credit.slug) existing.slug = credit.slug;
    } else {
      byPerson.set(key, {
        name,
        slug: credit.slug?.trim() || null,
        image: credit.image?.trim() || null,
        roles: role ? [role] : [],
      });
    }
  }

  const cards = [...byPerson.values()].map((person) => {
    const roles = [...person.roles].sort((a, b) => roleRank(a) - roleRank(b));
    const localPortrait =
      person.slug && LOCAL_CREDIT_PORTRAITS.has(person.slug)
        ? `/credits/${person.slug}.jpg`
        : null;
    return {
      name: person.name,
      roleLabel: roles.join(' · ') || 'Credit',
      image: person.image || localPortrait,
      sort: roles.length ? roleRank(roles[0]!) : 100,
    };
  });

  return cards.sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name));
}

function CreditPortrait({
  image,
}: {
  image: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(image) && !failed;

  return (
    <div
      className="relative aspect-[3/4] overflow-hidden rounded-[8px] bg-[#E8E8EA]"
      aria-hidden={!showImage}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image!}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
          onError={() => setFailed(true)}
        />
      ) : null}
    </div>
  );
}

export default function ExhibitionSheet({
  film,
  onSeek,
}: {
  film: ExhibitionFilm;
  onSeek: (seconds: number) => void;
}) {
  const t = useTranslations('Film');
  const locale = parseLocale(useLocale());
  const scrollRef = useRef<HTMLDivElement>(null);
  const [cues, setCues] = useState<VttCue[]>([]);
  const [transcriptQuery, setTranscriptQuery] = useState('');
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const creditCards = useMemo(
    () => buildCreditCards(film.credits),
    [film.credits]
  );
  /** Overview = long copy; teaser fills in when description is empty. */
  const overview = film.description?.trim() || film.teaser?.trim() || '';

  const transcriptSource = useMemo(() => {
    const rows = film.transcripts || [];
    const match =
      rows.find((row) => row.language_code?.toLowerCase() === locale) ||
      rows.find((row) => row.language_code?.toLowerCase() === 'en') ||
      rows[0];
    return match?.content || '';
  }, [film.transcripts, locale]);

  const filteredCues = useMemo(() => {
    const q = transcriptQuery.trim().toLowerCase();
    if (!q) return cues;
    return cues.filter((cue) => cue.dialogue.toLowerCase().includes(q));
  }, [cues, transcriptQuery]);

  function highlightMatch(text: string, query: string) {
    const q = query.trim();
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx < 0) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="rounded-[2px] bg-[#0B0B0C]/[0.08] px-0.5 text-inherit">
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </>
    );
  }

  useEffect(() => {
    // The sheet stays mounted while the rail changes films.
    setTranscriptOpen(false);
    setTranscriptQuery('');
  }, [film.name]);

  useEffect(() => {
    const parsed = parseVttCues(transcriptSource);
    if (parsed.length) {
      setCues(parsed);
      return;
    }
    setCues([]);
    const track =
      film.tracks.find(
        (track) => track.code?.toLowerCase() === locale && track.vtt_url
      ) || film.tracks.find((track) => track.vtt_url);
    if (!track?.vtt_url) return;
    let cancelled = false;
    void fetch(track.vtt_url)
      .then((response) => response.text())
      .then((text) => {
        if (!cancelled) setCues(parseVttCues(text));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [film.tracks, locale, transcriptSource]);

  const setting = storySettingDisplay(film.storyDate);
  const duration = runtimeLabel(film.runtime);
  const place = formatLocation(film.location);

  /** Locked type scale — eyebrow / section / subhead / body / caption. */
  const type = {
    eyebrow:
      'font-sans text-[13px] font-medium tracking-tight text-black/50',
    section:
      'font-[family-name:var(--font-circular-black)] text-[1.25rem] font-[900] leading-normal tracking-[-0.03em] text-[#0B0B0C]',
    body: 'font-sans text-[16px] font-normal leading-[1.65] tracking-[-0.005em] text-black/65',
    caption: 'font-sans text-[13px] font-medium leading-snug text-black/40',
    creditName:
      'font-sans text-[14px] font-semibold leading-snug tracking-[-0.01em] text-[#0B0B0C]',
    creditRole:
      'font-sans text-[12px] font-medium leading-snug text-black/40',
  };
  const sectionGap = 'mt-8 md:mt-10';

  const metaNodes: React.ReactNode[] = [];
  if (setting) {
    metaNodes.push(
      <span key="setting" className={type.eyebrow}>
        {setting}
      </span>
    );
  }
  if (place) {
    metaNodes.push(
      <span key="place" className={type.eyebrow}>
        {place}
      </span>
    );
  }
  if (film.rating) {
    metaNodes.push(
      <RatingBadge key="rating" rating={film.rating} tone="onLight" />
    );
  }

  const audio = (film.audioLanguages || []).filter(Boolean);
  const subtitles = [
    ...new Set((film.tracks || []).map((track) => track.name).filter(Boolean)),
  ];
  const year = releaseYear(film.releaseDate);
  const specRows: Array<{ label: string; value: string }> = [];
  if (audio.length) specRows.push({ label: t('audioLabel'), value: audio.join(' · ') });
  if (subtitles.length)
    specRows.push({ label: t('subtitlesLabel'), value: subtitles.join(' · ') });
  if (duration) specRows.push({ label: t('runtimeLabel'), value: duration });
  if (year) specRows.push({ label: t('releasedLabel'), value: year });
  if (film.theme) specRows.push({ label: 'Theme', value: film.theme });

  const dossierAnchor = film.artifacts.length > 0 ? undefined : 'film-info';
  const hasCredits = creditCards.length > 0;
  const hasOverview = Boolean(overview);

  return (
    <div
      ref={scrollRef}
      id={dossierAnchor}
      className="scroll-mt-[54px] bg-white pt-12 text-[#0B0B0C] md:pt-16"
    >
      <div className={`${FILM_FRAME_CLASS} pb-16 md:pb-20`}>
        {hasCredits ? (
          <section aria-label={t('creditsLabel')}>
            <h2 className={`mb-5 text-center ${type.section}`}>{t('creditsLabel')}</h2>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-6 md:gap-x-5">
              {creditCards.map((person) => (
                <figure
                  key={person.name}
                  className="m-0 w-[104px] shrink-0 text-center sm:w-[112px]"
                >
                  <CreditPortrait image={person.image} />
                  <figcaption className="mt-3 text-center">
                    <p className={`m-0 ${type.creditName}`}>{person.name}</p>
                    <p className={`mt-1 ${type.creditRole}`}>
                      {person.roleLabel}
                    </p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        {hasOverview ? (
          <section className={`max-w-[34rem] ${hasCredits ? sectionGap : ''}`}>
            <h2 className={`mb-4 ${type.section}`}>Overview</h2>
            <FilmCopy text={overview} className={type.body} />
            {metaNodes.length > 0 ? (
              <div className="mt-3 flex flex-wrap items-center justify-start gap-x-2 gap-y-1.5">
                {metaNodes.map((node, index) => (
                  <React.Fragment key={index}>
                    {index > 0 ? (
                      <span
                        className="select-none text-[13px] font-medium text-black/25"
                        aria-hidden
                      >
                        ·
                      </span>
                    ) : null}
                    {node}
                  </React.Fragment>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {cues.length > 0 ? (
          <div className={`max-w-[34rem] ${hasCredits || hasOverview ? sectionGap : ''}`}>
            <button
              type="button"
              aria-expanded={transcriptOpen}
              onClick={() => setTranscriptOpen((open) => !open)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-sans text-[14px] font-semibold leading-none tracking-tight transition-colors ${
                transcriptOpen
                  ? 'border-[#0B0B0C] bg-[#0B0B0C] text-white'
                  : 'border-black/15 bg-transparent text-[#0B0B0C] hover:border-black/30'
              }`}
            >
              <span>{t('transcript')}</span>
              <span
                className={`text-[16px] font-normal leading-none ${transcriptOpen ? 'text-white/70' : 'text-black/40'}`}
                aria-hidden
              >
                {transcriptOpen ? '–' : '+'}
              </span>
            </button>
            {transcriptOpen ? (
              <div className="mt-4">
                <div className="relative mb-4">
                  <svg
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="search"
                    value={transcriptQuery}
                    onChange={(event) => setTranscriptQuery(event.target.value)}
                    placeholder={t('transcriptSearch')}
                    className="transcript-search h-10 w-full rounded-[10px] border-0 bg-[#F5F5F7] pl-11 pr-11 font-sans text-[14px] font-medium text-[#0B0B0C] outline-none placeholder:text-black/35 focus:ring-2 focus:ring-black/10"
                  />
                  {transcriptQuery.trim() ? (
                    <button
                      type="button"
                      onClick={() => setTranscriptQuery('')}
                      aria-label={t('transcriptClose')}
                      className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-black/35 transition-colors hover:bg-black/[0.06] hover:text-black/55"
                    >
                      <span className="text-[18px] leading-none" aria-hidden>
                        ×
                      </span>
                    </button>
                  ) : null}
                </div>
                <div className="flex flex-col">
                  {filteredCues.length > 0 ? (
                    filteredCues.map((cue) => (
                      <button
                        key={`${cue.startSeconds}-${cue.dialogue}`}
                        type="button"
                        onClick={() => onSeek(cue.startSeconds)}
                        className="group -mx-3 flex w-[calc(100%+1.5rem)] gap-4 rounded-[6px] px-3 py-1 text-left transition-colors hover:bg-black/[0.03] sm:gap-5"
                      >
                        <span className="w-11 shrink-0 pt-0.5 font-mono text-[11px] tabular-nums text-black/30 transition-colors group-hover:text-black/55">
                          {clock(cue.startSeconds)}
                        </span>
                        <span className="font-sans text-[15px] font-normal leading-[1.5] text-black/65 transition-colors group-hover:text-[#0B0B0C] sm:text-[16px]">
                          {highlightMatch(cue.dialogue, transcriptQuery)}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className={`py-6 text-center ${type.caption}`}>
                      {t('transcriptNoMatches')}
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {specRows.length > 0 ? (
          <section
            className={`max-w-[34rem] border-t border-black/10 pt-5 ${
              hasCredits || hasOverview || cues.length > 0 ? 'mt-14 md:mt-16' : ''
            }`}
            aria-label={t('specs')}
          >
            <h2 className="mb-2 font-sans text-[12px] font-medium tracking-tight text-black/40">
              {t('specs')}
            </h2>
            <ul className="m-0 list-none space-y-1 p-0">
              {specRows.map((row) => (
                <li
                  key={row.label}
                  className="text-left font-sans text-[12px] leading-snug"
                >
                  <span className="font-medium text-black/35">{row.label}</span>
                  <span className="font-medium text-black/55"> {row.value}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .transcript-search::-webkit-search-cancel-button,
            .transcript-search::-webkit-search-decoration {
              -webkit-appearance: none;
              appearance: none;
            }
          `,
        }}
      />

    </div>
  );
}
