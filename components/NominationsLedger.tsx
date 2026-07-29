import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type {
  NominationKind,
  NominationRow,
  NominationStatus,
} from '@/lib/nomination-actions';

function formatNomDate(iso: string) {
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

function statusKey(status: NominationStatus) {
  switch (status) {
    case 'received':
      return 'statusReceived';
    case 'in_review':
      return 'statusInReview';
    case 'shortlisted':
      return 'statusShortlisted';
    case 'passed':
      return 'statusPassed';
    case 'in_production':
      return 'statusInProduction';
    case 'released':
      return 'statusReleased';
    default:
      return 'statusReceived';
  }
}

function kindKey(kind: NominationKind) {
  return kind === 'fiction' ? 'kindFiction' : 'kindTrue';
}

function storyPreview(story: string) {
  const trimmed = story.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= 120) return trimmed;
  return `${trimmed.slice(0, 117).trimEnd()}…`;
}

export default async function NominationsLedger({
  nominations,
  omitHeader = false,
}: {
  nominations: NominationRow[];
  /** When the page already shows title + body. */
  omitHeader?: boolean;
}) {
  const t = await getTranslations('Account');

  return (
    <section className="w-full max-w-sm flex flex-col gap-4 text-left">
      {!omitHeader ? (
        <div className="flex flex-col gap-1">
          <h2 className="font-sans text-[12px] font-semibold uppercase tracking-wide text-white/35">
            {t('nominationsTitle')}
          </h2>
          <p className="font-sans text-[13px] text-white/40 leading-snug">
            {t('nominationsBody')}
          </p>
        </div>
      ) : null}

      {nominations.length === 0 ? (
        <p className="font-sans text-[14px] text-white/45 leading-relaxed">
          {t('nominationsEmpty')}{' '}
          <Link
            href="/nominate"
            className="text-white/70 underline underline-offset-2 hover:text-white transition-colors"
          >
            {t('nominationsEmptyCta')}
          </Link>
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-white/8 border-y border-white/8">
          {nominations.map((entry) => (
            <li key={entry.id} className="flex flex-col gap-1.5 py-3.5">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-sans text-[15px] font-semibold text-white/90 leading-snug">
                  {storyPreview(entry.story_details)}
                </span>
                <span className="shrink-0 font-mono text-[12px] text-white/50 uppercase tracking-wide">
                  {t(statusKey(entry.status))}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[12px] text-white/35">
                <span>{formatNomDate(entry.created_at)}</span>
                <span>{t(kindKey(entry.kind))}</span>
                {entry.bounty_title && (
                  <span>{t('nominationBounty', { title: entry.bounty_title })}</span>
                )}
              </div>
              {entry.status === 'passed' && entry.status_reason && (
                <p className="font-sans text-[12px] text-white/40 leading-snug">
                  {entry.status_reason}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
