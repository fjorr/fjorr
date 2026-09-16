'use client';

import React from 'react';
import CommandLine from '@/components/house/CommandLine';
import { useRouter } from '@/i18n/navigation';

export default function SearchPageClient({
  initialQuery,
}: {
  initialQuery: string;
}) {
  const router = useRouter();

  return (
    <CommandLine
      films={[]}
      initialQuery={initialQuery}
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
