-- Hybrid search: FTS rank + prefix/substring fallback for short queries.
-- Keeps typing "sho" → Shoebox working after the app cuts over from ilike.

create or replace function public.search_items(search_term text)
returns setof search
language plpgsql
stable
as $$
declare
  v_raw text := trim(coalesce(search_term, ''));
  v_tsquery tsquery;
begin
  if v_raw = '' then
    return;
  end if;

  begin
    v_tsquery := websearch_to_tsquery('english', v_raw);
  exception when others then
    v_tsquery := null;
  end;

  return query
  select s.*
  from public.search s
  where
    (v_tsquery is not null and v_tsquery <> ''::tsquery and s.fts_tokens @@ v_tsquery)
    or s.name ilike '%' || v_raw || '%'
    or coalesce(s.teaser, '') ilike '%' || v_raw || '%'
    or coalesce(s.creator, '') ilike '%' || v_raw || '%'
    or coalesce(s.theme, '') ilike '%' || v_raw || '%'
    or coalesce(s.label, '') ilike '%' || v_raw || '%'
    or coalesce(s.rating, '') ilike '%' || v_raw || '%'
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
    desc,
    s.release_date desc nulls last
  limit 40;
end;
$$;
