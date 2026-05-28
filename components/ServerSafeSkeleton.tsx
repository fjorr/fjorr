'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// 🎯 We handle the dynamic engine import safely isolated on the client side
const MasterSkeletonLoader = dynamic(() => import('@/components/SkeletonLoader'), {
  ssr: false,
});

interface ServerSafeSkeletonProps {
  variant?: 'feature' | 'poster';
}

export default function ServerSafeSkeleton({ variant = 'feature' }: ServerSafeSkeletonProps) {
  return <MasterSkeletonLoader variant={variant} />;
}