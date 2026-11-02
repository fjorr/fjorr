'use client';

import React, { Suspense } from 'react';
import CommandLine from '@/components/house/CommandLine';
import { useRouter } from '@/i18n/navigation';

function HomeBrowseInner() {
  const router = useRouter();

  return (
    <CommandLine
      films={[]}
      embedded
      onPlay={(hit) => {
        if (hit.kind === 'artifact') {
          router.push(`/artifact/${hit.slug}`);
          return;
        }
        router.push(`/film/${hit.slug}`);
      }}
    />
  );
}

/** Browse under the home hero. */
export default function HomeBrowse() {
  return (
    <section className="pb-20 pt-6 md:pb-32 md:pt-10" aria-label="Browse">
      <Suspense fallback={null}>
        <HomeBrowseInner />
      </Suspense>
    </section>
  );
}
