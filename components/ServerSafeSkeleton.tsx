'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const MasterSkeletonLoader = dynamic(() => import('@/components/SkeletonLoader'), {
  ssr: false,
});

interface ServerSafeSkeletonProps {
  variant?: 'feature' | 'poster';
  backgroundColor?: string;
  isDarkBg?: boolean;
  dotOpacity?: number; // 🎯 Catch the opacity modifier parameter
}

export default function ServerSafeSkeleton({ variant = 'feature', backgroundColor, isDarkBg, dotOpacity }: ServerSafeSkeletonProps) {
  return <MasterSkeletonLoader variant={variant} backgroundColor={backgroundColor} isDarkBg={isDarkBg} dotOpacity={dotOpacity} />;
}