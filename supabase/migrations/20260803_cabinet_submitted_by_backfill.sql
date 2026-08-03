-- =============================================================================
-- Backfill Cabinet intake attribution from note trailer "from {email}"
-- =============================================================================
-- Pre-ledger offer/referral rows only stored the submitter in notes. Without
-- this, /account/cabinet stays empty for those filings.

update public.cabinet_members cm
set submitted_by_user_id = u.id
from auth.users u
where cm.submitted_by_user_id is null
  and cm.source in ('offer', 'referral')
  and u.email is not null
  and length(trim(u.email)) > 0
  and cm.notes ilike '%from ' || u.email || '%';
