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
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-sans text-2xl font-bold tracking-tight text-white">
          Plus Machine
        </h1>
        <p className="font-sans text-[14px] text-white/45 leading-relaxed max-w-lg">
          Member craft notes on films. Private — desk only. Forward useful ones
          to directors yourself.
        </p>
        <p className="font-mono text-[12px] text-white/35">
          {notes.length} notes · {unread} new
        </p>
      </div>

      {notes.length === 0 ? (
        <p className="font-sans text-[14px] text-white/40">No notes yet.</p>
      ) : (
        <ul className="flex flex-col gap-4 list-none m-0 p-0">
          {notes.map((n) => {
            const momentHref =
              n.film_slug && n.at_seconds != null
                ? `/film/${n.film_slug}?t=${Math.floor(n.at_seconds)}`
                : n.film_slug
                  ? `/film/${n.film_slug}`
                  : null;

            return (
              <li
                key={n.id}
                className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-4 flex flex-col gap-2"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    {momentHref ? (
                      <Link
                        href={momentHref}
                        className="font-sans text-[15px] font-semibold text-white/90 hover:text-white truncate"
                      >
                        {n.film_name || 'Film'}
                      </Link>
                    ) : (
                      <span className="font-sans text-[15px] font-semibold text-white/90">
                        {n.film_name || 'Film'}
                      </span>
                    )}
                    <span className="font-mono text-[11px] text-white/35 truncate">
                      {n.member_email || n.user_id.slice(0, 8)}
                      {' · '}
                      {formatDate(n.created_at)}
                      {n.at_seconds != null && momentHref ? (
                        <>
                          {' · '}
                          <Link
                            href={momentHref}
                            className="text-white/50 hover:text-white/80 underline underline-offset-2 decoration-white/20 hover:decoration-white/40 transition-colors"
                          >
                            @{formatTimestamp(n.at_seconds)}
                          </Link>
                        </>
                      ) : null}
                    </span>
                  </div>
                  <FilmNoteStatusControl id={n.id} status={n.status} />
                </div>
                <p className="font-sans text-[14px] text-white/65 leading-relaxed whitespace-pre-wrap">
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
