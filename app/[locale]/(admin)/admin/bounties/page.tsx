import { listAdminBounties } from '@/lib/admin-actions';
import BountyCreateForm from '@/components/admin/BountyCreateForm';
import BountyEditForm from '@/components/admin/BountyEditForm';
import BountyStatusControl from '@/components/admin/BountyStatusControl';

function formatMoney(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  } catch {
    return `$${Math.round(cents / 100)}`;
  }
}

export default async function AdminBountiesPage() {
  const bounties = await listAdminBounties();

  return (
    <div className="w-full max-w-3xl flex flex-col gap-10 text-left">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-futura text-3xl sm:text-4xl tracking-tighter text-page select-none">
            Bounties
          </h1>
          <p className="font-sans text-[15px] text-page-muted leading-relaxed max-w-md">
            Specific hunts. Public briefs on /bounties. Open until Claimed, In
            production, or Closed.
          </p>
        </div>
        <BountyCreateForm />
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-page-faint">
          All
        </h2>

        {bounties.length === 0 ? (
          <p className="font-sans text-[14px] text-page-faint">None yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-page-faint border-y border-page-faint list-none m-0 p-0">
            {bounties.map((b) => (
              <li key={b.id} className="py-6 flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-start">
                  <div className="flex gap-4 min-w-0">
                    {b.poster_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={b.poster_image_url}
                        alt=""
                        className="w-20 h-20 object-cover shrink-0 bg-page-chip rounded-[6px]"
                      />
                    ) : (
                      <div
                        className="w-20 h-20 shrink-0 bg-page-chip rounded-[6px]"
                        aria-hidden
                      />
                    )}
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                        <span className="font-sans text-[15px] font-semibold text-page">
                          {b.title}
                        </span>
                        <span className="font-mono text-[13px] text-page-muted">
                          {formatMoney(b.reward_amount, b.currency)}
                        </span>
                        <span className="font-sans text-[11px] font-semibold uppercase tracking-wide text-page-faint">
                          {b.kind}
                        </span>
                        {b.featured ? (
                          <span className="font-sans text-[11px] font-semibold uppercase tracking-wide text-page-muted">
                            Featured
                          </span>
                        ) : null}
                      </div>
                      <p className="font-mono text-[11px] text-page-faint">
                        {b.slug}
                        {b.sort_order != null ? ` · sort ${b.sort_order}` : ''}
                      </p>
                      {b.brief && (
                        <p className="font-sans text-[13px] text-page-muted leading-snug">
                          {b.brief}
                        </p>
                      )}
                      {b.deadline ? (
                        <p className="font-mono text-[10px] text-page-faint">
                          deadline {b.deadline.slice(0, 10)}
                        </p>
                      ) : null}
                      {b.winning_nomination_id ? (
                        <p className="font-mono text-[10px] text-page-faint truncate">
                          won by nomination{' '}
                          {b.winning_nomination_id.slice(0, 8)}…
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-col items-stretch sm:items-end gap-2">
                    <BountyStatusControl id={b.id} status={b.status} />
                    <BountyEditForm bounty={b} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
