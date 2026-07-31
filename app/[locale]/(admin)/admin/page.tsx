import { Link } from '@/i18n/navigation';
import { getAdminOverview } from '@/lib/admin-actions';
import type { NominationStatus } from '@/lib/nomination-actions';

const STATUS_LABEL: Record<string, string> = {
  received: 'Received',
  in_review: 'In review',
  shortlisted: 'Shortlisted',
  passed: 'Passed',
  in_production: 'In production',
  released: 'Released',
};

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

function preview(text: string) {
  const t = text.trim().replace(/\s+/g, ' ');
  return t.length <= 100 ? t : `${t.slice(0, 97).trimEnd()}…`;
}

export default async function AdminOverviewPage() {
  const overview = await getAdminOverview();
  const statusOrder: NominationStatus[] = [
    'received',
    'in_review',
    'shortlisted',
    'passed',
    'in_production',
    'released',
  ];

  return (
    <div className="w-full max-w-3xl flex flex-col gap-10 text-left">
      <header className="flex flex-col gap-2">
        <h1 className="font-futura text-3xl sm:text-4xl tracking-tighter text-page select-none">
          Overview
        </h1>
        <p className="font-sans text-[15px] text-page-muted leading-relaxed max-w-md">
          Intelligence intake and bounties. Less, but better.
        </p>
      </header>

      <section className="flex flex-col divide-y divide-page-faint border-y border-page-faint">
        <div className="py-4 flex items-baseline justify-between gap-4">
          <span className="font-sans text-[14px] text-page-muted">
            Nominations
          </span>
          <span className="font-mono text-[15px] text-page tabular-nums">
            {overview.nominationsTotal}
          </span>
        </div>
        <div className="py-4 flex items-baseline justify-between gap-4">
          <span className="font-sans text-[14px] text-page-muted">In review</span>
          <span className="font-mono text-[15px] text-page tabular-nums">
            {(overview.nominationsByStatus.in_review || 0) +
              (overview.nominationsByStatus.received || 0)}
          </span>
        </div>
        <div className="py-4 flex items-baseline justify-between gap-4">
          <span className="font-sans text-[14px] text-page-muted">
            Active bounties
          </span>
          <span className="font-mono text-[15px] text-page tabular-nums">
            {overview.bountiesActive}
          </span>
        </div>
        <div className="py-4 flex items-baseline justify-between gap-4">
          <span className="font-sans text-[14px] text-page-muted">
            Bureaux
          </span>
          <span className="font-mono text-[15px] text-page tabular-nums">
            {overview.bureauxActive}
          </span>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-page-faint">
          By status
        </h2>
        <ul className="flex flex-col divide-y divide-page-faint border-y border-page-faint list-none m-0 p-0">
          {statusOrder.map((key) => (
            <li
              key={key}
              className="flex items-baseline justify-between gap-4 py-3"
            >
              <span className="font-sans text-[14px] text-page-muted">
                {STATUS_LABEL[key] || key}
              </span>
              <span className="font-mono text-[13px] text-page-faint tabular-nums">
                {overview.nominationsByStatus[key] || 0}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-page-faint">
            Recent
          </h2>
          <Link
            href="/admin/nominations"
            className="font-sans text-[13px] font-semibold text-page-faint hover:text-page-muted transition-colors"
          >
            All →
          </Link>
        </div>

        {overview.recentNominations.length === 0 ? (
          <p className="font-sans text-[14px] text-page-faint">
            No nominations yet.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-page-faint border-y border-page-faint list-none m-0 p-0">
            {overview.recentNominations.map((n) => (
              <li key={n.id} className="py-3.5 flex flex-col gap-1">
                <p className="font-sans text-[14px] font-semibold text-page leading-snug">
                  {preview(n.story_details)}
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[11px] text-page-faint">
                  <span>{formatDate(n.created_at)}</span>
                  <span>{STATUS_LABEL[n.status] || n.status}</span>
                  <span>{n.contributor_email}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
