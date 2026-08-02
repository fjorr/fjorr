-- Bureaux gifts (member → one paid seat / year) + lifetime comps (admin).
-- Lineage: sponsored_by_user_id on memberships.

alter table public.bureaux_memberships
  add column if not exists source text not null default 'stripe'
    check (source in ('stripe', 'gift', 'comp')),
  add column if not exists sponsored_by_user_id uuid references auth.users (id) on delete set null,
  add column if not exists comp_lifetime boolean not null default false;

comment on column public.bureaux_memberships.source is
  'How membership was granted: stripe checkout, member gift seat, or admin comp.';
comment on column public.bureaux_memberships.sponsored_by_user_id is
  'Bureaux member who gifted this seat (lineage).';
comment on column public.bureaux_memberships.comp_lifetime is
  'Admin lifetime complimentary — always active while true + status active.';

create index if not exists bureaux_memberships_sponsor_idx
  on public.bureaux_memberships (sponsored_by_user_id)
  where sponsored_by_user_id is not null;

create table if not exists public.bureaux_gifts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  token text not null unique,
  from_user_id uuid not null references auth.users (id) on delete cascade,
  to_email text not null,
  status text not null default 'pending_payment'
    check (status in (
      'pending_payment',
      'open',
      'redeemed',
      'expired',
      'canceled'
    )),
  stripe_checkout_session_id text unique,
  expires_at timestamptz,
  redeemed_at timestamptz,
  redeemed_by_user_id uuid references auth.users (id) on delete set null,
  note text
);

create index if not exists bureaux_gifts_from_user_idx
  on public.bureaux_gifts (from_user_id, status);

create index if not exists bureaux_gifts_to_email_idx
  on public.bureaux_gifts (lower(to_email));

create or replace function public.set_bureaux_gifts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists bureaux_gifts_set_updated_at on public.bureaux_gifts;
create trigger bureaux_gifts_set_updated_at
  before update on public.bureaux_gifts
  for each row execute function public.set_bureaux_gifts_updated_at();

comment on table public.bureaux_gifts is
  'Member gift seats — one open + one redeemed per giver per year. No public promo codes.';

alter table public.bureaux_gifts enable row level security;

-- Givers can read their own gifts; writes are service-role only.
create policy bureaux_gifts_select_own
  on public.bureaux_gifts
  for select
  to authenticated
  using (auth.uid() = from_user_id);

revoke insert, update, delete on public.bureaux_gifts from anon, authenticated;
grant select on public.bureaux_gifts to authenticated;
