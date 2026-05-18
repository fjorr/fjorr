import React from 'react';
import { createClient } from '@supabase/supabase-js';
import ArtifactRail from './ArtifactRail';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ArtifactRailLoaderProps {
  title: string;
}

export default async function ArtifactRailLoader({ title }: ArtifactRailLoaderProps) {
  // Query the global artifact pool
  const { data: artifacts, error } = await supabase
    .from('artifact')
    .select('id, slug, name, blok_tall')
    .order('created_at', { ascending: false })
    .limit(12); // Keep the homepage track performant and snappy

  if (error || !artifacts || artifacts.length === 0) {
    return null;
  }

  // Pass data to the clean presentation rail
  return <ArtifactRail title={title} artifacts={artifacts} />;
}