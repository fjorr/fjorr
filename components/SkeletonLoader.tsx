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
  const paddingStyle = variant === 'poster' ? 'p-3' : 'p-[30px]';
  const marginStyle = variant === 'poster' ? 'top-3 bottom-3 left-3 right-3' : 'top-[30px] bottom-[30px] left-[30px] right-[30px]';

  const dotColor = isDarkBg ? '#FFFFFF' : '#000000';
  const wireframeBorder = isDarkBg ? 'border-white/10' : 'border-black/10';

  const finalOpacity = dotOpacity !== undefined 
    ? dotOpacity 
    : (isDarkBg ? 0.3 : 0.4);

  return (
    /* 🎯 UNBREAKABLE FLEX BOX FRAME:
       We force the root container to always be fully expanded (w-full h-full) 
       and flex-centered so your inner matrix grid never collapses to 0px! */
    <div className="w-full h-full flex items-center justify-center relative">
      <div 
        style={{ backgroundColor }} 
        className={`w-full h-full border ${wireframeBorder} rounded-2xl flex items-center justify-center overflow-hidden relative`}
      >
        <div style={{ backgroundColor }} className={`w-full h-full relative flex items-center justify-center ${paddingStyle}`}>
          
          <div 
            className={`absolute ${marginStyle}`}
            style={{
              backgroundImage: `radial-gradient(${dotColor} 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
              backgroundPosition: 'center',
              opacity: finalOpacity,
              transition: 'opacity 150ms ease',
            }}
          />

        </div>
      </div>
    </div>
  );
}