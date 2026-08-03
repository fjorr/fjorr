import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import type { FilmLogEntry } from '@/lib/film-record-actions';
import FilmLogBadgeButton from '@/components/FilmLogBadgeButton';
import VoyageurBadgeMark from '@/components/VoyageurBadgeMark';

export default async function FilmLogsLedger({
  logs,
  emptyHint,
  omitHeader = false,
  memberNumber = null,
}: {
  logs: FilmLogEntry[];
  emptyHint?: string;
  /** When the page already shows title + body. */
  omitHeader?: boolean;
  /** When set, badge tap opens share (own Voyages). Public profiles omit this. */
  memberNumber?: number | null;
}) {
  const t = await getTranslations('Account');
  const shareable =
    memberNumber != null && Number.isFinite(memberNumber) && memberNumber >= 1;

  return (
    <section className="w-full flex flex-col gap-6 text-left">
      {!omitHeader ? (
        <div className="flex flex-col gap-1.5">
          <h2 className="font-sans text-[12px] font-semibold uppercase tracking-wide text-page-faint">
            {t('filmLogsTitle')}
          </h2>
          <p className="font-sans text-[13px] text-page-faint leading-snug max-w-2xl">
            {t('filmLogsBody')}
          </p>
          <p className="font-sans text-[12px] italic text-page-faint leading-snug max-w-2xl">
            {t('filmLogsNote')}
          </p>
        </div>
      ) : null}

      {logs.length === 0 ? (
        <p className="font-sans text-[14px] text-page-faint leading-relaxed">
          {emptyHint || t('filmLogsEmpty')}
        </p>
      ) : (
        <ul className="flex flex-col gap-5 list-none m-0 p-0">
          {logs.map((entry) => (
            <li key={`${entry.film_id}-${entry.viewer_number}`}>
              {shareable && entry.film_slug ? (
                <FilmLogBadgeButton
                  filmName={entry.film_name}
                  filmSlug={entry.film_slug}
                  filmPoster={entry.film_poster}
                  viewerNumber={entry.viewer_number}
                  filmVersion={entry.film_version}
                  memberNumber={memberNumber}
                  recordedAt={entry.recorded_at}
                />
              ) : entry.film_slug ? (
                <Link
                  href={`/film/${entry.film_slug}`}
                  className="min-w-0 inline-block hover:opacity-90 transition-opacity"
                >
                  <VoyageurBadgeMark
                    filmName={entry.film_name}
                    filmPoster={entry.film_poster}
                    voyageurNumber={entry.viewer_number}
                    recordedAt={entry.recorded_at}
                  />
                </Link>
              ) : (
                <VoyageurBadgeMark
                  filmName={entry.film_name}
                  filmPoster={entry.film_poster}
                  voyageurNumber={entry.viewer_number}
                  recordedAt={entry.recorded_at}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
