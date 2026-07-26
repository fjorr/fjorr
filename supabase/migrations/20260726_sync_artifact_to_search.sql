-- Artifact search sync — mirror of sync_film_to_search.
-- Populates creator/label/quote/description and keeps rows fresh on edit.

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
    runtime = excluded.runtime,
    creator = excluded.creator,
    label = excluded.label,
    updated_at = now();
end;
$$;

create or replace function public.tr_sync_artifact_search()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.sync_artifact_to_search(new.id);
  return new;
end;
$$;

drop trigger if exists tr_artifact_search_sync on public.artifact;
create trigger tr_artifact_search_sync
after insert or update on public.artifact
for each row
execute function public.tr_sync_artifact_search();

-- Creator map may point at a film or an artifact — refresh the right search row.
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
    perform public.sync_film_to_search(v_film_id);
  end if;

  if v_artifact_id is not null then
    perform public.sync_artifact_to_search(v_artifact_id);
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists tr_creator_map_film_search on public.creator_map;
drop trigger if exists tr_creator_map_search on public.creator_map;
create trigger tr_creator_map_search
after insert or update or delete on public.creator_map
for each row
execute function public.tr_sync_search_from_creator_map();

-- Rebuild all artifact search rows
do $$
declare
  r record;
begin
  for r in select id from public.artifact loop
    perform public.sync_artifact_to_search(r.id);
  end loop;
end;
$$;
