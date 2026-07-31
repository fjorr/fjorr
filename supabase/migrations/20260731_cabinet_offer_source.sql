-- Public "Offer your craft" → cabinet_members.source = offer

alter table public.cabinet_members
  drop constraint if exists cabinet_members_source_check;

alter table public.cabinet_members
  drop constraint if exists bureaux_members_source_check;

alter table public.cabinet_members
  add constraint cabinet_members_source_check
  check (source in ('manual', 'scout', 'plus', 'referral', 'offer'));
