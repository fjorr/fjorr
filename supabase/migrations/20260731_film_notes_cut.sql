-- Stamp Plus notes with the live cut they were filed against.

alter table public.film_notes
  add column if not exists film_version integer not null default 1
  check (film_version >= 1);

alter table public.film_notes
  add column if not exists film_version_id uuid;

update public.film_notes n
set
  film_version_id = f.current_version_id,
  film_version = coalesce(f.version, 1)
from public.film f
where f.id = n.film_id
  and (n.film_version_id is null or n.film_version is distinct from coalesce(f.version, 1));

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'film_notes_film_version_id_fkey'
  ) then
    alter table public.film_notes
      add constraint film_notes_film_version_id_fkey
      foreign key (film_version_id)
      references public.film_version (id)
      on delete set null;
  end if;
end $$;

comment on column public.film_notes.film_version is
  'Cut number the member watched when filing (v1, v2…). Frozen.';
comment on column public.film_notes.film_version_id is
  'FK to film_version at file time. Frozen.';

create index if not exists film_notes_film_version_id_idx
  on public.film_notes (film_version_id);
