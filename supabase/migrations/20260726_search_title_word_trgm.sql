-- Match typos against individual title words (e.g. chmpion → Unexpected Champion).

create or replace function public.title_word_similarity(title text, query text)
returns real
language sql
immutable
as $$
  select coalesce(max(similarity(w, query)), 0)::real
  from unnest(regexp_split_to_array(coalesce(title, ''), '[[:space:]]+')) as w
  where char_length(w) >= 3;
$$;

create or replace function public.title_word_trgm_match(title text, query text)
returns boolean
language sql
immutable
as $$
  select exists (
    select 1
    from unnest(regexp_split_to_array(coalesce(title, ''), '[[:space:]]+')) as w
    where char_length(w) >= 3
      and w % query
  );
$$;

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
        or (
          char_length(v_raw) >= 3
          and (
            s.name % v_raw
            or public.title_word_trgm_match(s.name, v_raw)
          )
        )
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
          when char_length(v_raw) >= 3 then
            greatest(
              similarity(s.name, v_raw),
              public.title_word_similarity(s.name, v_raw)
            ) * 25
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

drop function if exists public.search_suggest(text, text);

create or replace function public.search_suggest(
  search_term text,
  p_locale text default 'en'
)
returns table (
  name text,
  slug text,
  item_type text,
  score real
)
language sql
stable
security definer
set search_path = public
as $$
  with q as (
    select trim(coalesce(search_term, '')) as raw,
           coalesce(nullif(trim(p_locale), ''), 'en') as locale
  ),
  scored as (
    select
      s.name,
      s.slug,
      s.item_type,
      s.release_date,
      greatest(
        similarity(s.name, q.raw),
        public.title_word_similarity(s.name, q.raw)
      )::real as score
    from public.search s
    cross join q
    where q.raw <> ''
      and char_length(q.raw) >= 3
      and s.locale = q.locale
      and (
        s.name % q.raw
        or public.title_word_trgm_match(s.name, q.raw)
      )
  )
  select scored.name, scored.slug, scored.item_type, scored.score
  from scored
  where scored.score >= 0.35
  order by scored.score desc, scored.release_date desc nulls last
  limit 1;
$$;

grant execute on function public.search_items(text, text) to anon, authenticated, service_role;
grant execute on function public.search_suggest(text, text) to anon, authenticated, service_role;
