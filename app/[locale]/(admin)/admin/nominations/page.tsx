import {
  listAdminBounties,
  listAdminNominations,
} from '@/lib/admin-actions';
import NominationStatusControl from '@/components/admin/NominationStatusControl';
import NominationBountyControl from '@/components/admin/NominationBountyControl';
import NominationAwardControl from '@/components/admin/NominationAwardControl';

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

export default async function AdminNominationsPage() {
  const [nominations, bounties] = await Promise.all([
    listAdminNominations(),
    listAdminBounties(),
  ]);

  return (
    <div className="w-full max-w-4xl flex flex-col gap-10 text-left">
      <header className="flex flex-col gap-2">
        <h1 className="font-futura text-3xl sm:text-4xl tracking-tighter text-page select-none">
          Nominations
        </h1>
        <p className="font-sans text-[15px] text-page-muted leading-relaxed max-w-md">
          Review briefs. Set status. Attach a bounty to a General pitch when it
          earns one.
        </p>
      </header>

      {nominations.length === 0 ? (
        <p className="font-sans text-[14px] text-page-faint">Inbox empty.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-page-faint border-y border-page-faint list-none m-0 p-0">
          {nominations.map((n) => (
            <li
              key={n.id}
              className="py-6 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5"
            >
              <div className="flex flex-col gap-3 min-w-0">
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[11px] text-page-faint">
                  <span>{formatDate(n.created_at)}</span>
                  <span className="uppercase">{n.kind}</span>
                  {n.bounty_title && <span>Bounty · {n.bounty_title}</span>}
                  <span className="truncate">{n.contributor_email}</span>
                </div>

                <p className="font-sans text-[15px] font-semibold text-page leading-relaxed whitespace-pre-wrap">
                  {n.story_details}
                </p>

                <dl className="flex flex-col gap-2.5 text-left">
                  <div>
                    <dt className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-page-faint">
                      Why Fjorr
                    </dt>
                    <dd className="font-sans text-[13px] text-page-muted leading-snug mt-0.5">
                      {n.why_fjorr}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-page-faint">
                      When & where
                    </dt>
                    <dd className="font-sans text-[13px] text-page-muted leading-snug mt-0.5">
                      {n.setting}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-page-faint">
                      {n.kind === 'true' ? 'Proof' : 'Premise'}
                    </dt>
                    <dd className="font-sans text-[13px] text-page-muted leading-snug mt-0.5">
                      {n.proof_or_premise}
                      {n.proof_url && (
                        <>
                          {' '}
                          <a
                            href={n.proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-page underline underline-offset-2 hover:opacity-70"
                          >
                            Link
                          </a>
                        </>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="flex flex-col gap-3 shrink-0">
                <NominationStatusControl
                  id={n.id}
                  status={n.status}
                  statusReason={n.status_reason}
                />
                <NominationBountyControl
                  id={n.id}
                  bountyId={n.bounty_id}
                  bounties={bounties}
                />
                <NominationAwardControl id={n.id} bountyId={n.bounty_id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
