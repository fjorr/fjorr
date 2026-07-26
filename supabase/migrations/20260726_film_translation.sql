-- =============================================================================
-- Fjorr i18n — film template (SAFE for current production schema)
-- Reviewed against live schema dump — additive only; does not alter film/artifact
-- English copy stays on public.film.*; other locales in film_translation.
-- =============================================================================

-- Idempotent enums
do $$ begin
  create type public.app_locale as enum ('es', 'fr', 'it', 'de', 'pt', 'ja', 'zh-tw');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.translation_status as enum ('auto', 'reviewed', 'stale');
exception when duplicate_object then null;
end $$;

-- -----------------------------------------------------------------------------
-- theme_translation
-- NOTE: public.theme already has unique `slug` — use that as the stable filter key.
-- Do NOT add a redundant `code` column.
-- -----------------------------------------------------------------------------
create table if not exists public.theme_translation (
  theme_id uuid not null references public.theme (id) on delete cascade,
  locale public.app_locale not null,
  name text not null,
  source_hash text,
  status public.translation_status not null default 'auto',
  updated_at timestamptz not null default now(),
  primary key (theme_id, locale)
);

create index if not exists theme_translation_locale_idx
  on public.theme_translation (locale);

-- -----------------------------------------------------------------------------
-- credit roles (additive). Keeps existing creator_map.role text intact.
-- -----------------------------------------------------------------------------
create table if not exists public.credit_role (
  code text primary key,
  name text not null
);

create table if not exists public.credit_role_translation (
  role_code text not null references public.credit_role (code) on delete cascade,
  locale public.app_locale not null,
  name text not null,
  source_hash text,
  status public.translation_status not null default 'auto',
  updated_at timestamptz not null default now(),
  primary key (role_code, locale)
);

alter table public.creator_map
  add column if not exists role_code text references public.credit_role (code);

insert into public.credit_role (code, name) values
  ('director', 'Director'),
  ('writer', 'Writer'),
  ('producer', 'Producer'),
  ('cinematographer', 'Cinematographer'),
  ('editor', 'Editor'),
  ('composer', 'Composer'),
  ('sponsor', 'Sponsor')
on conflict (code) do nothing;

-- Best-effort backfill from existing free-text roles (won't match every variant)
update public.creator_map cm
set role_code = lower(trim(cm.role))
where cm.role_code is null
  and exists (
    select 1 from public.credit_role cr
    where cr.code = lower(trim(cm.role))
  );

-- -----------------------------------------------------------------------------
-- film_translation
-- location on film is text[] — we store a single translated string (joined).
-- alt_text + last_line_attribution included (present on your film table).
-- -----------------------------------------------------------------------------
create table if not exists public.film_translation (
  film_id uuid not null references public.film (id) on delete cascade,
  locale public.app_locale not null,

  name text,
  teaser text,
  description text,
  note text,
  last_line text,
  last_line_attribution text,
  location text,
  alt_text text,

  title_art_code text,
  blok_ogrf text,

  source_hash text,
  status public.translation_status not null default 'auto',
  provider text,
  updated_at timestamptz not null default now(),

  primary key (film_id, locale)
);

create index if not exists film_translation_locale_idx
  on public.film_translation (locale);

create index if not exists film_translation_status_idx
  on public.film_translation (status)
  where status in ('stale', 'auto');

-- -----------------------------------------------------------------------------
-- Hash EN source fields (film.location is text[])
-- -----------------------------------------------------------------------------
create or replace function public.film_source_hash(f public.film)
returns text
language sql
immutable
as $$
  select md5(
    coalesce(f.name, '') || E'\n' ||
    coalesce(f.teaser, '') || E'\n' ||
    coalesce(f.description, '') || E'\n' ||
    coalesce(f.note, '') || E'\n' ||
    coalesce(f.last_line, '') || E'\n' ||
    coalesce(f.last_line_attribution, '') || E'\n' ||
    coalesce(f.alt_text, '') || E'\n' ||
    coalesce(array_to_string(f.location, '|'), '')
  );
$$;

create or replace function public.film_mark_translations_stale()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.film_source_hash(old) is distinct from public.film_source_hash(new) then
    update public.film_translation
    set status = 'stale',
        updated_at = now()
    where film_id = new.id
      and status is distinct from 'reviewed';
  end if;
  return new;
end;
$$;

drop trigger if exists film_translations_stale_on_update on public.film;
create trigger film_translations_stale_on_update
  after update on public.film
  for each row
  execute function public.film_mark_translations_stale();

-- -----------------------------------------------------------------------------
-- RLS (public read; writes via service role only)
-- -----------------------------------------------------------------------------
alter table public.film_translation enable row level security;
alter table public.theme_translation enable row level security;
alter table public.credit_role enable row level security;
alter table public.credit_role_translation enable row level security;

drop policy if exists "Public read film_translation" on public.film_translation;
create policy "Public read film_translation"
  on public.film_translation for select
  to anon, authenticated
  using (true);

drop policy if exists "Public read theme_translation" on public.theme_translation;
create policy "Public read theme_translation"
  on public.theme_translation for select
  to anon, authenticated
  using (true);

drop policy if exists "Public read credit_role" on public.credit_role;
create policy "Public read credit_role"
  on public.credit_role for select
  to anon, authenticated
  using (true);

drop policy if exists "Public read credit_role_translation" on public.credit_role_translation;
create policy "Public read credit_role_translation"
  on public.credit_role_translation for select
  to anon, authenticated
  using (true);

-- =============================================================================
-- DO NOT RUN YET — search locale (conflicts with current UNIQUE)
-- =============================================================================
-- public.search.internal_id is UNIQUE today → one row per item (EN only).
-- Adding locale requires changing uniqueness to (internal_id, locale) first:
--
--   alter table public.search add column if not exists locale text not null default 'en';
--   alter table public.search drop constraint if exists search_internal_id_key;
--   -- also drop unique index if named differently, e.g.:
--   -- drop index if exists search_internal_id_key;
--   create unique index if not exists search_internal_id_locale_uidx
--     on public.search (internal_id, locale);
--
-- Then rebuild fts_tokens per locale. Handle in a later migration + Edge Function.
