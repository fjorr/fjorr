'use client';

import React from 'react';

interface SkeletonLoaderProps {
  variant?: 'feature' | 'poster';
  backgroundColor?: string;
  isDarkBg?: boolean;
  dotOpacity?: number;
}

export default function SkeletonLoader({ 
  variant = 'feature',
  backgroundColor = '#1F1F1F',
  isDarkBg = true,
  dotOpacity
}: SkeletonLoaderProps) {
  
  const dotColor = isDarkBg ? '#FFFFFF' : '#000000';
  
  // 🎯 REMOVED THE GREY FRAME: Dropped 'border-white/10' entirely.
  // We keep a clean wireframe transparent ring configuration to maintain your beautiful rounded corners.
  const wireframeBorder = 'border-transparent';

  const finalOpacity = dotOpacity !== undefined 
    ? dotOpacity 
    : (isDarkBg ? 0.3 : 0.4);

  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <div 
        style={{ 
          backgroundColor,
          /* 🎯 PERFECT EDGES & DOT SYMMETRY:
             By moving the radial gradient directly to the parent backing, setting a fixed 20px cell step, 
             and centering it with a 10px offset, we ensure that the distance from the outer edge 
             to the first row/column of dots perfectly mimics the interior spacing math. */
          backgroundImage: `radial-gradient(${dotColor} 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
          backgroundPosition: '10px 10px',
          opacity: finalOpacity
        }} 
        className={`w-full h-full border ${wireframeBorder} rounded-2xl overflow-hidden relative transition-opacity duration-150 ease-in-out`}
      />
    </div>
  );
}