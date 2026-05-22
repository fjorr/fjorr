import React from 'react';
import HeroHome from '@/components/HeroHome';
import FilmRailLoader from '@/components/FilmRailLoader';
import ArtifactRailLoader from '@/components/ArtifactRailLoader';
import PromoSplit from '@/components/PromoSplit';
// 🎯 IMPORT THE LOADER: Pulling in the smart database-connected wrapper
import FeatureRailLoader from '@/components/FeatureRailLoader';

export default function Home() {
  return (
    <div className="w-full min-h-screen bg-dark-01">
      {/* 1. Static Layout Header Banner */}
      <HeroHome />

      {/* 🎬 2. LIVE FEATURE RAIL (TOP ANCHOR)
          🎯 FIXED: Using FeatureRailLoader directly. No fake props needed! 
          It handles its own Supabase fetch and streams the live data cleanly.
      */}
      <div className="w-full mt-6 md:mt-10">
        <FeatureRailLoader />
      </div>

      {/* 🎬 3. FILM & ARTIFACT LOADER TRACK STACK */}
      {/* 🎯 FIXED: Increased gap-2 to gap-6 (mobile) and md:gap-4 to md:gap-10 (desktop) 
          to add clean padding between the freshly flattened rail layers */}
      <div className="w-full flex flex-col gap-6 md:gap-10 mt-6 md:mt-10">
        {/* Latest Releases Rail */}
        <FilmRailLoader title="Latest" />
        
        {/* Coming Soon Rail */}
        <FilmRailLoader title="Coming Soon" />

        {/* Film Artifacts Rail */}
        <ArtifactRailLoader title="Film Artifacts" />
      </div>

      {/* 👑 4. THE PROMO COMPONENT CORNER SPLIT */}
      <div className="mt-12 md:mt-16">
        <PromoSplit />
      </div>
      
    </div>
  );
}