-- =============================================================================
-- The Cabinet — rename craft roster from bureaux_members
-- (Bureaux name reserved for paid membership group.)
-- =============================================================================

alter table if exists public.bureaux_members rename to cabinet_members;

alter index if exists bureaux_members_status_created_idx
  rename to cabinet_members_status_created_idx;

alter index if exists bureaux_members_discipline_idx
  rename to cabinet_members_discipline_idx;

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'bureaux_members_source_check'
      and conrelid = 'public.cabinet_members'::regclass
  ) then
    alter table public.cabinet_members
      rename constraint bureaux_members_source_check to cabinet_members_source_check;
  end if;

  if exists (
    select 1 from pg_constraint
    where conname = 'bureaux_members_status_check'
      and conrelid = 'public.cabinet_members'::regclass
  ) then
    alter table public.cabinet_members
      rename constraint bureaux_members_status_check to cabinet_members_status_check;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'set_bureaux_members_updated_at'
  ) then
    alter function public.set_bureaux_members_updated_at()
      rename to set_cabinet_members_updated_at;
  end if;
end $$;

drop trigger if exists bureaux_members_set_updated_at on public.cabinet_members;
drop trigger if exists cabinet_members_set_updated_at on public.cabinet_members;
create trigger cabinet_members_set_updated_at
  before update on public.cabinet_members
  for each row execute function public.set_cabinet_members_updated_at();

comment on table public.cabinet_members is
  'The Cabinet roster — Control desk only. Not public.';
