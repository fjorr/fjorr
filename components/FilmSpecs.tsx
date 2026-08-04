'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import VoyageurBadgeLoader from '@/components/VoyageurBadgeLoader';
import { Link } from '@/i18n/navigation';

const FilmTranscript = dynamic(() => import('./FilmTranscript'), {
  ssr: false,
  loading: () => (
    <div className="mt-2 h-8 w-28 rounded bg-page-chip/60 animate-pulse" aria-hidden />
  ),
});

interface TranscriptRow {
  language_code: string;
  content: string;
}

interface CreatorMapRow {
  role: string;
  role_code?: string | null;
  creator: {
    name: string;
  } | null;
}

interface FilmSpecsProps {
  film: any;
  audioLanguages: string[];
  subtitles: Array<{ name: string; code: string; vtt_url?: string }>;
  tags: string[];
  creators?: CreatorMapRow[];
  onSeek?: (seconds: number) => void;
  /** Opens theater in Plus mode (or join Bureaux). */
  onOpenPlus?: () => void;
  /** When false, CTA sends people to join rather than open Plus. */
  plusMember?: boolean;
}

function SpecRow({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: React.ReactNode;
  emphasize?: boolean;
}) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] sm:grid-cols-[8.5rem_1fr] gap-x-3 items-baseline text-sm">
      <span className="text-page-faint font-medium">{label}</span>
      <span className={emphasize ? 'text-page font-semibold' : 'text-page font-medium'}>
        {value}
      </span>
    </div>
  );
}

/** Playbill line — name leads; role is the quiet label beside it. */
function CreditRow({ name, role }: { name: string; role: string }) {
  return (
    <p className="text-sm leading-snug tracking-tight">
      <span className="text-page font-semibold">{name}</span>{' '}
      <span className="text-page-faint font-medium">{role}</span>
    </p>
  );
}

function isDirectorCredit(row: CreatorMapRow) {
  if (row.role_code === 'director') return true;
  return /^director$/i.test(String(row.role || '').trim());
}

export default function FilmSpecs({
  film,
  audioLanguages,
  subtitles,
  tags,
  creators = [],
  onSeek,
  onOpenPlus,
  plusMember = false,
}: FilmSpecsProps) {
  const t = useTranslations('Film');
  const releaseYear = film.release_date ? new Date(film.release_date).getFullYear() : '2026';
  const storyYear =
    typeof film.story_date === 'object'
      ? film.story_date?.name
      : film.story_date || film.story_year || null;
  const displayRuntime = film.runtime
    ? t('runtimeMin', { n: Math.ceil(film.runtime / 60) })
    : t('runtimeMin', { n: 1 });
  const displayRating = film.rating?.name ? t('ages', { n: film.rating.name }) : t('agesFallback');
  const [transcripts, setTranscripts] = useState<TranscriptRow[]>([]);

  const inviteLinkClass =
    'font-semibold text-page-muted underline underline-offset-4 decoration-[color-mix(in_srgb,var(--page-fg)_22%,transparent)] hover:text-page hover:decoration-[color-mix(in_srgb,var(--page-fg)_40%,transparent)] transition-colors';

  useEffect(() => {
    if (!film?.id || subtitles.length === 0) return;
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from('transcript')
      .select('content, language_code')
      .eq('film_id', film.id)
      .then(({ data }: { data: TranscriptRow[] | null }) => {
        if (!cancelled && data) setTranscripts(data);
      });
    return () => {
      cancelled = true;
    };
  }, [film?.id, subtitles.length]);

  const hasTranscript = subtitles.length > 0;

  const placeLine = [film.story_date, film.location].filter(Boolean).join(' · ');
  const directorNote =
    typeof film.director_note === 'string' ? film.director_note.trim() : '';
  const directorCredits = creators.filter(
    (row) => isDirectorCredit(row) && row.creator?.name?.trim()
  );
  const directorNames = directorCredits
    .map((row) => row.creator!.name.trim())
    .filter(Boolean);
  const directorRoleLabel =
    directorCredits[0]?.role?.trim() || t('directorRole');

  return (
    <div className="w-full max-w-3xl px-8 md:px-12 mx-auto text-left text-page font-sans select-none relative z-20">
      {/* Story leads — no About heading */}
      <div className="pb-8 border-b border-[color-mix(in_srgb,var(--page-fg)_6%,transparent)]">
        <p className="text-base md:text-[17px] leading-relaxed text-page font-medium opacity-90 max-w-3xl">
          {film.description}
        </p>

        {(placeLine || film.note) && (
          <p className="mt-3 text-sm font-medium text-page-faint">
            {placeLine}
            {placeLine && film.note ? ' · ' : null}
            {film.note ? <span className="font-normal">{film.note}</span> : null}
          </p>
        )}

        {film?.id && film?.slug ? (
          <VoyageurBadgeLoader
            filmId={String(film.id)}
            filmName={String(film.name || '')}
            filmSlug={String(film.slug)}
            filmPoster={film.blok_tall || film.hero_tall || null}
            plusMember={plusMember}
          />
        ) : null}

        {directorNote.length > 0 && (
          <div className="mt-6 max-w-2xl">
            <h3 className="text-[13px] font-medium text-page-faint mb-2 tracking-tight">
              {t('directorNote')}
            </h3>
            <p className="text-base leading-relaxed text-page-muted font-medium whitespace-pre-line">
              {directorNote}
            </p>
            {directorNames.length > 0 ? (
              <p className="mt-3 text-[13px] sm:text-[14px] font-medium text-page-faint tracking-tight">
                {t('directorNoteAttribution', {
                  name: directorNames.join(' & '),
                  role: directorRoleLabel,
                })}
              </p>
            ) : null}
          </div>
        )}

        {hasTranscript && (
          <div className="mt-5">
            <FilmTranscript
              subtitles={subtitles}
              transcripts={transcripts}
              filmSlug={film.slug}
              onSeek={onSeek}
            />
          </div>
        )}
      </div>

      {/* Credits + Details — name-first credits; facts stay label → value */}
      <div className="pt-8 max-w-2xl">
        {creators.length > 0 ? (
          <div>
            <h3 className="text-[13px] font-medium text-page-faint mb-3 tracking-tight">
              {t('creditsLabel')}
            </h3>
            <div className="flex flex-col gap-2.5">
              {creators.map((item, idx) => (
                <CreditRow
                  key={idx}
                  name={item.creator?.name || t('unknownCreator')}
                  role={item.role}
                />
              ))}
            </div>
          </div>
        ) : null}

        {onOpenPlus ? (
          <p
            className={`${
              creators.length > 0 ? 'mt-5' : 'mb-6'
            } text-[13px] text-page-faint leading-snug max-w-2xl`}
          >
            {plusMember ? t('plusInviteMember') : t('plusInvite')}{' '}
            {plusMember ? (
              <span className="whitespace-nowrap">
                <button type="button" onClick={onOpenPlus} className={inviteLinkClass}>
                  {t('plusInviteCta')}
                </button>
                <span className="text-page-faint/80" aria-hidden>
                  {' · '}
                </span>
                <Link href="/manual/plus" className={inviteLinkClass}>
                  {t('plusInviteInfo')}
                </Link>
              </span>
            ) : (
              <Link href="/manual/plus" className={inviteLinkClass}>
                {t('plusInviteInfo')}
              </Link>
            )}
          </p>
        ) : null}

        <div
          className={`${
            creators.length > 0
              ? 'mt-6 pt-6 border-t border-[color-mix(in_srgb,var(--page-fg)_6%,transparent)]'
              : ''
          }`}
        >
          <h3 className="text-[13px] font-medium text-page-faint mb-3 tracking-tight">
            {t('detailsLabel')}
          </h3>
          <div className="flex flex-col gap-2">
          <SpecRow label={t('runtimeLabel')} value={displayRuntime} />
          <SpecRow label={t('ratingLabel')} value={displayRating} />
          <SpecRow label={t('releasedLabel')} value={releaseYear} />
          {storyYear ? (
            <SpecRow label={t('storyYearLabel')} value={String(storyYear)} />
          ) : null}
          {audioLanguages.length > 0 ? (
            <SpecRow label={t('audioLabel')} value={audioLanguages.join(', ')} />
          ) : null}
          {subtitles.length > 0 ? (
            <SpecRow
              label={t('subtitlesLabel')}
              value={subtitles.map((s) => s.name).join(', ')}
            />
          ) : null}
          {tags.length > 0 ? (
            <SpecRow
              label={t('tagsLabel')}
              value={tags
                .map((tag) => tag.charAt(0).toUpperCase() + tag.slice(1))
                .join(', ')}
            />
          ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
