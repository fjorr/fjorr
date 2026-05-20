import React from 'react';
import HeroHome from '@/components/HeroHome';
import FilmRailLoader from '@/components/FilmRailLoader';
import ArtifactRailLoader from '@/components/ArtifactRailLoader';
import PromoSplit from '@/components/PromoSplit';
// 🎯 IMPORT DIRECTLY: Bringing in the raw loader component for quick visual preview
import SkeletonLoader from '@/components/SkeletonLoader';

export default function Home() {
  return (
    <div className="w-full min-h-screen bg-dark-01">
      {/* 1. Static Layout Header */}
      <HeroHome />

      {/* 2. 🧪 DIRECT VISUAL TEST INJECTION FRAME */}
      {/* Pins the loader perfectly on your home screen with no data hooks required */}
      <div className="w-full px-8 md:px-16 pb-10">
        <div className="w-full max-w-[1440px] mx-auto h-[480px] sm:h-[440px] md:h-[480px] lg:h-[520px]">
          <SkeletonLoader />
        </div>
      </div>

      {/* 🎬 FILM RAILS TRACK STACK (Latest & Upcoming Only) */}
      <div className="w-full flex flex-col gap-2 md:gap-4 mt-6 md:mt-10">
        <FilmRailLoader title="Latest" />
        <FilmRailLoader title="Coming Soon" />

        {/* Artifact Rail */}
        <ArtifactRailLoader title="Film Artifacts" />
      </div>

      {/* 👑 THE PROMO COMPONENT ADDS SEPARATELY AND CLEANLY HERE */}
      <div className="mt-12 md:mt-16">
        <PromoSplit />
      </div>
      
    </div>
  );
}