'use client';

import React from 'react';
import SkeletonLoader from '@/components/SkeletonLoader';

interface ServerSafeSkeletonProps {
  variant?: 'feature' | 'poster';
  backgroundColor?: string;
  isDarkBg?: boolean;
  dotOpacity?: number;
}

/** Thin client wrapper so Suspense fallbacks can render the skeleton without a delayed dynamic import. */
export default function ServerSafeSkeleton({
  variant = 'feature',
  backgroundColor,
  isDarkBg,
  dotOpacity,
}: ServerSafeSkeletonProps) {
  return (
    <SkeletonLoader
      variant={variant}
      backgroundColor={backgroundColor}
      isDarkBg={isDarkBg}
      dotOpacity={dotOpacity}
    />
  );
}
