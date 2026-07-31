-- =============================================================================
-- The Bureaux — optional annual subscription (paid membership group)
-- =============================================================================

create table if not exists public.bureaux_memberships (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text not null default 'none'
    check (status in (
      'none',
      'active',
      'past_due',
      'canceled',
      'incomplete',
      'unpaid'
    )),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false
);

create index if not exists bureaux_memberships_status_idx
  on public.bureaux_memberships (status);

create index if not exists bureaux_memberships_customer_idx
  on public.bureaux_memberships (stripe_customer_id)
  where stripe_customer_id is not null;

create or replace function public.set_bureaux_memberships_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists bureaux_memberships_set_updated_at
  on public.bureaux_memberships;
create trigger bureaux_memberships_set_updated_at
  before update on public.bureaux_memberships
  for each row execute function public.set_bureaux_memberships_updated_at();

comment on table public.bureaux_memberships is
  'The Bureaux — optional annual subscription. Synced from Stripe. Watching stays free.';

alter table public.bureaux_memberships enable row level security;

-- Members can read their own row; writes are service-role (webhook) only.
create policy bureaux_memberships_select_own
  on public.bureaux_memberships
  for select
  to authenticated
  using (auth.uid() = user_id);

revoke insert, update, delete on public.bureaux_memberships from anon, authenticated;
grant select on public.bureaux_memberships to authenticated;
