import React from 'react';
// 🌟 Swap this out for your unified, server-safe client utility
import { createClient } from '@/utils/supabase/server'; 
import FilmRail from './FilmRail';

interface FilmRailLoaderProps {
  title: string;
}

export default async function FilmRailLoader({ title }: FilmRailLoaderProps) {
  // 🌟 Initialize the server connection cleanly inside the function body
  const supabase = await createClient();
  const currentIsoString = new Date().toISOString();
  
  // 🎯 SELECT EXPLICITLY: Ensure these matching strings are queried safely
  let query = supabase
    .from('film')
    .select('id, name, slug, blok_tall, release_date');

  if (title.toLowerCase() === 'coming soon') {
    query = query
      .gt('release_date', currentIsoString)
      .order('release_date', { ascending: true });
  } else {
    query = query
      .lte('release_date', currentIsoString)
      .order('release_date', { ascending: false });
  }

  const { data: rawFilms, error } = await query;

  if (error || !rawFilms || rawFilms.length === 0) {
    console.error(`Error loading rail [${title}]:`, error);
    return null;
  }

  // 🎯 THE SERIALIZATION SHIELD: 
  // We map the database records into a fresh, clean array on the server.
  const serializedFilms = rawFilms.map((film) => ({
    id: film.id,
    name: film.name,
    slug: String(film.slug || '').trim(), // Force conversion to a clean, safe string
    blok_tall: film.blok_tall,
    release_date: film.release_date
  }));

  return <FilmRail title={title} films={serializedFilms} />;
}