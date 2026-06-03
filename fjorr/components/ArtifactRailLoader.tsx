import React from 'react';
// 🌟 Swap this out for your unified, server-safe client utility
import { createClient } from '@/utils/supabase/server'; 
import ArtifactRail from './ArtifactRail';

interface ArtifactRailLoaderProps {
  title: string;
}

export default async function ArtifactRailLoader({ title }: ArtifactRailLoaderProps) {
  // 🌟 Initialize the server connection cleanly inside the function body
  const supabase = await createClient();

  // Query the global artifact pool safely using the request-scoped client
  const { data: artifacts, error } = await supabase
    .from('artifact')
    .select('id, slug, name, blok_tall')
    .order('created_at', { ascending: false })
    .limit(12); // Keep the homepage track performant and snappy

  if (error || !artifacts || artifacts.length === 0) {
    console.error(`Error loading artifact rail [${title}]:`, error);
    return null;
  }

  // Pass data to the clean presentation rail
  return <ArtifactRail title={title} artifacts={artifacts} />;
}