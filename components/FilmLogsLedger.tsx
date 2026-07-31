import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import type { FilmLogEntry } from '@/lib/film-record-actions';
import FilmLogShareButton from '@/components/FilmLogShareButton';

function formatLogDate(iso: string, style: 'short' | 'monthDay' = 'short') {
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

function formatFilmYear(iso: string | null) {
  if (!iso) return '—';
  const y = new Date(iso).getFullYear();
  return Number.isFinite(y) ? String(y) : '—';
}

function formatRuntimeMin(seconds: number | null, label: (n: number) => string) {
  if (!seconds || seconds <= 0) return '—';
  return label(Math.max(1, Math.ceil(seconds / 60)));
}

function FilmMark({
  name,
  poster,
}: {
  name: string;
  poster: string | null;
}) {
  const letter = (name.trim().charAt(0) || 'F').toUpperCase();
  if (poster) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={poster}
        alt=""
        className="w-7 h-10 rounded-[4px] object-contain bg-white/5 shrink-0"
      />
    );
  }
  return (
    <span
      aria-hidden
      className="w-7 h-10 rounded-[4px] bg-white/10 text-white/70 font-sans text-[12px] font-semibold flex items-center justify-center shrink-0"
    >
      {letter}
    </span>
  );
}

/** Quiet stamp — Voyageur No. reads as a mark, not a data cell. */
function VoyageurStamp({
  label,
  versionLabel,
  changelog,
}: {
  label: string;
  versionLabel: string;
  changelog?: string | null;
}) {
  return (
    <div className="inline-flex flex-col items-start gap-1">
      <span className="inline-flex items-center rounded-[5px] bg-[color-mix(in_srgb,white_9%,transparent)] px-2 py-[3px] font-mono text-[11px] font-medium tracking-[0.04em] text-white/90 tabular-nums">
        {label}
      </span>
      <span
        className="pl-0.5 font-sans text-[11px] text-white/38"
        title={changelog || undefined}
      >
        {versionLabel}
      </span>
    </div>
  );
}

export default async function FilmLogsLedger({
  logs,
  emptyHint,
  omitHeader = false,
  memberNumber,
  showShare = true,
}: {
  logs: FilmLogEntry[];
  emptyHint?: string;
  /** When the page already shows title + body. */
  omitHeader?: boolean;
  /** Member # for Voyageur meta — same for every row in this ledger. */
  memberNumber?: number | null;
  /** Own-account share control. Off on public profiles. */
  showShare?: boolean;
}) {
  const t = await getTranslations('Account');
  const tFilm = await getTranslations('Film');

  // Trail columns stay hidden until a hop exists — blank columns read as unfinished.
  const showPassedBy = logs.some((e) => e.referred_by_member_number != null);
  const showPassedOn =
    showShare && logs.some((e) => e.passed_on_count > 0);

  return (
    <section className="w-full flex flex-col gap-6 text-left">
      {!omitHeader ? (
        <div className="flex flex-col gap-1.5">
          <h2 className="font-sans text-[12px] font-semibold uppercase tracking-wide text-white/35">
            {t('filmLogsTitle')}
          </h2>
          <p className="font-sans text-[13px] text-white/40 leading-snug max-w-2xl">
            {t('filmLogsBody')}
          </p>
          <p className="font-sans text-[12px] italic text-white/30 leading-snug max-w-2xl">
            {t('filmLogsNote')}
          </p>
        </div>
      ) : null}

      {logs.length === 0 ? (
        <p className="font-sans text-[14px] text-white/45 leading-relaxed">
          {emptyHint || t('filmLogsEmpty')}
        </p>
      ) : (
        <>
          {/* Mobile: compact stacked rows */}
          <ul className="md:hidden flex flex-col divide-y divide-white/10 border-y border-white/10 list-none m-0 p-0">
            {logs.map((entry) => {
              const date = formatLogDate(entry.recorded_at, 'monthDay');
              const title = (
                <span className="font-sans text-[14px] font-semibold text-white/90 truncate">
                  {entry.film_name}
                </span>
              );
              return (
                <li key={`${entry.film_id}-${entry.viewer_number}`} className="py-3.5">
                  <div className="flex items-center gap-3">
                    <FilmMark name={entry.film_name} poster={entry.film_poster} />
                    <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                      {entry.film_slug ? (
                        <Link
                          href={`/film/${entry.film_slug}`}
                          className="min-w-0 hover:opacity-80 transition-opacity"
                        >
                          {title}
                        </Link>
                      ) : (
                        title
                      )}
                      <div className="mt-1">
                        <VoyageurStamp
                          label={t('voyageurLine', {
                            number: entry.viewer_number,
                          })}
                          versionLabel={t('voyageurWatchedVersion', {
                            version: entry.film_version,
                          })}
                          changelog={entry.film_version_changelog}
                        />
                      </div>
                      <p className="font-sans text-[11px] text-white/40">
                        {date}
                        {entry.referred_by_member_number != null
                          ? ` · ${t('filmLogsPassedBy', {
                              number: entry.referred_by_member_number,
                            })}`
                          : ''}
                        {entry.passed_on_count > 0
                          ? ` · ${t('filmLogsColPassedOn')} ${t(
                              'filmLogsPassedOn',
                              { count: entry.passed_on_count }
                            )}`
                          : ''}
                      </p>
                    </div>
                    {showShare && entry.film_slug ? (
                      <FilmLogShareButton
                        filmName={entry.film_name}
                        filmSlug={entry.film_slug}
                        viewerNumber={entry.viewer_number}
                        filmVersion={entry.film_version}
                        memberNumber={memberNumber}
                      />
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Desktop: full-width fluid columns; Theme @xl+ */}
          <div className="hidden md:block w-full">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="w-[1%] whitespace-nowrap pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-white/35">
                    {t('filmLogsColDate')}
                  </th>
                  <th className="pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-white/35">
                    {t('filmLogsColFilm')}
                  </th>
                  <th className="w-[1%] whitespace-nowrap pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-white/35">
                    {t('filmLogsColRuntime')}
                  </th>
                  <th className="hidden xl:table-cell w-[12%] pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-white/35">
                    {t('filmLogsColTheme')}
                  </th>
                  <th className="w-[1%] whitespace-nowrap pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-white/35">
                    {t('filmLogsColVoyageur')}
                  </th>
                  {showPassedBy ? (
                    <th className="w-[1%] whitespace-nowrap pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-white/35">
                      {t('filmLogsColPassedBy')}
                    </th>
                  ) : null}
                  {showPassedOn ? (
                    <th className="w-[1%] whitespace-nowrap pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-white/35">
                      {t('filmLogsColPassedOn')}
                    </th>
                  ) : null}
                  {showShare ? (
                    <th className="w-[1%] whitespace-nowrap pb-2.5 font-sans text-[11px] font-medium text-white/35 text-right">
                      <span className="sr-only">{tFilm('stampShareShort')}</span>
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {logs.map((entry) => {
                  const date = formatLogDate(entry.recorded_at, 'monthDay');
                  const year = formatFilmYear(entry.film_release_date);
                  const runtime = formatRuntimeMin(entry.film_runtime, (n) =>
                    tFilm('runtimeMin', { n })
                  );
                  const filmCell = (
                    <span className="inline-flex items-center gap-2.5 min-w-0 max-w-full">
                      <FilmMark
                        name={entry.film_name}
                        poster={entry.film_poster}
                      />
                      <span className="font-sans text-[14px] font-semibold text-white/90 truncate">
                        {entry.film_name}
                      </span>
                    </span>
                  );

                  return (
                    <tr
                      key={`${entry.film_id}-${entry.viewer_number}`}
                      className="border-b border-white/10 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="w-[1%] whitespace-nowrap py-3.5 pr-4 xl:pr-6 align-middle">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-sans text-[13px] text-white/55">
                            {date}
                          </span>
                          {year !== '—' ? (
                            <span className="font-sans text-[11px] text-white/35">
                              {year}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-3.5 pr-4 xl:pr-6 align-middle min-w-0">
                        {entry.film_slug ? (
                          <Link
                            href={`/film/${entry.film_slug}`}
                            className="block min-w-0 max-w-xl xl:max-w-2xl hover:opacity-80 transition-opacity"
                          >
                            {filmCell}
                          </Link>
                        ) : (
                          filmCell
                        )}
                      </td>
                      <td className="w-[1%] whitespace-nowrap py-3.5 pr-4 xl:pr-6 align-middle">
                        <span className="font-sans text-[13px] text-white/50">
                          {runtime}
                        </span>
                      </td>
                      <td className="hidden xl:table-cell py-3.5 pr-4 xl:pr-6 align-middle min-w-0">
                        <span className="font-sans text-[13px] text-white/50 truncate block">
                          {entry.film_theme || '—'}
                        </span>
                      </td>
                      <td className="w-[1%] whitespace-nowrap py-3.5 pr-4 xl:pr-6 align-middle">
                        <VoyageurStamp
                          label={t('voyageurLine', {
                            number: entry.viewer_number,
                          })}
                          versionLabel={t('voyageurWatchedVersion', {
                            version: entry.film_version,
                          })}
                          changelog={entry.film_version_changelog}
                        />
                        {memberNumber != null ? (
                          <span className="sr-only">
                            {t('voyageurMeta', {
                              member: memberNumber,
                              date: formatLogDate(entry.recorded_at),
                            })}
                          </span>
                        ) : null}
                      </td>
                      {showPassedBy ? (
                        <td className="w-[1%] whitespace-nowrap py-3.5 pr-4 xl:pr-6 align-middle">
                          <span className="font-sans text-[13px] text-white/55 tabular-nums">
                            {entry.referred_by_member_number != null
                              ? t('filmLogsPassedBy', {
                                  number: entry.referred_by_member_number,
                                })
                              : t('filmLogsPassedByOrganic')}
                          </span>
                        </td>
                      ) : null}
                      {showPassedOn ? (
                        <td className="w-[1%] whitespace-nowrap py-3.5 pr-4 xl:pr-6 align-middle">
                          <span className="font-sans text-[13px] text-white/55 tabular-nums">
                            {entry.passed_on_count > 0
                              ? t('filmLogsPassedOn', {
                                  count: entry.passed_on_count,
                                })
                              : '—'}
                          </span>
                        </td>
                      ) : null}
                      {showShare ? (
                        <td className="w-[1%] whitespace-nowrap py-3.5 align-middle text-right">
                          {entry.film_slug ? (
                            <FilmLogShareButton
                              filmName={entry.film_name}
                              filmSlug={entry.film_slug}
                              viewerNumber={entry.viewer_number}
                              filmVersion={entry.film_version}
                              memberNumber={memberNumber}
                            />
                          ) : null}
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
