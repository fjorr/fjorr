import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import type { FilmNoteRow } from '@/lib/film-note-actions';
import { formatTimestamp } from '@/lib/film-note-time';

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

export default async function PlusLogsLedger({
  notes,
}: {
  notes: FilmNoteRow[];
}) {
  const t = await getTranslations('Plus');

  if (notes.length === 0) {
    return (
      <p className="font-sans text-[14px] text-white/45 leading-relaxed">
        {t('logsEmpty')}{' '}
        <Link
          href="/plus"
          className="text-white/70 underline underline-offset-2 hover:text-white transition-colors"
        >
          {t('logsEmptyCta')}
        </Link>
        {' · '}
        <Link
          href="/"
          className="text-white/70 underline underline-offset-2 hover:text-white transition-colors"
        >
          {t('logsEmptyWatch')}
        </Link>
      </p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-white/8 border-y border-white/8 list-none m-0 p-0">
      {notes.map((note) => {
        const momentHref =
          note.film_slug && note.at_seconds != null
            ? `/film/${note.film_slug}?t=${Math.floor(note.at_seconds)}`
            : note.film_slug
              ? `/film/${note.film_slug}`
              : null;

        return (
          <li key={note.id} className="flex flex-col gap-1.5 py-3.5">
            <div className="flex items-baseline justify-between gap-4">
              {momentHref ? (
                <Link
                  href={momentHref}
                  className="font-sans text-[15px] font-semibold text-white/90 hover:text-white truncate"
                >
                  {note.film_name || t('unknownFilm')}
                </Link>
              ) : (
                <span className="font-sans text-[15px] font-semibold text-white/90 truncate">
                  {note.film_name || t('unknownFilm')}
                </span>
              )}
              <span className="shrink-0 font-mono text-[12px] text-white/35">
                {formatDate(note.created_at)}
              </span>
            </div>
            {note.at_seconds != null && momentHref ? (
              <Link
                href={momentHref}
                className="font-mono text-[12px] text-white/40 hover:text-white/70 w-fit underline underline-offset-2 decoration-white/20 hover:decoration-white/40 transition-colors"
              >
                {t('atTime', { time: formatTimestamp(note.at_seconds) })}
              </Link>
            ) : note.at_seconds != null ? (
              <span className="font-mono text-[12px] text-white/40">
                {t('atTime', { time: formatTimestamp(note.at_seconds) })}
              </span>
            ) : null}
            <p className="font-sans text-[14px] text-white/55 leading-snug">
              {note.body}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
