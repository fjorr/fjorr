-- Slate — members vote on the next film, and can leave a prompt.
-- One open cycle at a time. Votes and prompts are private: no public counts.

create table if not exists public.slate_cycle (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'open'
    check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  constraint slate_cycle_window check (ends_at > starts_at)
);

create unique index if not exists slate_cycle_one_open
  on public.slate_cycle (status)
  where status = 'open';

comment on table public.slate_cycle is
  'A 30-day Slate ballot. Only one cycle stays open.';

create table if not exists public.slate_story (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.slate_cycle (id) on delete cascade,
  title text not null,
  logline text not null,
  treatment text not null,
  image_url text,
  source text not null default 'internal'
    check (source in ('member', 'internal')),
  member_number integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint slate_story_title_len check (char_length(btrim(title)) between 1 and 120),
  constraint slate_story_logline_words check (
    coalesce(
      array_length(regexp_split_to_array(btrim(logline), '\s+'), 1),
      0
    ) between 1 and 25
  ),
  constraint slate_story_treatment_len check (
    char_length(btrim(treatment)) between 1 and 500
  ),
  constraint slate_story_credit check (
    (source = 'internal' and member_number is null)
    or (source = 'member' and member_number is not null)
  )
);

create index if not exists slate_story_cycle_idx
  on public.slate_story (cycle_id, sort_order, created_at);

comment on table public.slate_story is
  'Concepts on the open Slate. Logline is at most 25 words.';

create table if not exists public.slate_vote (
  cycle_id uuid not null references public.slate_cycle (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  story_id uuid not null references public.slate_story (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (cycle_id, user_id)
);

create index if not exists slate_vote_story_idx
  on public.slate_vote (story_id);

comment on table public.slate_vote is
  'One vote per member per cycle. The row is replaced when they change it. Counts are not public.';

create table if not exists public.slate_prompt (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.slate_cycle (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint slate_prompt_body_len check (char_length(btrim(body)) between 1 and 280)
);

create index if not exists slate_prompt_user_cycle_idx
  on public.slate_prompt (user_id, cycle_id, created_at);

comment on table public.slate_prompt is
  'Member story prompts. Two per user per cycle, tied to the account.';

create or replace function public.slate_member_active(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.bureaux_memberships m
    where m.user_id = uid
      and (
        m.status in ('active', 'past_due')
        or (
          coalesce(m.comp_lifetime, false)
          and m.status in ('active', 'past_due')
        )
        or (
          m.status = 'canceled'
          and m.current_period_end is not null
          and m.current_period_end > now()
        )
      )
  );
$$;

create or replace function public.slate_cast_vote(p_story_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  cid uuid;
  sid uuid;
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'code', 'signedOut');
  end if;

  if not public.slate_member_active(uid) then
    return jsonb_build_object('ok', false, 'code', 'notMember');
  end if;

  select c.id into cid
  from public.slate_cycle c
  where c.status = 'open'
    and c.starts_at <= now()
    and c.ends_at > now()
  limit 1;

  if cid is null then
    return jsonb_build_object('ok', false, 'code', 'closed');
  end if;

  select s.id into sid
  from public.slate_story s
  where s.id = p_story_id
    and s.cycle_id = cid;

  if sid is null then
    return jsonb_build_object('ok', false, 'code', 'invalid');
  end if;

  insert into public.slate_vote (cycle_id, user_id, story_id)
  values (cid, uid, sid)
  on conflict (cycle_id, user_id)
  do update set story_id = excluded.story_id, updated_at = now();

  return jsonb_build_object('ok', true, 'code', 'ok', 'storyId', sid);
end;
$$;

create or replace function public.slate_submit_prompt(p_body text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  cid uuid;
  body text;
  n integer;
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'code', 'signedOut');
  end if;

  if not public.slate_member_active(uid) then
    return jsonb_build_object('ok', false, 'code', 'notMember');
  end if;

  body := btrim(regexp_replace(coalesce(p_body, ''), '\s+', ' ', 'g'));
  if char_length(body) < 1 or char_length(body) > 280 then
    return jsonb_build_object('ok', false, 'code', 'invalid');
  end if;

  select c.id into cid
  from public.slate_cycle c
  where c.status = 'open'
    and c.starts_at <= now()
    and c.ends_at > now()
  limit 1;

  if cid is null then
    return jsonb_build_object('ok', false, 'code', 'closed');
  end if;

  perform pg_advisory_xact_lock(hashtextextended(uid::text, 0));

  select count(*) into n
  from public.slate_prompt p
  where p.user_id = uid
    and p.cycle_id = cid;

  if n >= 2 then
    return jsonb_build_object('ok', false, 'code', 'limit', 'remaining', 0);
  end if;

  insert into public.slate_prompt (cycle_id, user_id, body)
  values (cid, uid, body);

  return jsonb_build_object(
    'ok', true,
    'code', 'ok',
    'remaining', 1 - n
  );
end;
$$;

revoke all on function public.slate_member_active(uuid) from public, anon, authenticated;
revoke all on function public.slate_cast_vote(uuid) from public, anon;
revoke all on function public.slate_submit_prompt(text) from public, anon;
grant execute on function public.slate_cast_vote(uuid) to authenticated;
grant execute on function public.slate_submit_prompt(text) to authenticated;

alter table public.slate_cycle enable row level security;
alter table public.slate_story enable row level security;
alter table public.slate_vote enable row level security;
alter table public.slate_prompt enable row level security;

drop policy if exists slate_cycle_public_read on public.slate_cycle;
create policy slate_cycle_public_read
  on public.slate_cycle
  for select
  to anon, authenticated
  using (status = 'open');

drop policy if exists slate_story_public_read on public.slate_story;
create policy slate_story_public_read
  on public.slate_story
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.slate_cycle c
      where c.id = cycle_id
        and c.status = 'open'
        and c.starts_at <= now()
        and c.ends_at > now()
    )
  );

drop policy if exists slate_vote_select_own on public.slate_vote;
create policy slate_vote_select_own
  on public.slate_vote
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists slate_prompt_select_own on public.slate_prompt;
create policy slate_prompt_select_own
  on public.slate_prompt
  for select
  to authenticated
  using (auth.uid() = user_id);

revoke insert, update, delete on public.slate_cycle from anon, authenticated;
revoke insert, update, delete on public.slate_story from anon, authenticated;
revoke insert, update, delete on public.slate_vote from anon, authenticated;
revoke insert, update, delete on public.slate_prompt from anon, authenticated;

grant select on public.slate_cycle, public.slate_story to anon, authenticated;
grant select on public.slate_vote, public.slate_prompt to authenticated;

insert into public.slate_cycle (starts_at, ends_at, status)
select now(), now() + interval '30 days', 'open'
where not exists (
  select 1 from public.slate_cycle where status = 'open'
);

-- Add a card to the open cycle:
-- insert into public.slate_story (
--   cycle_id, title, logline, treatment, image_url, source, member_number, sort_order
-- )
-- select id,
--   'Title',
--   'A logline of twenty-five words or fewer.',
--   'First sentence of the treatment. Second sentence.',
--   'https://media.fjorr.com/app-assets/example.avif',
--   'internal',
--   null,
--   1
-- from public.slate_cycle
-- where status = 'open';
