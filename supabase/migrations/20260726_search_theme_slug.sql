-- Stable theme dial key on search rows (locale-safe filter).

alter table public.search
  add column if not exists theme_slug text;

create index if not exists search_theme_slug_idx
  on public.search (theme_slug)
  where theme_slug is not null;

create or replace function public.sync_film_to_search(p_film_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_film record;
  v_creators text;
  v_theme_name text;
  v_theme_slug text;
  v_rating_name text;
  v_tags text;
  v_transcript text;
  v_location text;
  v_combined_content text;
begin
  select f.*
  into v_film
  from public.film f
  where f.id = p_film_id;

  if not found then
    delete from public.search where internal_id = p_film_id and item_type = 'film';
    return;
  end if;

  select t.name, t.slug into v_theme_name, v_theme_slug
  from public.theme t
  where t.id = v_film.theme
  limit 1;

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

  select left(public.clean_vtt(tr.content), 12000)
  into v_transcript
  from public.transcript tr
  where tr.film_id = p_film_id
    and tr.language_code = 'en'
  order by length(coalesce(tr.content, '')) desc
  limit 1;

  v_location := nullif(array_to_string(v_film.location, ', '), '');

  v_combined_content := concat_ws(
    ' ',
    nullif(trim(v_film.name), ''),
    nullif(trim(v_film.teaser), ''),
    nullif(trim(v_film.description), ''),
    nullif(trim(v_film.note), ''),
    nullif(trim(v_film.story_date), ''),
    v_location,
    v_creators,
    v_rating_name,
    v_theme_name,
    v_tags,
    'film',
    v_transcript
  );

  insert into public.search (
    internal_id,
    item_type,
    slug,
    name,
    teaser,
    blok_tall,
    search_content,
    release_date,
    rating,
    theme,
    theme_slug,
    runtime,
    creator,
    label
  ) values (
    v_film.id,
    'film',
    v_film.slug,
    v_film.name,
    v_film.teaser,
    v_film.blok_tall,
    v_combined_content,
    v_film.release_date::date,
    v_rating_name,
    v_theme_name,
    v_theme_slug,
    v_film.runtime,
    v_creators,
    null
  )
  on conflict (internal_id) do update set
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

-- Artifacts have no theme; keep theme_slug null on sync.
create or replace function public.sync_artifact_to_search(p_artifact_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_artifact record;
  v_creators text;
  v_combined_content text;
  v_release date;
begin
  select a.*
  into v_artifact
  from public.artifact a
  where a.id = p_artifact_id;

  if not found then
    delete from public.search
    where internal_id = p_artifact_id
      and item_type = 'artifact';
    return;
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
    nullif(trim(v_artifact.name), ''),
    nullif(trim(v_artifact.teaser), ''),
    nullif(trim(v_artifact.description), ''),
    nullif(trim(v_artifact.quote), ''),
    nullif(trim(v_artifact.label), ''),
    v_creators,
    'artifact'
  );

  insert into public.search (
    internal_id,
    item_type,
    slug,
    name,
    teaser,
    blok_tall,
    search_content,
    release_date,
    rating,
    theme,
    theme_slug,
    runtime,
    creator,
    label
  ) values (
    v_artifact.id,
    'artifact',
    v_artifact.slug,
    v_artifact.name,
    v_artifact.teaser,
    v_artifact.blok_tall,
    v_combined_content,
    v_release,
    null,
    null,
    null,
    null,
    v_creators,
    v_artifact.label
  )
  on conflict (internal_id) do update set
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

-- Backfill films
do $$
declare
  r record;
begin
  for r in select id from public.film loop
    perform public.sync_film_to_search(r.id);
  end loop;
end;
$$;
