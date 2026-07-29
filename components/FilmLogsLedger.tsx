import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import type { FilmLogEntry } from '@/lib/film-record-actions';
import FilmLogShareButton from '@/components/FilmLogShareButton';

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
  omitHeader = false,
  memberNumber,
}: {
  logs: FilmLogEntry[];
  emptyHint?: string;
  /** When the page already shows title + body. */
  omitHeader?: boolean;
  /** Member # for Voyageur meta — same for every row in this ledger. */
  memberNumber?: number | null;
}) {
  const t = await getTranslations('Account');

  return (
    <section className="w-full max-w-sm flex flex-col gap-4 text-left">
      {!omitHeader ? (
        <div className="flex flex-col gap-1">
          <h2 className="font-sans text-[12px] font-semibold uppercase tracking-wide text-white/35">
            {t('filmLogsTitle')}
          </h2>
          <p className="font-sans text-[13px] text-white/40 leading-snug">
            {t('filmLogsBody')}
          </p>
        </div>
      ) : null}

      {logs.length === 0 ? (
        <p className="font-sans text-[14px] text-white/45 leading-relaxed">
          {emptyHint || t('filmLogsEmpty')}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-white/8 border-y border-white/8">
          {logs.map((entry) => {
            const date = formatLogDate(entry.recorded_at);
            return (
              <li key={`${entry.film_id}-${entry.viewer_number}`}>
                <div className="flex items-start justify-between gap-3 py-4">
                  <div className="min-w-0 flex flex-col gap-1.5 flex-1">
                    {entry.film_slug ? (
                      <Link
                        href={`/film/${entry.film_slug}`}
                        className="font-sans text-[15px] font-semibold text-white/90 hover:text-white transition-colors truncate"
                      >
                        {entry.film_name}
                      </Link>
                    ) : (
                      <span className="font-sans text-[15px] font-semibold text-white/90 truncate">
                        {entry.film_name}
                      </span>
                    )}
                    <p className="font-mono text-[13px] font-medium text-white/70 tabular-nums tracking-tight">
                      {t('voyageurLine', { number: entry.viewer_number })}
                    </p>
                    {memberNumber != null && date ? (
                      <p className="font-mono text-[11px] text-white/35 tabular-nums">
                        {t('voyageurMeta', {
                          member: memberNumber,
                          date,
                        })}
                      </p>
                    ) : date ? (
                      <p className="font-mono text-[11px] text-white/35 tabular-nums">
                        {date}
                      </p>
                    ) : null}
                  </div>
                  {entry.film_slug ? (
                    <FilmLogShareButton
                      filmName={entry.film_name}
                      filmSlug={entry.film_slug}
                      viewerNumber={entry.viewer_number}
                    />
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
