import { listAdminCabinetMembers } from '@/lib/admin-actions';
import CabinetMemberCreateForm from '@/components/admin/CabinetMemberCreateForm';
import CabinetMemberStatusControl from '@/components/admin/CabinetMemberStatusControl';

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

export default async function AdminCabinetPage() {
  const members = await listAdminCabinetMembers();
  const active = members.filter((m) => m.status === 'member').length;

  return (
    <div className="w-full max-w-3xl flex flex-col gap-10 text-left">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-futura text-3xl sm:text-4xl tracking-tighter text-page select-none">
            The Cabinet
          </h1>
          <p className="font-sans text-[15px] text-page-muted leading-relaxed max-w-md">
            Desk roster of craftspeople. Private — not on the public site yet.
          </p>
          <p className="font-mono text-[12px] text-page-faint">
            {members.length} on list · {active} members
          </p>
        </div>
        <CabinetMemberCreateForm />
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-page-faint">
          Roster
        </h2>

        {members.length === 0 ? (
          <p className="font-sans text-[14px] text-page-faint">None yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-page-faint border-y border-page-faint list-none m-0 p-0">
            {members.map((m) => (
              <li
                key={m.id}
                className="py-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    <span className="font-sans text-[15px] font-semibold text-page">
                      {m.name}
                    </span>
                    <span className="font-mono text-[12px] text-page-muted">
                      {m.discipline}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-page-faint truncate">
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
                      className="font-mono text-[12px] text-page-muted hover:text-page truncate w-fit underline underline-offset-2 decoration-[color-mix(in_srgb,var(--page-fg)_20%,transparent)]"
                    >
                      {m.reel_url.replace(/^https?:\/\//, '')}
                    </a>
                  ) : null}
                  {m.notes ? (
                    <p className="font-sans text-[13px] text-page-muted leading-snug mt-0.5">
                      {m.notes}
                    </p>
                  ) : null}
                </div>
                <CabinetMemberStatusControl id={m.id} status={m.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
