import React from 'react';
import { createClient } from '@supabase/supabase-js';
import FilmRail from './FilmRail';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface FilmRailLoaderProps {
  title: string;
}

export default async function FilmRailLoader({ title }: FilmRailLoaderProps) {
  const currentIsoString = new Date().toISOString();
  
  // 🎯 SELECT EXPLICITLY: Ensure these matching strings are queried
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
  // This strips out complex database metadata and guarantees 'slug' exists as a top-level string.
  const serializedFilms = rawFilms.map((film) => ({
    id: film.id,
    name: film.name,
    slug: String(film.slug || '').trim(), // Force conversion to a clean, safe string
    blok_tall: film.blok_tall,
    release_date: film.release_date
  }));

  return <FilmRail title={title} films={serializedFilms} />;
}