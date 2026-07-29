-- Plus Machine: rename bureaux source value recut → plus
update public.bureaux_members
  set source = 'plus'
  where source = 'recut';

alter table public.bureaux_members
  drop constraint if exists bureaux_members_source_check;

alter table public.bureaux_members
  add constraint bureaux_members_source_check
  check (source in ('manual', 'scout', 'plus', 'referral'));
