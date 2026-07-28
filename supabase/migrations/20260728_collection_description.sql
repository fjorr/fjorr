-- Collection one-line POV copy (EN source). Optional; shown under mix title.
alter table public.collection
  add column if not exists description text;

comment on column public.collection.description is
  'Optional one-line POV under the mix title (English source).';

-- Locale overlays (same pattern as film/artifact translation).
alter table public.collection_translation
  add column if not exists description text;
