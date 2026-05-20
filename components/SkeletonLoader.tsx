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
      
      {/* 1. MASTER EXTERIOR CONTAINER FRAME: Set to solid #1D1D1F */}
      <div className="w-full h-full border border-[#FF5A5F]/15 rounded-2xl bg-[#1D1D1F] flex items-center justify-center overflow-hidden relative">
        
        {/* 2. SOLID INTERIOR GREY FRAME: Matches exact #1D1D1F requirement */}
        <div className={`w-full h-full bg-[#1D1D1F] relative flex items-center justify-center ${paddingStyle}`}>
          
          {/* 3. CLAMPED MATRIX CANVAS: 
              Clamps the fine 1px dots cleanly inside the 30px or 12px frame walls.
          */}
          <div 
            className={`absolute ${marginStyle} opacity-40`}
            style={{
              backgroundImage: 'radial-gradient(rgba(255, 90, 95, 1.0) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              backgroundPosition: 'center', // Symmetrical distribution from center axis outward
            }}
          />

        </div>
      </div>
    </div>
  );
}