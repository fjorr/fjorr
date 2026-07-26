-- Expand credit_role catalog to match free-text roles used on creator_map,
-- then backfill role_code so film pages can resolve credit_role_translation.

insert into public.credit_role (code, name) values
  ('storyteller', 'Storyteller'),
  ('animator', 'Animator'),
  ('kid', 'Kid'),
  ('author', 'Author'),
  ('manufacturer', 'Manufacturer'),
  ('agency', 'Agency')
on conflict (code) do nothing;

-- Prefer code match, then English display name (case-insensitive).
update public.creator_map cm
set role_code = cr.code
from public.credit_role cr
where cm.role_code is null
  and (
    lower(trim(cm.role)) = cr.code
    or lower(trim(cm.role)) = lower(cr.name)
  );

-- Keep role_code in sync when free-text role is written without a code.
create or replace function public.creator_map_resolve_role_code()
returns trigger
language plpgsql
as $$
begin
  if new.role_code is null and new.role is not null then
    select cr.code into new.role_code
    from public.credit_role cr
    where lower(trim(new.role)) = cr.code
       or lower(trim(new.role)) = lower(cr.name)
    limit 1;
  end if;
  return new;
end;
$$;

drop trigger if exists creator_map_resolve_role_code_trg on public.creator_map;
create trigger creator_map_resolve_role_code_trg
before insert or update of role, role_code on public.creator_map
for each row
execute function public.creator_map_resolve_role_code();
