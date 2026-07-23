'use client';

import React from 'react';
import SearchExperience from '@/components/SearchExperience';

export default function SearchClient() {
  return (
    <div className="w-full min-h-screen pt-6 pb-24 px-[10%] flex flex-col items-center">
      {/* 🧠 STRUCTURED ACTION DATA: AI Search Engine Discovery Mapping */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Fjorr Search',
            url: 'https://fjorr.com/search',
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://fjorr.com/search?q={search_term_string}',
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />

      <SearchExperience />
    </div>
  );
}
