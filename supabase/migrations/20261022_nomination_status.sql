-- Nomination status: a slate is one path. A story can also go straight into production.
-- Old shortlisted rows that already won a bounty become in production.
-- The rest were held, so they become saved for later.

alter table public.nominations drop constraint if exists nominations_status_check;

update public.nominations n
set status = 'in_production'
where n.status = 'shortlisted'
  and exists (
    select 1
    from public.bounties b
    where b.winning_nomination_id = n.id
  );

update public.nominations
set status = 'saved_for_later'
where status = 'shortlisted';

alter table public.nominations
  add constraint nominations_status_check
  check (
    status in (
      'received',
      'in_review',
      'saved_for_later',
      'on_slate',
      'in_production',
      'released',
      'passed'
    )
  );
