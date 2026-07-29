-- =============================================================================
-- The Bureaux — desk roster (private)
-- =============================================================================

create table if not exists public.bureaux_members (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  discipline text not null default '',
  email text,
  reel_url text,
  notes text,
  source text not null default 'manual'
    check (source in ('manual', 'scout', 'recut', 'referral')),
  status text not null default 'prospect'
    check (status in ('prospect', 'member', 'paused'))
);

create index if not exists bureaux_members_status_created_idx
  on public.bureaux_members (status, created_at desc);

create index if not exists bureaux_members_discipline_idx
  on public.bureaux_members (discipline);

create or replace function public.set_bureaux_members_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists bureaux_members_set_updated_at on public.bureaux_members;
create trigger bureaux_members_set_updated_at
  before update on public.bureaux_members
  for each row execute function public.set_bureaux_members_updated_at();

comment on table public.bureaux_members is
  'The Bureaux roster — Control desk only. Not public.';

alter table public.bureaux_members enable row level security;

-- No public/authenticated policies — service role (admin) only.
revoke all on public.bureaux_members from anon, authenticated;
