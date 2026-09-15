'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { parseLocale } from '@/i18n/config';
import { parseVttCues, type VttCue } from '@/lib/vtt';
import ProcessLightbox, {
  type ProcessImage,
} from '@/components/house/ProcessLightbox';
import { storySettingDisplay } from '@/lib/story-year';
import RatingBadge from '@/components/house/RatingBadge';

export type SheetCredit = {
  name: string;
  role: string;
  slug?: string | null;
  image?: string | null;
};
export type SheetArtifact = { slug: string; name: string; image: string | null };
export type SheetTranscript = { language_code: string; content: string };
export type SheetTrack = { code: string; name: string; vtt_url?: string };

export type ExhibitionFilm = {
  name: string;
  teaser: string | null;
  description: string | null;
  note: string | null;
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
  onClose,
  onSeek,
}: {
  film: ExhibitionFilm;
  onClose: () => void;
  onSeek: (seconds: number) => void;
}) {
  const t = useTranslations('Film');
  const locale = parseLocale(useLocale());
  const [cues, setCues] = useState<VttCue[]>([]);
  const [transcriptQuery, setTranscriptQuery] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const creditCards = useMemo(
    () => buildCreditCards(film.credits),
    [film.credits]
  );
  /** Overview = long copy; teaser fills in when description is empty. */
  const overview = film.description?.trim() || film.teaser?.trim() || '';
  /** Attribution / source line — footnote under overview, never a headline. */
  const footnote = film.note?.trim() || '';
  const directorNote = film.directorNote?.trim() || '';
  const directorCredit = film.credits.find((credit) =>
    /director/i.test(credit.role || '')
  );
  const processImages = film.processImages || [];
  const hasProcess = Boolean(directorNote) || processImages.length > 0;

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
    const parsed = parseVttCues(transcriptSource);
    if (parsed.length) {
      setCues(parsed);
      return;
    }
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

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && lightboxIndex == null) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIndex, onClose]);

  const setting = storySettingDisplay(film.storyDate);
  const duration = runtimeLabel(film.runtime);
  const place = formatLocation(film.location);

  /** Locked type scale — eyebrow / section / subhead / body / caption. */
  const type = {
    eyebrow:
      'font-sans text-[13px] font-medium tracking-normal text-black/50',
    section:
      'font-interTight text-[1.25rem] font-semibold leading-normal tracking-[-0.02em] text-[#0B0B0C]',
    body: 'font-sans text-[16px] font-normal leading-[1.65] tracking-[-0.005em] text-black/65',
    caption: 'font-sans text-[13px] font-medium leading-snug text-black/40',
    creditName:
      'font-interTight text-[16px] font-semibold leading-normal tracking-tight text-[#0B0B0C]',
    creditRole:
      'font-sans text-[12px] font-medium leading-snug text-black/40',
  };
  const sectionGap = 'mt-10 md:mt-12';
  const bandPad = 'py-12 md:py-14';
  const col = 'mx-auto w-full max-w-[34rem]';
  const rail =
    '-mx-6 flex justify-start gap-4 overflow-x-auto px-6 pb-1 md:-mx-10 md:gap-5 md:px-10';

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
  if (duration) {
    metaNodes.push(
      <span key="runtime" className={type.eyebrow}>
        {duration}
      </span>
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
  if (film.theme) specRows.push({ label: t('tagsLabel') === 'Tags' ? 'Theme' : 'Theme', value: film.theme });
  if (year) specRows.push({ label: t('releasedLabel'), value: year });

  return (
    <div className="fixed inset-x-0 bottom-0 top-[56px] z-20 animate-[sheetIn_280ms_ease-out] overflow-y-auto bg-white text-[#0B0B0C]">
      <div className="pointer-events-none sticky top-0 z-10 flex justify-end px-5 pt-3 md:px-8 md:pt-4">
        <button
          type="button"
          onClick={onClose}
          aria-label={t('keysClose')}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.04] text-black/45 transition-colors hover:bg-black/[0.08] hover:text-black"
        >
          <span className="text-[22px] leading-none" aria-hidden>
            ×
          </span>
        </button>
      </div>

      <div className="mx-auto w-full max-w-[720px] px-6 pt-0 md:px-10">
        <header className="mx-auto max-w-[28rem] text-center md:max-w-[32rem]">
          <p className={type.eyebrow}>{t('sheetLabel')}</p>
          <h1 className="mt-3 text-balance font-interTight text-[clamp(2.5rem,7vw,3.75rem)] font-bold leading-[0.92] tracking-[-0.03em] text-[#0B0B0C]">
            {film.name}
          </h1>
          {metaNodes.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5">
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
        </header>

        {overview || footnote ? (
          <section className={`${col} ${sectionGap}`}>
            {overview ? <p className={type.body}>{overview}</p> : null}
            {footnote ? (
              <p className={`${type.caption} ${overview ? 'mt-4' : ''}`}>
                {footnote}
              </p>
            ) : null}
          </section>
        ) : null}

        {film.artifacts.length > 0 ? (
          <section className={`${col} ${sectionGap}`}>
            <h2 className={`mb-5 ${type.section}`}>Artifacts</h2>
            <div className={rail}>
              {film.artifacts.map((artifact) => (
                <Link
                  key={artifact.slug}
                  href={`/artifact/${artifact.slug}`}
                  aria-label={artifact.name}
                  className="group w-[160px] shrink-0 sm:w-[172px] md:w-[188px]"
                >
                  <div className="flex aspect-[2/3] w-full items-center justify-center overflow-hidden rounded-[8px] bg-[#F3F3F4]">
                    {artifact.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={artifact.image}
                        alt=""
                        className="max-h-full max-w-full object-contain transition-opacity duration-300 group-hover:opacity-90"
                      />
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {hasProcess || creditCards.length > 0 ? (
        <div className={`${sectionGap} w-full bg-[#F5F5F7]`}>
          <div
            className={`mx-auto w-full max-w-[720px] px-6 md:px-10 ${bandPad}`}
          >
            {creditCards.length > 0 ? (
              <section className={col} aria-label={t('creditsLabel')}>
                <h2 className={`mb-5 ${type.section}`}>{t('creditsLabel')}</h2>
                <div className="-mx-6 flex w-[calc(100%+3rem)] justify-start gap-4 overflow-x-auto px-6 pb-1 md:-mx-10 md:w-[calc(100%+5rem)] md:gap-5 md:px-10">
                  {creditCards.map((person) => (
                    <figure
                      key={person.name}
                      className="m-0 w-[152px] shrink-0 text-left sm:w-[160px] md:w-[168px]"
                    >
                      <CreditPortrait image={person.image} />
                      <figcaption className="mt-3 text-left">
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

            {hasProcess ? (
              <section
                className={`${col} ${creditCards.length > 0 ? sectionGap : ''}`}
                aria-label={t('process')}
              >
                <h2 className={`mb-5 ${type.section}`}>{t('process')}</h2>
                {processImages.length > 0 ? (
                  <div
                    className={`grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5 ${
                      directorNote ? 'mb-6 md:mb-8' : ''
                    }`}
                  >
                    {processImages.map((image, index) => (
                      <button
                        key={image.id}
                        type="button"
                        onClick={() => setLightboxIndex(index)}
                        className="group relative aspect-square overflow-hidden rounded-[6px] bg-white/70 text-left"
                        aria-label={
                          image.caption || `Open process image ${index + 1}`
                        }
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image.thumbUrl || image.url}
                          alt={image.caption || ''}
                          className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-90"
                        />
                      </button>
                    ))}
                  </div>
                ) : null}
                {directorNote ? (
                  <div>
                    <p className={`whitespace-pre-line ${type.body}`}>
                      {directorNote}
                    </p>
                    {directorCredit?.name ? (
                      <p className={`mt-3 ${type.caption}`}>
                        {t('directorNoteAttribution', {
                          name: directorCredit.name,
                          role: directorCredit.role || t('directorRole'),
                        })}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </section>
            ) : null}
          </div>
        </div>
      ) : null}

      {cues.length > 0 ? (
        <section className={`${sectionGap} w-full bg-white`} aria-label={t('transcript')}>
          <div
            className={`mx-auto w-full max-w-[720px] px-6 md:px-10 ${bandPad}`}
          >
            <h2 className={`${col} mb-5 ${type.section}`}>{t('transcript')}</h2>
            <div className={`relative mb-5 ${col}`}>
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
            <div className={`flex flex-col ${col}`}>
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
        </section>
      ) : null}

      {specRows.length > 0 ? (
        <div className="mx-auto w-full max-w-[720px] px-6 pb-14 md:px-10 md:pb-16">
          <section
            className={`${col} ${sectionGap}`}
            aria-label={t('specs')}
          >
            <h2 className={`mb-5 ${type.section}`}>{t('specs')}</h2>
            <ul className="m-0 list-none space-y-2 p-0">
              {specRows.map((row) => (
                <li
                  key={row.label}
                  className="text-left font-sans text-[15px] leading-snug"
                >
                  <span className="font-medium text-black/40">{row.label}</span>
                  <span className="font-medium text-black/70">
                    {' '}
                    {row.value}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : (
        <div className="pb-14 md:pb-16" />
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes sheetIn {
              from { opacity: 0; transform: translateY(8px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .transcript-search::-webkit-search-cancel-button,
            .transcript-search::-webkit-search-decoration {
              -webkit-appearance: none;
              appearance: none;
            }
          `,
        }}
      />

      {lightboxIndex != null ? (
        <ProcessLightbox
          images={processImages}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      ) : null}
    </div>
  );
}
