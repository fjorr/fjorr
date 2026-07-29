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
    <div className="flex flex-col gap-12 max-w-3xl">
      <header className="flex flex-col gap-2">
        <h1 className="font-sans text-2xl font-bold tracking-tight text-white">
          Overview
        </h1>
        <p className="font-sans text-[14px] text-white/45 leading-relaxed max-w-md">
          Intelligence intake and bounties. Less, but better.
        </p>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-white/8 border border-white/8">
        <div className="bg-[#1F1F1F] p-5 flex flex-col gap-1">
          <span className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/35">
            Nominations
          </span>
          <span className="font-mono text-2xl text-white/90 tabular-nums">
            {overview.nominationsTotal}
          </span>
        </div>
        <div className="bg-[#1F1F1F] p-5 flex flex-col gap-1">
          <span className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/35">
            In review
          </span>
          <span className="font-mono text-2xl text-white/90 tabular-nums">
            {(overview.nominationsByStatus.in_review || 0) +
              (overview.nominationsByStatus.received || 0)}
          </span>
        </div>
        <div className="bg-[#1F1F1F] p-5 flex flex-col gap-1 col-span-2 sm:col-span-1">
          <span className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/35">
            Active bounties
          </span>
          <span className="font-mono text-2xl text-white/90 tabular-nums">
            {overview.bountiesActive}
          </span>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/35">
          By status
        </h2>
        <ul className="flex flex-col divide-y divide-white/8 border-y border-white/8">
          {statusOrder.map((key) => (
            <li
              key={key}
              className="flex items-baseline justify-between gap-4 py-3"
            >
              <span className="font-sans text-[14px] text-white/70">
                {STATUS_LABEL[key] || key}
              </span>
              <span className="font-mono text-[13px] text-white/45 tabular-nums">
                {overview.nominationsByStatus[key] || 0}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/35">
            Recent
          </h2>
          <Link
            href="/admin/nominations"
            className="font-sans text-[13px] font-semibold text-white/40 hover:text-white/70 transition-colors"
          >
            All →
          </Link>
        </div>

        {overview.recentNominations.length === 0 ? (
          <p className="font-sans text-[14px] text-white/40">No nominations yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-white/8 border-y border-white/8">
            {overview.recentNominations.map((n) => (
              <li key={n.id} className="py-3.5 flex flex-col gap-1">
                <p className="font-sans text-[14px] font-semibold text-white/85 leading-snug">
                  {preview(n.story_details)}
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[11px] text-white/35">
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
