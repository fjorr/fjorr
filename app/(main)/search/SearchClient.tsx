'use client';

import React, { Suspense } from 'react';
import SearchExperience from '@/components/SearchExperience';
import { MinimalFilterProvider } from '@/components/MinimalFilterContext';

export default function SearchClient() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen pt-6 pb-24 px-[10%] flex flex-col items-center">
          <div className="text-white/20 font-sans text-sm mt-12 animate-pulse">
            Loading search…
          </div>
        </div>
      }
    >
      <MinimalFilterProvider>
        <div className="w-full min-h-screen pt-6 pb-24 px-[10%] flex flex-col items-center">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: 'Fjorr Search',
                url: 'https://www.fjorr.com/search',
                potentialAction: {
                  '@type': 'SearchAction',
                  target: 'https://www.fjorr.com/search?q={search_term_string}',
                  'query-input': 'required name=search_term_string',
                },
              }),
            }}
          />

          <SearchExperience />
        </div>
      </MinimalFilterProvider>
    </Suspense>
  );
}
