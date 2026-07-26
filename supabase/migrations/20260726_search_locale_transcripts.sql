-- Index locale transcripts on locale search rows (fallback to EN).
-- Fixes: /fr?q=pilotes should hit Unexpected Champion via FR VTT.

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
  v_transcript_lang text;
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

  -- Prefer transcript in this locale; fall back to English.
  v_transcript_lang := case
    when v_locale in ('en', 'es', 'fr', 'it', 'ja') then v_locale
    else 'en'
  end;

  select left(public.clean_vtt(tr.content), 12000)
  into v_transcript
  from public.transcript tr
  where tr.film_id = p_film_id
    and tr.language_code in (v_transcript_lang, 'en')
  order by case when tr.language_code = v_transcript_lang then 0 else 1 end,
           length(coalesce(tr.content, '')) desc
  limit 1;

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

-- Rebuild all film search locales so FR/ES/IT/JA pick up transcripts
do $$
declare
  r record;
begin
  for r in select id from public.film loop
    perform public.sync_film_search_all_locales(r.id);
  end loop;
end;
$$;
