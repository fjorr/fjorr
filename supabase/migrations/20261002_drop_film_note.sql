-- Drop the public film note (the attribution line under the story).
-- Search sync and the translation hash stop reading it before the column goes.

do $patch$
declare
  rec record;
  def text;
  next_def text;
begin
  for rec in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'sync_film_to_search'
  loop
    def := pg_get_functiondef(rec.sig);
    next_def := def;
    next_def := replace(next_def, $old$
  v_note text;$old$, '');
    next_def := replace(next_def, $old$
  v_note := v_film.note;$old$, '');
    next_def := replace(next_def, $old$
      if nullif(trim(v_tr.note), '') is not null then v_note := v_tr.note; end if;$old$, '');
    next_def := replace(next_def, $old$
    nullif(trim(v_note), ''),$old$, '');
    next_def := replace(next_def, $old$
    nullif(trim(v_film.note), ''),$old$, '');
    if next_def ~ 'v_note|v_film\.note|v_tr\.note' then
      raise exception 'sync_film_to_search (%) still references note', rec.sig;
    end if;
    if next_def is distinct from def then
      execute next_def;
    end if;
  end loop;

  def := pg_get_functiondef('public.film_source_hash(public.film)'::regprocedure);
  next_def := replace(def, $old$
    coalesce(f.note, '') || E'\n' ||$old$, '');
  if next_def ~ 'f\.note' then
    raise exception 'film_source_hash still references note';
  end if;
  if next_def is distinct from def then
    execute next_def;
  end if;
end
$patch$;

alter table public.film drop column if exists note;
alter table public.film_translation drop column if exists note;

do $resync$
declare
  r record;
begin
  for r in select id from public.film loop
    perform public.sync_film_search_all_locales(r.id);
  end loop;
end
$resync$;
