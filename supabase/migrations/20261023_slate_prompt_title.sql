-- A nomination is a title plus a story. The member and the cycle are taken from the session.

alter table public.slate_prompt
  add column if not exists title text;

alter table public.slate_prompt
  add column if not exists member_number integer;

alter table public.slate_prompt drop constraint if exists slate_prompt_body_len;
alter table public.slate_prompt drop constraint if exists slate_prompt_title_len;

alter table public.slate_prompt
  add constraint slate_prompt_title_len
  check (title is null or char_length(btrim(title)) between 1 and 50);

alter table public.slate_prompt
  add constraint slate_prompt_body_len
  check (char_length(btrim(body)) between 1 and 500);

drop function if exists public.slate_submit_prompt(text);

create or replace function public.slate_submit_prompt(p_title text, p_body text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  cid uuid;
  title text;
  body text;
  n integer;
  member_no integer;
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'code', 'signedOut');
  end if;

  if not public.slate_member_active(uid) then
    return jsonb_build_object('ok', false, 'code', 'notMember');
  end if;

  title := btrim(regexp_replace(coalesce(p_title, ''), '\s+', ' ', 'g'));
  body := btrim(regexp_replace(coalesce(p_body, ''), '\s+', ' ', 'g'));

  if char_length(title) < 1 or char_length(title) > 50
     or char_length(body) < 1 or char_length(body) > 500 then
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

  select m.bureaux_number into member_no
  from public.bureaux_memberships m
  where m.user_id = uid
    and m.bureaux_number is not null
  limit 1;

  insert into public.slate_prompt (cycle_id, user_id, title, body, member_number)
  values (cid, uid, title, body, member_no);

  return jsonb_build_object(
    'ok', true,
    'code', 'ok',
    'remaining', 1 - n
  );
end;
$$;

revoke all on function public.slate_submit_prompt(text, text) from public, anon;
grant execute on function public.slate_submit_prompt(text, text) to authenticated;
