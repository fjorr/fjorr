-- =============================================================================
-- The Bureaux — random permanent number (not sequential)
-- Assigned once when membership first becomes active.
-- =============================================================================

alter table public.bureaux_memberships
  add column if not exists bureaux_number integer;

create unique index if not exists bureaux_memberships_number_uidx
  on public.bureaux_memberships (bureaux_number)
  where bureaux_number is not null;

comment on column public.bureaux_memberships.bureaux_number is
  'Random permanent Bureaux mark (e.g. 5-digit). Assigned once on activation. Not sequential.';
