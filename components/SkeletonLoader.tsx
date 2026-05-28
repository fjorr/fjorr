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
      
      {/* 1. MASTER EXTERIOR CONTAINER FRAME
          🎯 CONVERTED TO HEX: 'border-blue-400/10' is now a beautiful custom steel-blue wireframe edge color '#1c2533'
      */}
      {/* 🎯 border-[#92E2FF]/30 sets the border opacity to exactly 30% */}
      <div className="w-full h-full border border-[#FFFFFF]/10 rounded-2xl bg-[#1F1F1F] flex items-center justify-center overflow-hidden relative">
        
        {/* 2. SOLID INTERIOR GREY FRAAME */}
        <div className={`w-full h-full bg-[#1F1F1F] relative flex items-center justify-center ${paddingStyle}`}>
          
          {/* 3. CLAMPED MATRIX CANVAS
              🎯 CONVERTED TO HEX: The steel-blue dots are now cleanly baked at full 1.0 opacity inside your 
              radial gradient layout block using '#425875'. 
          */}
          <div 
            className={`absolute ${marginStyle} opacity-20`}
            style={{
              backgroundImage: 'radial-gradient(#FFFFFF 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              backgroundPosition: 'center', // Symmetrical distribution from center axis outward
            }}
          />

        </div>
      </div>
    </div>
  );
}