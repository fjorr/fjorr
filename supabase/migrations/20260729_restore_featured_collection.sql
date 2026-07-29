-- Ensure homepage Feature rail collection exists.
-- App reads collection.slug = 'featured' via getFeaturedFilms().

insert into public.collection (name, slug, description, status)
select 'Featured', 'featured', 'Homepage feature rail', 'live'
where not exists (select 1 from public.collection where slug = 'featured');

with feat as (
  select id from public.collection where slug = 'featured' limit 1
),
films as (
  select id, slug,
    case slug
      when 'moonshot' then 1
      when 'shoebox' then 2
      when 'unexpected-champion' then 3
      when 'steve-jobs-pep-talk' then 4
    end as sort_order
  from public.film
  where slug in (
    'moonshot',
    'shoebox',
    'unexpected-champion',
    'steve-jobs-pep-talk'
  )
)
insert into public.collection_map (collection_id, film_id, sort_order)
select feat.id, films.id, films.sort_order
from feat, films
where films.sort_order is not null
  and not exists (
    select 1 from public.collection_map cm
    where cm.collection_id = feat.id and cm.film_id = films.id
  );
