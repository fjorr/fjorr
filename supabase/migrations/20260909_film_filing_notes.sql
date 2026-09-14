-- Private filing notes for Engine (not public, not in search index).
-- Apply in Supabase SQL editor.

create table if not exists public.film_filing (
  film_id uuid primary key references public.film (id) on delete cascade,
  notes text not null default '',
  updated_at timestamptz not null default now()
);

comment on table public.film_filing is
  'Private Engine filing dump — mood/craft/thoughts. Never expose to anon or search.';

create or replace function public.film_filing_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  NEW.updated_at := now();
  return NEW;
end;
$$;

drop trigger if exists film_filing_set_updated_at on public.film_filing;
create trigger film_filing_set_updated_at
  before update on public.film_filing
  for each row
  execute function public.film_filing_set_updated_at();

revoke all on public.film_filing from anon, authenticated, public;
-- service_role keeps full access by default
grant all on public.film_filing to service_role;
