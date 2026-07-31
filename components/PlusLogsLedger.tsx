'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import AccountViewportSwitch from '@/components/AccountViewportSwitch';
import { filmNoteFrameUrl } from '@/lib/film-note-frame';
import type { FilmNoteRow, FilmNoteStatus } from '@/lib/film-note-types';
import { formatFilmVersionLabel } from '@/lib/film-version';

type StatusFilter = 'all' | FilmNoteStatus;

function noteFrameSrc(entry: FilmNoteRow, size: 'sm' | 'lg' = 'sm') {
  if (size === 'lg') {
    return (
      entry.frame_url_lg ||
      filmNoteFrameUrl(entry.mux_playback_id, entry.at_seconds, 'lg')
    );
  }
  return (
    entry.frame_url ||
    filmNoteFrameUrl(entry.mux_playback_id, entry.at_seconds, 'sm')
  );
}

function formatNoteDate(iso: string, style: 'short' | 'monthDay' = 'short') {
  try {
    if (style === 'monthDay') {
      return new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
      }).format(new Date(iso));
    }
    return new Intl.DateTimeFormat('en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

/** Machine TC — always HH:MM:SS. */
function formatTc(seconds: number | null): string {
  if (seconds == null) return '—';
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function FrameThumb({
  src,
  size = 'sm',
}: {
  src: string | null;
  size?: 'sm' | 'lg';
}) {
  const shell =
    size === 'lg'
      ? 'w-full max-w-[320px] aspect-video rounded-[8px]'
      : 'w-[72px] h-[40px] rounded-[4px]';
  const ring =
    'bg-black ring-1 ring-inset ring-[color-mix(in_srgb,var(--page-fg)_18%,transparent)]';

  if (!src) {
    return <span aria-hidden className={`block shrink-0 ${ring} ${shell}`} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size === 'lg' ? 320 : 72}
      height={size === 'lg' ? 180 : 40}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className={`object-cover shrink-0 ${ring} ${shell}`}
    />
  );
}

/** Short desk ticket from note id. */
function noteTicket(id: string): string {
  const hex = id.replace(/-/g, '').slice(0, 8).toUpperCase();
  return `P-${hex}`;
}

function notePreview(body: string, max = 56) {
  const cleaned = body.trim().replace(/\s+/g, ' ');
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trimEnd()}…`;
}

function statusKey(status: FilmNoteStatus) {
  switch (status) {
    case 'read':
      return 'statusRead';
    case 'archived':
      return 'statusPatched';
    default:
      return 'statusQueued';
  }
}

function StatusStamp({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-[5px] bg-page-chip px-2 py-[3px] font-mono text-[11px] font-medium tracking-[0.04em] text-page">
      {label}
    </span>
  );
}

function AccordionChevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-3.5 h-3.5 shrink-0 text-page-faint transition-transform duration-200 ${
        open ? 'rotate-180' : 'rotate-0'
      }`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 text-left">
      <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-page-faint leading-none">
        {label}
      </span>
      <div className="font-sans text-[14px] text-page-muted leading-relaxed whitespace-pre-wrap">
        {children}
      </div>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  label,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  children: React.ReactNode;
}) {
  const dirty = value !== 'all';
  return (
    <div className="inline-flex shrink-0 items-center gap-0.5 rounded-[8px] p-0.5 bg-page-chip">
      <label className="relative inline-flex items-center min-w-0">
        <span className="sr-only">{label}</span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`appearance-none h-8 max-w-[11rem] rounded-[6px] pl-2.5 sm:pl-3 pr-7 font-sans text-xs font-semibold transition-colors cursor-pointer focus:outline-none focus:ring-0 ${
            dirty
              ? 'bg-page-chip-active text-page'
              : 'bg-transparent text-page-faint hover:text-page-muted'
          }`}
        >
          {children}
        </select>
        <svg
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-page-faint"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </label>
    </div>
  );
}

function NoteExpanded({ entry }: { entry: FilmNoteRow }) {
  const t = useTranslations('Plus');
  const [copied, setCopied] = useState(false);
  const ticket = noteTicket(entry.id);
  const tc = formatTc(entry.at_seconds);
  const cut = formatFilmVersionLabel(entry.film_version);
  const momentHref =
    entry.film_slug && entry.at_seconds != null
      ? `/film/${entry.film_slug}?t=${Math.floor(entry.at_seconds)}`
      : entry.film_slug
        ? `/film/${entry.film_slug}`
        : null;

  useEffect(() => {
    setCopied(false);
  }, [entry.id]);

  const copyTicket = async () => {
    try {
      await navigator.clipboard.writeText(ticket);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="w-full max-w-[550px] pt-1 pb-5 flex flex-col gap-5">
      <button
        type="button"
        onClick={() => void copyTicket()}
        className="self-start font-mono text-[12px] font-medium tracking-[0.06em] text-page-muted hover:text-page-muted transition-colors tabular-nums"
      >
        {copied ? t('ticketCopied') : ticket}
      </button>

      <div className="flex flex-col gap-5">
        {noteFrameSrc(entry, 'lg') ? (
          <DetailField label={t('logsColFrame')}>
            {momentHref ? (
              <Link
                href={momentHref}
                onClick={(e) => e.stopPropagation()}
                className="block w-fit hover:opacity-90 transition-opacity"
              >
                <FrameThumb src={noteFrameSrc(entry, 'lg')} size="lg" />
              </Link>
            ) : (
              <FrameThumb src={noteFrameSrc(entry, 'lg')} size="lg" />
            )}
          </DetailField>
        ) : null}
        <DetailField label={t('logsColLogged')}>
          {formatNoteDate(entry.created_at)}
        </DetailField>
        <DetailField label={t('logsColCut')}>
          <span className="font-mono">{cut}</span>
        </DetailField>
        <DetailField label={t('logsColTc')}>
          {momentHref && entry.at_seconds != null ? (
            <Link
              href={momentHref}
              className="font-mono text-[14px] text-page-muted underline underline-offset-2 hover:text-page"
              onClick={(e) => e.stopPropagation()}
            >
              {tc}
            </Link>
          ) : (
            <span className="font-mono">{tc}</span>
          )}
        </DetailField>
        <DetailField label={t('logsColFilm')}>
          {momentHref ? (
            <Link
              href={momentHref}
              className="text-page-muted underline underline-offset-2 hover:text-page"
              onClick={(e) => e.stopPropagation()}
            >
              {entry.film_name || t('unknownFilm')}
            </Link>
          ) : (
            entry.film_name || t('unknownFilm')
          )}
        </DetailField>
        <DetailField label={t('logsColStatus')}>
          {t(statusKey(entry.status))}
        </DetailField>
        <DetailField label={t('logsColNote')}>{entry.body}</DetailField>
      </div>
    </div>
  );
}

export default function PlusLogsLedger({
  notes,
}: {
  notes: FilmNoteRow[];
}) {
  const t = useTranslations('Plus');
  const [openId, setOpenId] = useState<string | null>(null);
  const [filmFilter, setFilmFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filmOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const note of notes) {
      if (!map.has(note.film_id)) {
        map.set(note.film_id, note.film_name || t('unknownFilm'));
      }
    }
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [notes, t]);

  const queuedCount = useMemo(
    () => notes.filter((n) => n.status === 'new').length,
    [notes]
  );

  const filtered = useMemo(() => {
    return notes.filter((n) => {
      if (filmFilter !== 'all' && n.film_id !== filmFilter) return false;
      if (statusFilter !== 'all' && n.status !== statusFilter) return false;
      return true;
    });
  }, [notes, filmFilter, statusFilter]);

  useEffect(() => {
    if (openId == null) return;
    if (!filtered.some((n) => n.id === openId)) setOpenId(null);
  }, [filtered, openId]);

  useEffect(() => {
    if (openId == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenId(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openId]);

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  // Empty copy + CTAs live in the page header (AccountShell).
  if (notes.length === 0) return null;

  return (
    <section className="w-full flex flex-col gap-5 text-left">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[12px] text-page-faint tabular-nums tracking-[0.02em]">
          {t('logsCount', { count: notes.length, unread: queuedCount })}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            label={t('logsFilterFilm')}
            value={filmFilter}
            onChange={setFilmFilter}
          >
            <option value="all">{t('logsFilterAllFilms')}</option>
            {filmOptions.map((film) => (
              <option key={film.id} value={film.id}>
                {film.name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            label={t('logsFilterStatus')}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <option value="all">{t('logsFilterAllStatuses')}</option>
            <option value="new">{t('statusQueued')}</option>
            <option value="read">{t('statusRead')}</option>
            <option value="archived">{t('statusPatched')}</option>
          </FilterSelect>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="font-sans text-[14px] text-page-faint leading-relaxed">
          {t('logsFilterEmpty')}
        </p>
      ) : (
        <AccountViewportSwitch
          mobile={
          <ul className="flex flex-col divide-y divide-page-faint border-y border-page-faint list-none m-0 p-0">
            {filtered.map((entry) => {
              const date = formatNoteDate(entry.created_at, 'monthDay');
              const open = openId === entry.id;
              const tc = formatTc(entry.at_seconds);
              const cut = formatFilmVersionLabel(entry.film_version);
              return (
                <li key={entry.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    aria-expanded={open}
                    onClick={() => toggle(entry.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggle(entry.id);
                      }
                    }}
                    className="w-full py-3.5 flex flex-col gap-2 text-left cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <FrameThumb src={noteFrameSrc(entry)} />
                      <div className="min-w-0 flex-1 flex flex-col gap-2">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="font-sans text-[13px] font-semibold text-page leading-snug min-w-0 truncate">
                            {entry.film_name || t('unknownFilm')}
                            <span className="ml-2 font-mono text-[11px] font-medium text-page-faint">
                              {cut}
                            </span>
                          </p>
                          <span className="shrink-0 font-mono text-[11px] text-page-faint tabular-nums">
                            {noteTicket(entry.id)}
                          </span>
                        </div>
                        <p className="font-sans text-[13px] text-page-muted leading-snug">
                          {notePreview(entry.body, 72)}
                        </p>
                        <div className="flex items-center gap-3">
                          <StatusStamp label={t(statusKey(entry.status))} />
                          <span className="min-w-0 flex-1 font-mono text-[11px] text-page-faint tabular-nums truncate">
                            {tc}
                            {' · '}
                            {date}
                          </span>
                          <AccordionChevron open={open} />
                        </div>
                      </div>
                    </div>
                  </div>
                  {open ? <NoteExpanded entry={entry} /> : null}
                </li>
              );
            })}
          </ul>
          }
          desktop={
          <div className="w-full">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-page-faint">
                  <th className="w-[1%] whitespace-nowrap pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-page-faint">
                    {t('logsColLogged')}
                  </th>
                  <th className="w-[1%] whitespace-nowrap pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-page-faint">
                    {t('logsColTicket')}
                  </th>
                  <th className="w-[1%] whitespace-nowrap pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-page-faint">
                    {t('logsColFrame')}
                  </th>
                  <th className="w-[1%] whitespace-nowrap pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-page-faint">
                    {t('logsColTc')}
                  </th>
                  <th className="w-[1%] whitespace-nowrap pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-page-faint">
                    {t('logsColCut')}
                  </th>
                  <th className="pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-page-faint">
                    {t('logsColFilm')}
                  </th>
                  <th className="pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-page-faint">
                    {t('logsColNote')}
                  </th>
                  <th className="w-[1%] whitespace-nowrap pb-2.5 pr-3 font-sans text-[11px] font-medium text-page-faint">
                    {t('logsColStatus')}
                  </th>
                  <th
                    className="w-[1%] whitespace-nowrap pb-2.5 pl-1"
                    aria-hidden
                  />
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => {
                  const date = formatNoteDate(entry.created_at, 'monthDay');
                  const open = openId === entry.id;
                  const tc = formatTc(entry.at_seconds);
                  const cut = formatFilmVersionLabel(entry.film_version);
                  const momentHref =
                    entry.film_slug && entry.at_seconds != null
                      ? `/film/${entry.film_slug}?t=${Math.floor(entry.at_seconds)}`
                      : entry.film_slug
                        ? `/film/${entry.film_slug}`
                        : null;

                  return (
                    <React.Fragment key={entry.id}>
                      <tr
                        className="border-b border-page-faint hover:bg-page-chip transition-colors cursor-pointer"
                        onClick={() => toggle(entry.id)}
                        aria-expanded={open}
                      >
                        <td className="w-[1%] whitespace-nowrap py-3.5 pr-4 xl:pr-6 align-middle">
                          <span className="font-sans text-[13px] text-page-muted">
                            {date}
                          </span>
                        </td>
                        <td className="w-[1%] whitespace-nowrap py-3.5 pr-4 xl:pr-6 align-middle">
                          <span className="font-mono text-[12px] text-page-faint tabular-nums tracking-[0.04em]">
                            {noteTicket(entry.id)}
                          </span>
                        </td>
                        <td className="w-[1%] whitespace-nowrap py-3.5 pr-4 xl:pr-6 align-middle">
                          {momentHref && noteFrameSrc(entry) ? (
                            <Link
                              href={momentHref}
                              onClick={(e) => e.stopPropagation()}
                              className="block w-fit"
                            >
                              <FrameThumb src={noteFrameSrc(entry)} />
                            </Link>
                          ) : (
                            <FrameThumb src={noteFrameSrc(entry)} />
                          )}
                        </td>
                        <td className="w-[1%] whitespace-nowrap py-3.5 pr-4 xl:pr-6 align-middle">
                          {momentHref && entry.at_seconds != null ? (
                            <Link
                              href={momentHref}
                              onClick={(e) => e.stopPropagation()}
                              className="font-mono text-[13px] text-page-muted hover:text-page-muted tabular-nums tracking-[0.02em] transition-colors"
                            >
                              {tc}
                            </Link>
                          ) : (
                            <span className="font-mono text-[13px] text-page-faint tabular-nums tracking-[0.02em]">
                              {tc}
                            </span>
                          )}
                        </td>
                        <td className="w-[1%] whitespace-nowrap py-3.5 pr-4 xl:pr-6 align-middle">
                          <span className="font-mono text-[12px] text-page-muted tabular-nums">
                            {cut}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4 xl:pr-6 align-middle min-w-0">
                          <span className="font-sans text-[13px] font-medium text-page truncate block max-w-[12rem]">
                            {entry.film_name || t('unknownFilm')}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4 xl:pr-6 align-middle min-w-0">
                          <span className="font-sans text-[13px] text-page-muted truncate block max-w-md">
                            {notePreview(entry.body)}
                          </span>
                        </td>
                        <td className="w-[1%] whitespace-nowrap py-3.5 pr-3 align-middle text-left">
                          <StatusStamp label={t(statusKey(entry.status))} />
                        </td>
                        <td className="w-[1%] whitespace-nowrap py-3.5 pl-1 align-middle">
                          <AccordionChevron open={open} />
                        </td>
                      </tr>
                      {open ? (
                        <tr className="border-b border-page-faint">
                          <td colSpan={9} className="px-0 pt-2 pb-0">
                            <NoteExpanded entry={entry} />
                          </td>
                        </tr>
                      ) : null}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          }
        />
      )}
    </section>
  );
}
