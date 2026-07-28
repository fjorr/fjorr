'use client';

import React from 'react';
import SkeletonLoader from '@/components/SkeletonLoader';

interface ServerSafeSkeletonProps {
  variant?: 'feature' | 'poster';
  backgroundColor?: string;
  isDarkBg?: boolean;
  dotOpacity?: number;
  className?: string;
}

/** Thin client wrapper so Suspense fallbacks can render the skeleton without a delayed dynamic import. */
export default function ServerSafeSkeleton({
  variant = 'feature',
  backgroundColor,
  isDarkBg,
  dotOpacity,
  className,
}: ServerSafeSkeletonProps) {
  return (
    <SkeletonLoader
      variant={variant}
      backgroundColor={backgroundColor}
      isDarkBg={isDarkBg}
      dotOpacity={dotOpacity}
      className={className}
    />
  );
}
