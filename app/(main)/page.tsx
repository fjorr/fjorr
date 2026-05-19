import React from 'react';
import HeroHome from '@/components/HeroHome';
import GridFeatureLoader from '@/components/FeatureRailLoader';
import FilmRailLoader from '@/components/FilmRailLoader';
import ArtifactRailLoader from '@/components/ArtifactRailLoader';
import PromoSplit from '@/components/PromoSplit';

export default function Home() {
  return (
    <div className="w-full min-h-screen bg-dark-01">
      {/* 1. Static Layout Header */}
      <HeroHome />

      {/* 2. Isolated Dynamic Stream Container */}
      <FeatureRailLoader />

      {/* 🎬 FILM RAILS TRACK STACK (Latest & Upcoming Only) */}
      <div className="w-full flex flex-col gap-2 md:gap-4 mt-6 md:mt-10">
        <FilmRailLoader title="Latest" />
        <FilmRailLoader title="Coming Soon" />

        {/* Artifact Rail */}
        <ArtifactRailLoader title="Artifacts" />
      </div>

      {/* 👑 THE PROMO COMPONENT ADDS SEPARATELY AND CLEANLY HERE */}
      <div className="mt-12 md:mt-16">
        <PromoSplit />
      </div>
      
    </div>
  );
}