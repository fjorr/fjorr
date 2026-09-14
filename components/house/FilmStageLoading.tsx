'use client';

import React from 'react';
import ServerSafeSkeleton from '@/components/ServerSafeSkeleton';
import HouseFooter from '@/components/house/HouseFooter';
import { HOUSE_STAGE_SIDE_CLASS } from '@/components/house/house-stage-margins';
import Navbar from '@/components/Navbar';

/**
 * Suspense fallback that mirrors FilmStage chrome:
 * navbar stays up; stage keeps size/position; white + subtle black dots.
 */
export default function FilmStageLoading() {
  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-white text-[#0B0B0C]">
      <Navbar variant="dark" />

      <div className={`relative min-h-0 flex-1 overflow-hidden ${HOUSE_STAGE_SIDE_CLASS}`}>
        <ServerSafeSkeleton
          variant="feature"
          backgroundColor="#FFFFFF"
          isDarkBg={false}
          dotOpacity={0.28}
          className="rounded-[8px]"
        />
      </div>

      <HouseFooter staticLanguage />
    </div>
  );
}
