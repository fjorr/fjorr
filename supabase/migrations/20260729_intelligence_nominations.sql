-- =============================================================================
-- Intelligence — bounties + member nominations (fresh start)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Bounties (Fjorr-posted themed hunts; no hard deadline)
-- -----------------------------------------------------------------------------
create table if not exists public.bounties (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  brief text not null default '',
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'USD',
  hero_image_url text,
  status text not null default 'active'
    check (status in ('active', 'filled', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bounties_slug_format check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    and char_length(slug) between 2 and 64
  )
);

create unique index if not exists bounties_slug_uidx on public.bounties (slug);
create index if not exists bounties_active_idx
  on public.bounties (created_at desc)
  where status = 'active';

comment on table public.bounties is
  'Fjorr story hunts. Active until filled/closed. No hard deadline.';

create or replace function public.set_bounties_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists bounties_set_updated_at on public.bounties;
create trigger bounties_set_updated_at
  before update on public.bounties
  for each row execute function public.set_bounties_updated_at();

alter table public.bounties enable row level security;

drop policy if exists "Bounties public read" on public.bounties;
create policy "Bounties public read"
  on public.bounties
  for select
  to anon, authenticated
  using (true);

revoke insert, update, delete on public.bounties from anon, authenticated;
grant select on public.bounties to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Nominations — drop legacy public form table, recreate for members
-- -----------------------------------------------------------------------------
drop table if exists public.nominations cascade;

create table public.nominations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid not null references auth.users (id) on delete cascade,
  contributor_email text not null,
  kind text not null default 'true'
    check (kind in ('true', 'fiction')),
  story_details text not null,
  why_fjorr text not null,
  setting text not null,
  proof_or_premise text not null,
  proof_url text,
  bounty_id uuid references public.bounties (id) on delete set null,
  status text not null default 'received'
    check (
      status in (
        'received',
        'in_review',
        'shortlisted',
        'passed',
        'in_production',
        'released'
      )
    ),
  status_reason text
);

create index nominations_user_created_idx
  on public.nominations (user_id, created_at desc);

create index nominations_bounty_idx
  on public.nominations (bounty_id)
  where bounty_id is not null;

create index nominations_status_created_idx
  on public.nominations (status, created_at desc);

create or replace function public.set_nominations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists nominations_set_updated_at on public.nominations;
create trigger nominations_set_updated_at
  before update on public.nominations
  for each row execute function public.set_nominations_updated_at();

comment on table public.nominations is
  'Member story pitches (Intelligence). Status set by Fjorr.';

-- -----------------------------------------------------------------------------
-- RLS — members insert/read own only
-- -----------------------------------------------------------------------------
alter table public.nominations enable row level security;

drop policy if exists "Allow public inserts to nominations" on public.nominations;
drop policy if exists "Allow public submissions" on public.nominations;
drop policy if exists "Allow authenticated users to view" on public.nominations;
drop policy if exists "Enable select for authenticated users only" on public.nominations;
drop policy if exists "Nominations owner insert" on public.nominations;
drop policy if exists "Nominations owner read" on public.nominations;

create policy "Nominations owner insert"
  on public.nominations
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Nominations owner read"
  on public.nominations
  for select
  to authenticated
  using (auth.uid() = user_id);

revoke update, delete on public.nominations from anon, authenticated;
grant select, insert on public.nominations to authenticated;
revoke all on public.nominations from anon;

-- Seed one active bounty (idempotent)
insert into public.bounties (slug, title, brief, amount_cents, currency, status)
values (
  'civil-war',
  'Civil War',
  'A specific Civil War story we have not told — same incident, not the theme. Proof that leads somewhere real.',
  50000,
  'USD',
  'active'
)
on conflict (slug) do nothing;
