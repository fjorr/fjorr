-- Permanent public bounty numbers — Bounty No. {n}

create sequence if not exists public.bounties_bounty_number_seq;

alter table public.bounties
  add column if not exists bounty_number integer;

with ordered as (
  select id, row_number() over (order by created_at asc, id asc) as n
  from public.bounties
  where bounty_number is null
)
update public.bounties b
set bounty_number = ordered.n
from ordered
where b.id = ordered.id;

select setval(
  'public.bounties_bounty_number_seq',
  coalesce((select max(bounty_number) from public.bounties), 0)
);

alter table public.bounties
  alter column bounty_number set default nextval('public.bounties_bounty_number_seq'),
  alter column bounty_number set not null;

create unique index if not exists bounties_bounty_number_uidx
  on public.bounties (bounty_number);

comment on column public.bounties.bounty_number is
  'Permanent public bounty number. Displayed as Bounty No. {n}.';
