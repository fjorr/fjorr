import BureauxCompForm from '@/components/admin/BureauxCompForm';
import { listAdminLifetimeComps } from '@/lib/admin-bureaux-actions';

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

export default async function AdminBureauxPage() {
  const comps = await listAdminLifetimeComps();

  return (
    <div className="w-full max-w-3xl flex flex-col gap-10 text-left">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-futura text-3xl sm:text-4xl tracking-tighter text-page select-none">
            Bureaux
          </h1>
          <p className="font-sans text-[16px] text-page-muted leading-relaxed max-w-md">
            Grant lifetime complimentary seats. No Stripe. Member gift seats are
            paid separately by members.
          </p>
        </div>
        <BureauxCompForm />
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-page-faint">
          Lifetime comps
        </h2>
        {comps.length === 0 ? (
          <p className="font-sans text-[14px] text-page-faint">None yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-page-faint border-y border-page-faint list-none m-0 p-0">
            {comps.map((row) => (
              <li
                key={row.user_id}
                className="py-4 flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-sans text-[14px] font-semibold text-page truncate">
                    {row.email || row.user_id.slice(0, 8)}
                  </span>
                  <span className="font-mono text-[11px] text-page-faint">
                    {formatDate(row.updated_at)}
                  </span>
                </div>
                {row.bureaux_number != null ? (
                  <span className="font-mono text-[13px] text-page tabular-nums">
                    № {row.bureaux_number}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
