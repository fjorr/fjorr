-- Fix: RLS policies alone aren't enough — roles need table privileges.
grant select on table public.profiles to anon, authenticated;
grant insert, update on table public.profiles to authenticated;

-- Sequence used for member_number defaults (inserts via ensure_own_profile)
grant usage, select on sequence public.profiles_member_number_seq to authenticated;
