import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import type { FilmLogEntry } from '@/lib/film-record-actions';

function formatLogDate(iso: string) {
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

export default async function FilmLogsLedger({
  logs,
  emptyHint,
}: {
  logs: FilmLogEntry[];
  emptyHint?: string;
}) {
  const t = await getTranslations('Account');

  return (
    <section className="w-full max-w-sm flex flex-col gap-4 text-left">
      <div className="flex flex-col gap-1">
        <h2 className="font-sans text-[12px] font-semibold uppercase tracking-wide text-white/35">
          {t('filmLogsTitle')}
        </h2>
        <p className="font-sans text-[13px] text-white/40 leading-snug">
          {t('filmLogsBody')}
        </p>
      </div>

      {logs.length === 0 ? (
        <p className="font-sans text-[14px] text-white/45 leading-relaxed">
          {emptyHint || t('filmLogsEmpty')}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-white/8 border-y border-white/8">
          {logs.map((entry) => (
            <li key={`${entry.film_id}-${entry.viewer_number}`}>
              {entry.film_slug ? (
                <Link
                  href={`/film/${entry.film_slug}`}
                  className="flex items-baseline justify-between gap-4 py-3.5 group"
                >
                  <span className="min-w-0 flex flex-col gap-0.5">
                    <span className="font-sans text-[15px] font-semibold text-white/90 group-hover:text-white transition-colors truncate">
                      {entry.film_name}
                    </span>
                    <span className="font-mono text-[12px] text-white/35">
                      {formatLogDate(entry.recorded_at)}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-[13px] text-white/50">
                    {t('viewerNumber', { number: entry.viewer_number })}
                  </span>
                </Link>
              ) : (
                <div className="flex items-baseline justify-between gap-4 py-3.5">
                  <span className="font-sans text-[15px] font-semibold text-white/90 truncate">
                    {entry.film_name}
                  </span>
                  <span className="shrink-0 font-mono text-[13px] text-white/50">
                    {t('viewerNumber', { number: entry.viewer_number })}
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
