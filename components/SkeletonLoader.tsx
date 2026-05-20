'use client';

import React from 'react';

interface SkeletonLoaderProps {
  variant?: 'feature' | 'poster';
}

export default function SkeletonLoader({ variant = 'feature' }: SkeletonLoaderProps) {
  // Sets standard 30px frames for wide grids, and a cleaner 12px frame for posters
  const paddingStyle = variant === 'poster' ? 'p-3' : 'p-[30px]';
  const marginStyle = variant === 'poster' ? 'top-3 bottom-3 left-3 right-3' : 'top-[30px] bottom-[30px] left-[30px] right-[30px]';

  return (
    <div className="w-full h-full bg-transparent flex items-center justify-center">
      
      {/* 1. MASTER EXTERIOR CONTAINER FRAME: Updated border to a technical steel-grey/blue */}
      <div className="w-full h-full border border-blue-400/10 rounded-2xl bg-[#1D1D1F] flex items-center justify-center overflow-hidden relative">
        
        {/* 2. SOLID INTERIOR GREY FRAME */}
        <div className={`w-full h-full bg-[#1D1D1F] relative flex items-center justify-center ${paddingStyle}`}>
          
          {/* 3. CLAMPED MATRIX CANVAS:
              Updated from Airbnb pink to high-visibility, crisp steel-blue dots 
          */}
          <div 
            className={`absolute ${marginStyle} opacity-30`}
            style={{
              backgroundImage: 'radial-gradient(rgba(147, 197, 253, 1.0) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              backgroundPosition: 'center', // Symmetrical distribution from center axis outward
            }}
          />

        </div>
      </div>
    </div>
  );
}