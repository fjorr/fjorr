-- Bounty creative briefs — hero image for public /bounties
alter table public.bounties
  add column if not exists hero_image_url text;

comment on column public.bounties.hero_image_url is
  'Public brief hero image URL (media.fjorr.com or similar).';

-- Seed / refresh Civil War visual (replace when you have a dedicated asset)
update public.bounties
set hero_image_url = 'https://media.fjorr.com/assets/fjorr-nominate-poster-ww2.avif'
where slug = 'civil-war'
  and (hero_image_url is null or hero_image_url = '');
