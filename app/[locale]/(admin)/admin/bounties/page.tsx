import { listAdminBounties } from '@/lib/admin-actions';
import BountyCreateForm from '@/components/admin/BountyCreateForm';
import BountyStatusControl from '@/components/admin/BountyStatusControl';
import BountyHeroControl from '@/components/admin/BountyHeroControl';

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
    <div className="flex flex-col gap-10 max-w-3xl">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-sans text-2xl font-bold tracking-tight text-white">
            Bounties
          </h1>
          <p className="font-sans text-[14px] text-white/45 leading-relaxed max-w-md">
            Specific hunts. Public briefs on /bounties. Open until Claimed, In
            production, or Closed.
          </p>
        </div>
        <BountyCreateForm />
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/35">
          All
        </h2>

        {bounties.length === 0 ? (
          <p className="font-sans text-[14px] text-white/40">None yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-white/8 border-y border-white/8">
            {bounties.map((b) => (
              <li key={b.id} className="py-6 flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-start">
                  <div className="flex gap-4 min-w-0">
                    {b.poster_image_url ? (
                      <img
                        src={b.poster_image_url}
                        alt=""
                        className="w-20 h-20 object-cover shrink-0 bg-white/5"
                      />
                    ) : (
                      <div className="w-20 h-20 shrink-0 bg-white/5" aria-hidden />
                    )}
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                        <span className="font-sans text-[15px] font-semibold text-white/90">
                          {b.title}
                        </span>
                        <span className="font-mono text-[13px] text-white/50">
                          {formatMoney(b.reward_amount, b.currency)}
                        </span>
                        <span className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/30">
                          {b.kind}
                        </span>
                      </div>
                      <p className="font-mono text-[11px] text-white/30">{b.slug}</p>
                      {b.brief && (
                        <p className="font-sans text-[13px] text-white/50 leading-snug">
                          {b.brief}
                        </p>
                      )}
                      {b.winning_nomination_id ? (
                        <p className="font-mono text-[10px] text-white/25 truncate">
                          won by nomination {b.winning_nomination_id.slice(0, 8)}…
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <BountyStatusControl id={b.id} status={b.status} />
                </div>
                <BountyHeroControl id={b.id} posterImageUrl={b.poster_image_url} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
