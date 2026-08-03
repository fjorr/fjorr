-- =============================================================================
-- Cabinet intake attribution — own-account ledger of names put forward
-- =============================================================================

alter table public.cabinet_members
  add column if not exists submitted_by_user_id uuid references auth.users (id) on delete set null;

create index if not exists cabinet_members_submitted_by_idx
  on public.cabinet_members (submitted_by_user_id, created_at desc)
  where submitted_by_user_id is not null;

comment on column public.cabinet_members.submitted_by_user_id is
  'Bureaux member who filed this offer/referral. Null for desk-entered rows.';
