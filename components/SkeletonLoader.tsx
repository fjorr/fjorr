'use client';

import React from 'react';

interface SkeletonLoaderProps {
  variant?: 'feature' | 'poster';
  backgroundColor?: string;
  isDarkBg?: boolean;
  /** 0–1 hint → color-mix strength for dots (default matches account sidebar). */
  dotOpacity?: number;
  /** Overrides default rounded-2xl — use to match host chrome (e.g. feature rail). */
  className?: string;
}

/** Same fine grid as the account sidebar — denser, quieter than the old 20px matrix. */
function dotGridImage(dotColor: string, mixPercent: number) {
  return `radial-gradient(
    color-mix(in srgb, ${dotColor} ${mixPercent}%, transparent) 0.7px,
    transparent 0.7px
  )`;
}

export default function SkeletonLoader({
  variant = 'feature',
  backgroundColor = '#1F1F1F',
  isDarkBg = true,
  dotOpacity,
  className,
}: SkeletonLoaderProps) {
  const dotColor = isDarkBg ? '#FFFFFF' : '#000000';
  const mixPercent =
    dotOpacity !== undefined
      ? Math.min(40, Math.max(8, Math.round(dotOpacity * 50)))
      : 14;

  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <div
        style={{
          backgroundColor,
          backgroundImage: dotGridImage(dotColor, mixPercent),
          backgroundSize: '7px 7px',
        }}
        className={`w-full h-full border border-transparent overflow-hidden relative transition-opacity duration-150 ease-in-out ${
          className ?? 'rounded-2xl'
        }`}
        aria-hidden
        data-variant={variant}
      />
    </div>
  );
}
