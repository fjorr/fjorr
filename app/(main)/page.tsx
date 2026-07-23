import React from 'react';
import { cookies } from 'next/headers';
import FilmRailLoader from '@/components/FilmRailLoader';
import ArtifactRailLoader from '@/components/ArtifactRailLoader';
import PromoSplit from '@/components/PromoSplit';
import FeatureRailLoader from '@/components/FeatureRailLoader';
import MinimalHomeLoader from '@/components/MinimalHomeLoader';
import HomeWithSearch from '@/components/HomeWithSearch';
import { DISPLAY_MODE_COOKIE, parseDisplayMode } from '@/lib/display-mode';

export default async function Home() {
  const cookieStore = await cookies();
  const mode = parseDisplayMode(cookieStore.get(DISPLAY_MODE_COOKIE)?.value);

  if (mode === 'minimal') {
    return (
      <HomeWithSearch>
        <MinimalHomeLoader />
      </HomeWithSearch>
    );
  }

  return (
    <HomeWithSearch>
      <div className="w-full mt-6 md:mt-10">
        <FeatureRailLoader />
      </div>

      <div className="w-full flex flex-col gap-6 md:gap-10 mt-6 md:mt-10">
        <FilmRailLoader title="Latest" />
        <FilmRailLoader title="Coming Soon" />
        <ArtifactRailLoader title="Film Artifacts" />
      </div>

      <div className="mt-12 md:mt-16">
        <PromoSplit />
      </div>
    </HomeWithSearch>
  );
}
