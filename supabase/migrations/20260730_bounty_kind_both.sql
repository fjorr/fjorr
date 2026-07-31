-- Bounties may accept true, fiction, or both.
alter table public.bounties drop constraint if exists bounties_kind_check;

alter table public.bounties
  add constraint bounties_kind_check
  check (kind in ('true', 'fiction', 'both'));

comment on column public.bounties.kind is
  'true | fiction | both — hunt type; both accepts either nomination kind.';
