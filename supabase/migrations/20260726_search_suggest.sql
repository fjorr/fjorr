-- Closest title suggestion for "Did you mean …?" (includes slug for navigation).

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
  )
  select
    s.name,
    s.slug,
    s.item_type,
    similarity(s.name, q.raw)::real as score
  from public.search s
  cross join q
  where q.raw <> ''
    and char_length(q.raw) >= 3
    and s.locale = q.locale
    and s.name % q.raw
    and similarity(s.name, q.raw) >= 0.35
  order by similarity(s.name, q.raw) desc, s.release_date desc nulls last
  limit 1;
$$;

grant execute on function public.search_suggest(text, text) to anon, authenticated, service_role;
