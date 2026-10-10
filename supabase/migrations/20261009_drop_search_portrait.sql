-- search_portrait was added for public Intelligence matching and never read.
-- Private discovery notes stay in film_filing.

alter table public.film drop column if exists search_portrait;
