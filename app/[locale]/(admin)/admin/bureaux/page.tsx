import { listAdminBureauxMembers } from '@/lib/admin-actions';
import BureauxMemberCreateForm from '@/components/admin/BureauxMemberCreateForm';
import BureauxMemberStatusControl from '@/components/admin/BureauxMemberStatusControl';

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
  const members = await listAdminBureauxMembers();
  const active = members.filter((m) => m.status === 'member').length;

  return (
    <div className="flex flex-col gap-10 max-w-3xl">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-sans text-2xl font-bold tracking-tight text-white">
            The Bureaux
          </h1>
          <p className="font-sans text-[14px] text-white/45 leading-relaxed max-w-md">
            Desk roster of craftspeople. Private — not on the public site yet.
          </p>
          <p className="font-mono text-[12px] text-white/35">
            {members.length} on list · {active} members
          </p>
        </div>
        <BureauxMemberCreateForm />
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/35">
          Roster
        </h2>

        {members.length === 0 ? (
          <p className="font-sans text-[14px] text-white/40">None yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-white/8 border-y border-white/8 list-none m-0 p-0">
            {members.map((m) => (
              <li
                key={m.id}
                className="py-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    <span className="font-sans text-[15px] font-semibold text-white/90">
                      {m.name}
                    </span>
                    <span className="font-mono text-[12px] text-white/40">
                      {m.discipline}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-white/30 truncate">
                    {[
                      m.email,
                      m.source !== 'manual' ? m.source : null,
                      formatDate(m.created_at),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                  {m.reel_url ? (
                    <a
                      href={m.reel_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[12px] text-white/45 hover:text-white/70 truncate w-fit underline underline-offset-2 decoration-white/15"
                    >
                      {m.reel_url.replace(/^https?:\/\//, '')}
                    </a>
                  ) : null}
                  {m.notes ? (
                    <p className="font-sans text-[13px] text-white/50 leading-snug mt-0.5">
                      {m.notes}
                    </p>
                  ) : null}
                </div>
                <BureauxMemberStatusControl id={m.id} status={m.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
