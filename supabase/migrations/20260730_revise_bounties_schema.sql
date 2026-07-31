-- =============================================================================
-- Revise bounties to brief-aligned field set
-- =============================================================================
-- reward_amount (cents), kind, status open|claimed|in_production|closed,
-- poster_image_url, claim/winner FKs, optional editorial fields.
-- nominations.bounty_id already exists (null = general pitch).
-- =============================================================================

-- Rename core money / poster columns
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'bounties' and column_name = 'amount_cents'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'bounties' and column_name = 'reward_amount'
  ) then
    alter table public.bounties rename column amount_cents to reward_amount;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'bounties' and column_name = 'hero_image_url'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'bounties' and column_name = 'poster_image_url'
  ) then
    alter table public.bounties rename column hero_image_url to poster_image_url;
  end if;
end $$;

-- Kind (matches Nominate true/fiction)
alter table public.bounties
  add column if not exists kind text not null default 'true';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'bounties_kind_check' and conrelid = 'public.bounties'::regclass
  ) then
    alter table public.bounties
      add constraint bounties_kind_check check (kind in ('true', 'fiction'));
  end if;
end $$;

-- Status vocabulary: active→open, filled→claimed
alter table public.bounties drop constraint if exists bounties_status_check;

update public.bounties set status = 'open' where status = 'active';
update public.bounties set status = 'claimed' where status = 'filled';

alter table public.bounties
  alter column status set default 'open';

alter table public.bounties
  add constraint bounties_status_check
  check (status in ('open', 'claimed', 'in_production', 'closed'));

-- Claim / winner linkage
alter table public.bounties
  add column if not exists claimed_by uuid references auth.users (id) on delete set null;

alter table public.bounties
  add column if not exists claimed_at timestamptz;

alter table public.bounties
  add column if not exists winning_nomination_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'bounties_winning_nomination_id_fkey'
      and conrelid = 'public.bounties'::regclass
  ) then
    alter table public.bounties
      add constraint bounties_winning_nomination_id_fkey
      foreign key (winning_nomination_id)
      references public.nominations (id)
      on delete set null;
  end if;
end $$;

-- Optional editorial controls
alter table public.bounties
  add column if not exists deadline timestamptz;

alter table public.bounties
  add column if not exists featured boolean not null default false;

alter table public.bounties
  add column if not exists sort_order integer;

-- Indexes
drop index if exists public.bounties_active_idx;
create index if not exists bounties_open_idx
  on public.bounties (featured desc, sort_order asc nulls last, created_at desc)
  where status = 'open';

create index if not exists bounties_winning_nomination_idx
  on public.bounties (winning_nomination_id)
  where winning_nomination_id is not null;

comment on table public.bounties is
  'Fjorr story hunts. Open until claimed / in production / closed. Nominations.bounty_id links pitches.';

comment on column public.bounties.reward_amount is
  'Reward in cents (e.g. 100000 = $1,000).';

comment on column public.bounties.poster_image_url is
  'Poster / thumbnail for the bounties grid and brief page.';

comment on column public.bounties.kind is
  'true | fiction — matches Nominate kind toggle.';

comment on column public.bounties.claimed_by is
  'auth.users id of the member who won the bounty.';

comment on column public.bounties.winning_nomination_id is
  'Nomination that won this bounty.';

comment on column public.nominations.bounty_id is
  'Null = general pitch; set = aimed at a specific bounty.';
