-- World-class search foundation:
-- 1) locale rows (internal_id, locale)
-- 2) pg_trgm typo tolerance
-- 3) theme / theme_translation re-sync triggers

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- Schema: locale on search
-- ---------------------------------------------------------------------------
alter table public.search
  add column if not exists locale text not null default 'en';

update public.search set locale = 'en' where locale is null or locale = '';

alter table public.search drop constraint if exists search_internal_id_key;

drop index if exists search_internal_id_key;

create unique index if not exists search_internal_id_locale_uidx
  on public.search (internal_id, locale);

create index if not exists search_locale_item_release_idx
  on public.search (locale, item_type, release_date desc);

create index if not exists search_name_trgm_idx
  on public.search using gin (name gin_trgm_ops);

-- Locale-aware FTS (replace fixed english trigger)
create or replace function public.search_fts_update()
returns trigger
language plpgsql
as $$
declare
  cfg regconfig;
begin
  cfg := case coalesce(new.locale, 'en')
    when 'es' then 'spanish'::regconfig
    when 'fr' then 'french'::regconfig
    when 'de' then 'german'::regconfig
    when 'it' then 'italian'::regconfig
    when 'pt' then 'portuguese'::regconfig
    when 'sv' then 'swedish'::regconfig
    when 'en' then 'english'::regconfig
    else 'simple'::regconfig
  end;
  new.fts_tokens := to_tsvector(cfg, coalesce(new.search_content, ''));
  return new;
end;
$$;

drop trigger if exists tr_search_content_update on public.search;
create trigger tr_search_content_update
before insert or update on public.search
for each row
execute function public.search_fts_update();

-- ---------------------------------------------------------------------------
-- Film sync (locale-aware)
-- ---------------------------------------------------------------------------
create or replace function public.sync_film_to_search(
  p_film_id uuid,
  p_locale text default 'en'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_locale text := coalesce(nullif(trim(p_locale), ''), 'en');
  v_film record;
  v_tr record;
  v_name text;
  v_teaser text;
  v_description text;
  v_note text;
  v_story_date text;
  v_creators text;
  v_theme_name text;
  v_theme_slug text;
  v_rating_name text;
  v_tags text;
  v_transcript text;
  v_location text;
  v_combined_content text;
begin
  select f.* into v_film from public.film f where f.id = p_film_id;

  if not found then
    delete from public.search where internal_id = p_film_id and item_type = 'film';
    return;
  end if;

  v_name := v_film.name;
  v_teaser := v_film.teaser;
  v_description := v_film.description;
  v_note := v_film.note;
  v_story_date := v_film.story_date;
  v_location := nullif(array_to_string(v_film.location, ', '), '');

  if v_locale <> 'en' then
    select * into v_tr
    from public.film_translation ft
    where ft.film_id = p_film_id and ft.locale::text = v_locale
    limit 1;

    if found then
      if nullif(trim(v_tr.name), '') is not null then v_name := v_tr.name; end if;
      if nullif(trim(v_tr.teaser), '') is not null then v_teaser := v_tr.teaser; end if;
      if nullif(trim(v_tr.description), '') is not null then v_description := v_tr.description; end if;
      if nullif(trim(v_tr.note), '') is not null then v_note := v_tr.note; end if;
      if nullif(trim(v_tr.location), '') is not null then v_location := v_tr.location; end if;
    end if;
  end if;

  select t.name, t.slug into v_theme_name, v_theme_slug
  from public.theme t
  where t.id = v_film.theme
  limit 1;

  if v_locale <> 'en' and v_film.theme is not null then
    select tt.name into v_theme_name
    from public.theme_translation tt
    where tt.theme_id = v_film.theme and tt.locale::text = v_locale
      and nullif(trim(tt.name), '') is not null
    limit 1;
  end if;

  select r.name into v_rating_name
  from public.rating r
  where r.id = v_film.rating
  limit 1;

  select string_agg(name, ', ' order by min_sort)
  into v_creators
  from (
    select c.name, min(cm.sort_order) as min_sort
    from public.creator_map cm
    join public.creator c on c.id = cm.creator_id
    where cm.film_id = p_film_id
      and c.name is not null
      and length(trim(c.name)) > 0
    group by c.name
  ) creators;

  select string_agg(t.name, ' ' order by t.name)
  into v_tags
  from public.tag_map tm
  join public.tag t on t.id = tm.tag_id
  where tm.film_id = p_film_id
    and t.name is not null;

  -- EN transcripts only on EN rows (avoid polluting localized FTS)
  if v_locale = 'en' then
    select left(public.clean_vtt(tr.content), 12000)
    into v_transcript
    from public.transcript tr
    where tr.film_id = p_film_id and tr.language_code = 'en'
    order by length(coalesce(tr.content, '')) desc
    limit 1;
  end if;

  v_combined_content := concat_ws(
    ' ',
    nullif(trim(v_name), ''),
    nullif(trim(v_teaser), ''),
    nullif(trim(v_description), ''),
    nullif(trim(v_note), ''),
    nullif(trim(v_story_date), ''),
    v_location,
    v_creators,
    v_rating_name,
    v_theme_name,
    v_tags,
    'film',
    v_transcript
  );

  insert into public.search (
    internal_id, item_type, locale, slug, name, teaser, blok_tall,
    search_content, release_date, rating, theme, theme_slug, runtime, creator, label
  ) values (
    v_film.id, 'film', v_locale, v_film.slug, v_name, v_teaser, v_film.blok_tall,
    v_combined_content, v_film.release_date::date, v_rating_name, v_theme_name,
    v_theme_slug, v_film.runtime, v_creators, null
  )
  on conflict (internal_id, locale) do update set
    item_type = excluded.item_type,
    slug = excluded.slug,
    name = excluded.name,
    teaser = excluded.teaser,
    blok_tall = excluded.blok_tall,
    search_content = excluded.search_content,
    release_date = excluded.release_date,
    rating = excluded.rating,
    theme = excluded.theme,
    theme_slug = excluded.theme_slug,
    runtime = excluded.runtime,
    creator = excluded.creator,
    label = excluded.label,
    updated_at = now();
end;
$$;

-- ---------------------------------------------------------------------------
-- Artifact sync (locale-aware)
-- ---------------------------------------------------------------------------
create or replace function public.sync_artifact_to_search(
  p_artifact_id uuid,
  p_locale text default 'en'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_locale text := coalesce(nullif(trim(p_locale), ''), 'en');
  v_artifact record;
  v_tr record;
  v_name text;
  v_teaser text;
  v_description text;
  v_quote text;
  v_label text;
  v_creators text;
  v_combined_content text;
  v_release date;
begin
  select a.* into v_artifact from public.artifact a where a.id = p_artifact_id;

  if not found then
    delete from public.search where internal_id = p_artifact_id and item_type = 'artifact';
    return;
  end if;

  v_name := v_artifact.name;
  v_teaser := v_artifact.teaser;
  v_description := v_artifact.description;
  v_quote := v_artifact.quote;
  v_label := v_artifact.label;

  if v_locale <> 'en' then
    select * into v_tr
    from public.artifact_translation atr
    where atr.artifact_id = p_artifact_id and atr.locale::text = v_locale
    limit 1;

    if found then
      if nullif(trim(v_tr.name), '') is not null then v_name := v_tr.name; end if;
      if nullif(trim(v_tr.teaser), '') is not null then v_teaser := v_tr.teaser; end if;
      if nullif(trim(v_tr.description), '') is not null then v_description := v_tr.description; end if;
      if nullif(trim(v_tr.quote), '') is not null then v_quote := v_tr.quote; end if;
      if nullif(trim(v_tr.label), '') is not null then v_label := v_tr.label; end if;
    end if;
  end if;

  select string_agg(name, ', ' order by min_sort)
  into v_creators
  from (
    select c.name, min(cm.sort_order) as min_sort
    from public.creator_map cm
    join public.creator c on c.id = cm.creator_id
    where cm.artifact_id = p_artifact_id
      and c.name is not null
      and length(trim(c.name)) > 0
    group by c.name
  ) creators;

  v_release := coalesce(v_artifact.release_date, v_artifact.created_at)::date;

  v_combined_content := concat_ws(
    ' ',
    nullif(trim(v_name), ''),
    nullif(trim(v_teaser), ''),
    nullif(trim(v_description), ''),
    nullif(trim(v_quote), ''),
    nullif(trim(v_label), ''),
    v_creators,
    'artifact'
  );

  insert into public.search (
    internal_id, item_type, locale, slug, name, teaser, blok_tall,
    search_content, release_date, rating, theme, theme_slug, runtime, creator, label
  ) values (
    v_artifact.id, 'artifact', v_locale, v_artifact.slug, v_name, v_teaser, v_artifact.blok_tall,
    v_combined_content, v_release, null, null, null, null, v_creators, v_label
  )
  on conflict (internal_id, locale) do update set
    item_type = excluded.item_type,
    slug = excluded.slug,
    name = excluded.name,
    teaser = excluded.teaser,
    blok_tall = excluded.blok_tall,
    search_content = excluded.search_content,
    release_date = excluded.release_date,
    rating = excluded.rating,
    theme = excluded.theme,
    theme_slug = excluded.theme_slug,
    runtime = excluded.runtime,
    creator = excluded.creator,
    label = excluded.label,
    updated_at = now();
end;
$$;

-- Resync EN + all translated locales for a film / artifact
create or replace function public.sync_film_search_all_locales(p_film_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  perform public.sync_film_to_search(p_film_id, 'en');
  for r in
    select distinct locale::text as locale from public.film_translation where film_id = p_film_id
  loop
    perform public.sync_film_to_search(p_film_id, r.locale);
  end loop;
end;
$$;

create or replace function public.sync_artifact_search_all_locales(p_artifact_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  perform public.sync_artifact_to_search(p_artifact_id, 'en');
  for r in
    select distinct locale::text as locale from public.artifact_translation where artifact_id = p_artifact_id
  loop
    perform public.sync_artifact_to_search(p_artifact_id, r.locale);
  end loop;
end;
$$;

-- Film / artifact triggers → all locales
create or replace function public.tr_sync_film_search()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.sync_film_search_all_locales(new.id);
  return new;
end;
$$;

create or replace function public.tr_sync_artifact_search()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.sync_artifact_search_all_locales(new.id);
  return new;
end;
$$;

create or replace function public.tr_sync_search_from_creator_map()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_film_id uuid;
  v_artifact_id uuid;
begin
  v_film_id := coalesce(new.film_id, old.film_id);
  v_artifact_id := coalesce(new.artifact_id, old.artifact_id);
  if v_film_id is not null then
    perform public.sync_film_search_all_locales(v_film_id);
  end if;
  if v_artifact_id is not null then
    perform public.sync_artifact_search_all_locales(v_artifact_id);
  end if;
  return coalesce(new, old);
end;
$$;

create or replace function public.tr_sync_film_search_from_child()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_film_id uuid;
begin
  v_film_id := coalesce(new.film_id, old.film_id);
  if v_film_id is not null then
    perform public.sync_film_search_all_locales(v_film_id);
  end if;
  return coalesce(new, old);
end;
$$;

-- ---------------------------------------------------------------------------
-- Theme update → refresh search for all films with that theme
-- ---------------------------------------------------------------------------
create or replace function public.tr_theme_resync_search()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  if tg_op = 'UPDATE'
     and new.name is not distinct from old.name
     and new.slug is not distinct from old.slug then
    return new;
  end if;

  for r in select id from public.film where theme = new.id loop
    perform public.sync_film_search_all_locales(r.id);
  end loop;
  return new;
end;
$$;

drop trigger if exists tr_theme_search_resync on public.theme;
create trigger tr_theme_search_resync
after update of name, slug on public.theme
for each row
execute function public.tr_theme_resync_search();

create or replace function public.tr_theme_translation_resync_search()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_locale text;
begin
  v_locale := coalesce(new.locale, old.locale)::text;
  for r in select id from public.film where theme = coalesce(new.theme_id, old.theme_id) loop
    perform public.sync_film_to_search(r.id, v_locale);
  end loop;
  return coalesce(new, old);
end;
$$;

drop trigger if exists tr_theme_translation_search_resync on public.theme_translation;
create trigger tr_theme_translation_search_resync
after insert or update or delete on public.theme_translation
for each row
execute function public.tr_theme_translation_resync_search();

-- ---------------------------------------------------------------------------
-- search_items: locale + FTS + prefix + trigram
-- ---------------------------------------------------------------------------
create or replace function public.search_items(
  search_term text,
  p_locale text default 'en'
)
returns setof search
language plpgsql
security definer
set search_path = public
as $$
declare
  v_raw text := trim(coalesce(search_term, ''));
  v_locale text := coalesce(nullif(trim(p_locale), ''), 'en');
  v_tsquery tsquery;
  v_cfg regconfig;
  r public.search%rowtype;
begin
  if v_raw = '' then
    return;
  end if;

  v_cfg := case v_locale
    when 'es' then 'spanish'::regconfig
    when 'fr' then 'french'::regconfig
    when 'de' then 'german'::regconfig
    when 'it' then 'italian'::regconfig
    when 'pt' then 'portuguese'::regconfig
    when 'sv' then 'swedish'::regconfig
    when 'en' then 'english'::regconfig
    else 'simple'::regconfig
  end;

  begin
    v_tsquery := websearch_to_tsquery(v_cfg, v_raw);
  exception when others then
    v_tsquery := null;
  end;

  for r in
    select s.*
    from public.search s
    where s.locale = v_locale
      and (
        (v_tsquery is not null and v_tsquery <> ''::tsquery and s.fts_tokens @@ v_tsquery)
        or s.name ilike '%' || v_raw || '%'
        or coalesce(s.teaser, '') ilike '%' || v_raw || '%'
        or coalesce(s.creator, '') ilike '%' || v_raw || '%'
        or coalesce(s.theme, '') ilike '%' || v_raw || '%'
        or coalesce(s.label, '') ilike '%' || v_raw || '%'
        or coalesce(s.rating, '') ilike '%' || v_raw || '%'
        or (char_length(v_raw) >= 3 and s.name % v_raw)
      )
    order by
      case
        when lower(s.name) = lower(v_raw) then 100
        when lower(s.name) like lower(v_raw) || '%' then 60
        when lower(s.name) like '%' || lower(v_raw) || '%' then 30
        else 0
      end
      + case
          when v_tsquery is not null and v_tsquery <> ''::tsquery
            then ts_rank(s.fts_tokens, v_tsquery) * 20
          else 0
        end
      + case
          when char_length(v_raw) >= 3 then similarity(s.name, v_raw) * 25
          else 0
        end
      desc,
      s.release_date desc nulls last
    limit 40
  loop
    return next r;
  end loop;

  return;
end;
$$;

grant execute on function public.search_items(text, text) to anon, authenticated, service_role;
grant execute on function public.sync_film_to_search(uuid, text) to service_role;
grant execute on function public.sync_artifact_to_search(uuid, text) to service_role;
grant execute on function public.sync_film_search_all_locales(uuid) to service_role;
grant execute on function public.sync_artifact_search_all_locales(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- Backfill: EN refresh + all translation locales
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in select id from public.film loop
    perform public.sync_film_search_all_locales(r.id);
  end loop;
  for r in select id from public.artifact loop
    perform public.sync_artifact_search_all_locales(r.id);
  end loop;
end;
$$;
