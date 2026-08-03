'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
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

function formatNoteDate(
  iso: string,
  locale: string,
  style: 'short' | 'monthDay' = 'short'
) {
  try {
    if (style === 'monthDay') {
      return new Intl.DateTimeFormat(locale, {
        month: 'short',
        day: 'numeric',
      }).format(new Date(iso));
    }
    return new Intl.DateTimeFormat(locale, {
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
      : 'w-[80px] aspect-video rounded-[4px]';
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
      width={size === 'lg' ? 320 : 80}
      height={size === 'lg' ? 180 : 45}
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
  return `+M-${hex}`;
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
    <span className="inline-flex items-center rounded-[5px] bg-page-chip px-2.5 py-1 font-sans text-[13px] font-medium tracking-normal text-page">
      {label}
    </span>
  );
}

function RowPlus() {
  return (
    <svg
      className="w-3.5 h-3.5 shrink-0 text-page-faint"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function CloseButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      aria-label={label}
      className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full text-page-muted hover:text-page hover:bg-[color-mix(in_srgb,var(--page-fg)_8%,transparent)] transition-colors"
    >
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        aria-hidden
      >
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    </button>
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
    <div className="w-full max-w-[550px] flex flex-col gap-4">
      {noteFrameSrc(entry, 'lg') ? (
        momentHref ? (
          <Link
            href={momentHref}
            onClick={(e) => e.stopPropagation()}
            className="block w-fit hover:opacity-90 transition-opacity"
          >
            <FrameThumb src={noteFrameSrc(entry, 'lg')} size="lg" />
          </Link>
        ) : (
          <FrameThumb src={noteFrameSrc(entry, 'lg')} size="lg" />
        )
      ) : null}

      <p className="m-0 font-sans text-[15px] font-medium text-page leading-relaxed whitespace-pre-wrap">
        {entry.body}
      </p>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          void copyTicket();
        }}
        className="self-start font-sans text-[13px] font-medium text-page-muted hover:text-page transition-colors tabular-nums"
      >
        {copied ? t('ticketCopied') : ticket}
      </button>
    </div>
  );
}

function NoteOpenCard({
  entry,
  onClose,
  closeLabel,
}: {
  entry: FilmNoteRow;
  onClose: () => void;
  closeLabel: string;
}) {
  const t = useTranslations('Plus');
  const locale = useLocale();
  const date = formatNoteDate(entry.created_at, locale);
  const tc = formatTc(entry.at_seconds);
  const cut = formatFilmVersionLabel(entry.film_version);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClose();
        }
      }}
      className="relative rounded-[12px] bg-page-chip p-10 flex flex-col gap-4 cursor-pointer text-left"
    >
      <div className="absolute top-4 right-4">
        <CloseButton onClick={onClose} label={closeLabel} />
      </div>
      <div className="min-w-0 flex flex-wrap items-center gap-x-3 gap-y-2 pr-8">
        <StatusStamp label={t(statusKey(entry.status))} />
        <span className="font-sans text-[13px] text-page-muted truncate">
          {entry.film_name || t('unknownFilm')}
        </span>
        <span className="font-sans text-[13px] text-page-muted tabular-nums">
          {tc}
        </span>
        <span className="font-sans text-[13px] text-page-muted tabular-nums">
          {cut}
        </span>
        <span className="font-sans text-[13px] text-page-muted">{date}</span>
      </div>
      <NoteExpanded entry={entry} />
    </div>
  );
}

export default function PlusLogsLedger({
  notes,
}: {
  notes: FilmNoteRow[];
}) {
  const t = useTranslations('Plus');
  const locale = useLocale();
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

  // CTAs live in the page header (AccountShell).
  if (notes.length === 0) {
    return (
      <p className="font-sans text-[14px] text-page-faint leading-relaxed">
        {t('logsEmpty')}
      </p>
    );
  }

  return (
    <section className="w-full flex flex-col gap-5 text-left">
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

      {filtered.length === 0 ? (
        <p className="font-sans text-[14px] text-page-faint leading-relaxed">
          {t('logsFilterEmpty')}
        </p>
      ) : (
        <AccountViewportSwitch
          mobile={
          <ul className="flex flex-col border-y border-page-faint list-none m-0 p-0">
            {filtered.map((entry, i) => {
              const date = formatNoteDate(entry.created_at, locale);
              const open = openId === entry.id;
              const nextOpen =
                i < filtered.length - 1 && filtered[i + 1].id === openId;
              const tc = formatTc(entry.at_seconds);
              const cut = formatFilmVersionLabel(entry.film_version);
              return (
                <li
                  key={entry.id}
                  className={`py-1.5${
                    !open && !nextOpen && i < filtered.length - 1
                      ? ' border-b border-page-faint'
                      : ''
                  }`}
                >
                  {open ? (
                    <NoteOpenCard
                      entry={entry}
                      onClose={() => setOpenId(null)}
                      closeLabel={t('logsClose')}
                    />
                  ) : (
                    <div
                      role="button"
                      tabIndex={0}
                      aria-expanded={false}
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
                            <p className="font-sans text-[13px] font-medium text-page leading-snug min-w-0 truncate">
                              {notePreview(entry.body, 72)}
                            </p>
                            <span className="shrink-0 font-sans text-[13px] text-page-muted tabular-nums">
                              {noteTicket(entry.id)}
                            </span>
                          </div>
                          <p className="font-sans text-[13px] text-page-muted leading-snug truncate">
                            {entry.film_name || t('unknownFilm')}
                            {' · '}
                            {cut}
                          </p>
                          <div className="flex items-center gap-3">
                            <StatusStamp label={t(statusKey(entry.status))} />
                            <span className="min-w-0 flex-1 font-sans text-[13px] text-page-muted tabular-nums truncate">
                              {tc}
                              {' · '}
                              {date}
                            </span>
                            <RowPlus />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          }
          desktop={
          <div className="w-full">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr
                  className={
                    filtered[0] && openId === filtered[0].id
                      ? undefined
                      : 'border-b border-page-faint'
                  }
                >
                  <th className="w-[1%] whitespace-nowrap pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-page-faint">
                    {t('logsColFrame')}
                  </th>
                  <th className="pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-page-faint">
                    {t('logsColNote')}
                  </th>
                  <th className="w-[1%] whitespace-nowrap pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-page-faint">
                    {t('logsColStatus')}
                  </th>
                  <th className="pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-page-faint">
                    {t('logsColFilm')}
                  </th>
                  <th className="w-[1%] whitespace-nowrap pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-page-faint">
                    {t('logsColTc')}
                  </th>
                  <th className="w-[1%] whitespace-nowrap pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-page-faint">
                    {t('logsColCut')}
                  </th>
                  <th className="w-[1%] whitespace-nowrap pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-page-faint">
                    {t('logsColLogged')}
                  </th>
                  <th className="w-[1%] whitespace-nowrap pb-2.5 pr-3 font-sans text-[11px] font-medium text-page-faint">
                    {t('logsColTicket')}
                  </th>
                  <th
                    className="w-[1%] whitespace-nowrap pb-2.5 pl-1"
                    aria-hidden
                  />
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry, i) => {
                  const date = formatNoteDate(entry.created_at, locale);
                  const open = openId === entry.id;
                  const nextOpen =
                    i < filtered.length - 1 && filtered[i + 1].id === openId;
                  const tc = formatTc(entry.at_seconds);
                  const cut = formatFilmVersionLabel(entry.film_version);
                  const momentHref =
                    entry.film_slug && entry.at_seconds != null
                      ? `/film/${entry.film_slug}?t=${Math.floor(entry.at_seconds)}`
                      : entry.film_slug
                        ? `/film/${entry.film_slug}`
                        : null;

                  return open ? (
                    <tr key={entry.id}>
                      <td colSpan={9} className="py-2">
                        <NoteOpenCard
                          entry={entry}
                          onClose={() => setOpenId(null)}
                          closeLabel={t('logsClose')}
                        />
                      </td>
                    </tr>
                  ) : (
                    <tr
                      key={entry.id}
                      className={`${
                        nextOpen ? '' : 'border-b border-page-faint '
                      }hover:bg-page-chip transition-colors cursor-pointer`}
                      onClick={() => toggle(entry.id)}
                      aria-expanded={false}
                    >
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
                      <td className="py-3.5 pr-4 xl:pr-6 align-middle min-w-0">
                        <span className="font-sans text-[13px] font-medium text-page truncate block max-w-md">
                          {notePreview(entry.body)}
                        </span>
                      </td>
                      <td className="w-[1%] whitespace-nowrap py-3.5 pr-4 xl:pr-6 align-middle text-left">
                        <StatusStamp label={t(statusKey(entry.status))} />
                      </td>
                      <td className="py-3.5 pr-4 xl:pr-6 align-middle min-w-0">
                        <span className="font-sans text-[13px] text-page-muted truncate block max-w-[12rem]">
                          {entry.film_name || t('unknownFilm')}
                        </span>
                      </td>
                      <td className="w-[1%] whitespace-nowrap py-3.5 pr-4 xl:pr-6 align-middle">
                        {momentHref && entry.at_seconds != null ? (
                          <Link
                            href={momentHref}
                            onClick={(e) => e.stopPropagation()}
                            className="font-sans text-[13px] text-page-muted hover:text-page tabular-nums transition-colors"
                          >
                            {tc}
                          </Link>
                        ) : (
                          <span className="font-sans text-[13px] text-page-muted tabular-nums">
                            {tc}
                          </span>
                        )}
                      </td>
                      <td className="w-[1%] whitespace-nowrap py-3.5 pr-4 xl:pr-6 align-middle">
                        <span className="font-sans text-[13px] text-page-muted tabular-nums">
                          {cut}
                        </span>
                      </td>
                      <td className="w-[1%] whitespace-nowrap py-3.5 pr-4 xl:pr-6 align-middle">
                        <span className="font-sans text-[13px] text-page-muted">
                          {date}
                        </span>
                      </td>
                      <td className="w-[1%] whitespace-nowrap py-3.5 pr-3 align-middle">
                        <span className="font-sans text-[13px] text-page-muted tabular-nums">
                          {noteTicket(entry.id)}
                        </span>
                      </td>
                      <td className="w-[1%] whitespace-nowrap py-3.5 pl-1 align-middle">
                        <RowPlus />
                      </td>
                    </tr>
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
