-- Drop unused empty-result logging (avoid table bloat until analytics are needed).
drop table if exists public.search_event;
