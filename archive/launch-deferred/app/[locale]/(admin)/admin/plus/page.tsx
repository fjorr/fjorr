import { listAdminFilmNotes } from '@/lib/admin-actions';
import FilmNoteStatusControl from '@/components/admin/FilmNoteStatusControl';
import { formatTimestamp } from '@/lib/film-note-time';
import { Link } from '@/i18n/navigation';

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default async function AdminPlusPage() {
  const notes = await listAdminFilmNotes();
  const unread = notes.filter((n) => n.status === 'new').length;

  return (
    <div className="w-full max-w-3xl flex flex-col gap-8 text-left">
      <header className="flex flex-col gap-2">
        <h1 className="font-futura text-3xl sm:text-4xl tracking-tighter text-page select-none">
          Plus Machine
        </h1>
        <p className="font-sans text-[16px] text-page-muted leading-relaxed max-w-lg">
          Member craft notes on films. Private — desk only. Forward useful ones
          to directors yourself.
        </p>
        <p className="font-mono text-[12px] text-page-faint">
          {notes.length} tickets · {unread} unread
        </p>
      </header>

      {notes.length === 0 ? (
        <p className="font-sans text-[14px] text-page-faint">No notes yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-page-faint border-y border-page-faint list-none m-0 p-0">
          {notes.map((n) => {
            const momentHref =
              n.film_slug && n.at_seconds != null
                ? `/film/${n.film_slug}?t=${Math.floor(n.at_seconds)}`
                : n.film_slug
                  ? `/film/${n.film_slug}`
                  : null;

            return (
              <li key={n.id} className="py-5 flex flex-col gap-2">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    {momentHref ? (
                      <Link
                        href={momentHref}
                        className="font-sans text-[15px] font-semibold text-page hover:opacity-70 truncate"
                      >
                        {n.film_name || 'Film'}
                      </Link>
                    ) : (
                      <span className="font-sans text-[15px] font-semibold text-page">
                        {n.film_name || 'Film'}
                      </span>
                    )}
                    <span className="font-mono text-[11px] text-page-faint truncate">
                      {n.member_email || n.user_id.slice(0, 8)}
                      {' · '}
                      {formatDate(n.created_at)}
                      {n.at_seconds != null && momentHref ? (
                        <>
                          {' · '}
                          <Link
                            href={momentHref}
                            className="text-page-muted hover:text-page underline underline-offset-2 decoration-[color-mix(in_srgb,var(--page-fg)_20%,transparent)] hover:decoration-[color-mix(in_srgb,var(--page-fg)_40%,transparent)] transition-colors"
                          >
                            @{formatTimestamp(n.at_seconds)}
                          </Link>
                        </>
                      ) : null}
                    </span>
                  </div>
                  <FilmNoteStatusControl id={n.id} status={n.status} />
                </div>
                <p className="font-sans text-[14px] text-page-muted leading-relaxed whitespace-pre-wrap">
                  {n.body}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
