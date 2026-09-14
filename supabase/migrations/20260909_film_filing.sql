-- Filing: search portrait + tag kinds + tag_map → search resync
-- Apply: supabase --experimental db query --workdir /Users/thor/code/fjorr --linked -f supabase/migrations/20260909_film_filing.sql
-- Or via pooler/psql when network allows.

alter table public.film add column if not exists search_portrait text;
alter table public.tag add column if not exists kind text;

do $$ begin
  alter table public.tag drop constraint if exists tag_kind_check;
  alter table public.tag add constraint tag_kind_check
    check (kind is null or kind in ('mood', 'craft', 'setting', 'arc', 'other'));
end $$;

update public.tag set kind = 'mood'
where slug in (
  'quiet','intense','warm','cold','dark','poetic','gritty','curious','lonely',
  'light','urgency','pressure','chaos'
);

update public.tag set kind = 'craft'
where slug in (
  'cinematic','minimal','silent','raw','slow','fast','noir','abstract','classic',
  'music','experiment','design','craft'
);

update public.tag set kind = 'setting'
where slug in (
  'city','nature','space','war','sports','technology','underground','business',
  'science','culture','history'
);

update public.tag set kind = 'arc'
where slug in (
  'underdog','rivalry','breakthrough','comeback','obsession','reinvention',
  'discovery','exploration','escape','rise','fall','failure','sacrifice',
  'survivor','turning-point','turning point','momentum','pivot','origin',
  'outsider','visionary','dreamer','driven','defiant','rebel','leader','builder',
  'risk-taker','gamble','stakes','control','consequence','collapse','resistance',
  'relentless','perfectionist','loyal','doubt','uncertainty','first','last','real',
  'adventure','art','comedy','drama','risk'
);

update public.tag set kind = 'other' where kind is null;

create or replace function public.trg_tag_map_resync_film()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fid uuid;
begin
  fid := coalesce(NEW.film_id, OLD.film_id);
  if fid is not null then
    begin
      perform public.sync_film_to_search(fid);
    exception
      when undefined_function then
        null;
    end;
  end if;
  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists tag_map_resync_film on public.tag_map;
create trigger tag_map_resync_film
  after insert or update or delete on public.tag_map
  for each row
  execute function public.trg_tag_map_resync_film();
