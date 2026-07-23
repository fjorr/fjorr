import React from 'react';
import { createClient } from '@/utils/supabase/server';
import FeatureRailClient from './FeatureRailClient';

export default async function FeatureRailLoader() {
  const supabase = await createClient();

  const { data: collectionRow, error: collectionError } = await supabase
    .from('collection')
    .select('id')
    .eq('slug', 'featured')
    .maybeSingle();

  if (collectionError || !collectionRow) {
    console.error('Could not locate the featured collection UUID reference.');
    return null;
  }

  const { data: mappedCollectionRows, error } = await supabase
    .from('collection_map')
    .select(`
      sort_order,
      film (
        id,
        name,
        slug,
        mux_playback_id,
        last_line,
        teaser,
        story_date,
        location,
        hero_wide,
        hero_clsx,
        hero_tall,
        title_art_code,
        title_art_hex,
        title_art_scale,
        runtime,
        rating ( name ),
        theme ( name ),
        creator:sponsor_id ( name )
      )
    `)
    .eq('collection_id', collectionRow.id)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Feature collection query failed:', error.message);
    return null;
  }

  const processedFilms = (mappedCollectionRows || [])
    .map((row: any) => {
      const f = row.film;
      if (!f) return null;

      const sponsorObj = f.creator || f.sponsor;

      return {
        ...f,
        sponsor:
          typeof sponsorObj === 'object' && sponsorObj !== null
            ? sponsorObj.name
            : sponsorObj,
      };
    })
    .filter(Boolean);

  if (processedFilms.length === 0) return null;

  return <FeatureRailClient films={processedFilms} />;
}
