-- Quote credit, editorial date label, and footnote sources for artifact pages.
-- release_label holds dates that are not a calendar day, e.g. "c. 1600 BC".

alter table public.artifact
  add column if not exists quote_attribution text,
  add column if not exists release_label text,
  add column if not exists sources jsonb not null default '[]'::jsonb;

alter table public.artifact_translation
  add column if not exists quote_attribution text;

comment on column public.artifact.quote_attribution is
  'Short credit shown under the artifact quote.';
comment on column public.artifact.release_label is
  'Display date when release_date is not a real calendar day.';
comment on column public.artifact.sources is
  'Footnote citations: [{ title, url?, for? }].';
