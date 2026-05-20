'use client';

import React, { useState } from 'react';

interface ContactPillProps {
  email?: string;
  className?: string;
}

export const ContactPill: React.FC<ContactPillProps> = ({ 
  email = 'scout@fjorr.com', 
  className = '' 
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      
      // Hold feedback frame for 3.5 seconds before resetting state loop
      setTimeout(() => setCopied(false), 3500);
    } catch (err) {
      console.error('Hardware clipboard access transaction rejected:', err);
    }
  };

  return (
    // Removed the rigid h-12 restriction from the container so it allows the expanded success state to breathe
    <div className={`relative flex items-center justify-center min-w-[240px] select-none ${className}`}>
      {!copied ? (
        <button
          onClick={handleCopy}
          // The base button stays locked at its native layout height scale
          className="h-12 px-6 py-2.5 bg-white text-black font-semibold text-[14px] rounded-full hover:bg-[#F5F5F7] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-xl font-inter"
        >
          Let&apos;s talk
        </button>
      ) : (
        /* 🎯 THE EXPANDED MATRIX FEEDBACK PILL */
        <div 
          // 🎯 CHANGED: Replaced py-2.5 with py-3.5 to physically give the dark capsule more height and presence on screen
          className="relative px-7 py-3.5 rounded-full font-semibold text-[14px] text-[#73ACE9] flex items-center justify-center gap-2 font-inter overflow-hidden animate-in zoom-in-95 fade-in duration-200 shadow-2xl"
          style={{ backgroundColor: '#1F1F1F' }} 
        >
          {/* 🌌 THE ELECTRIC-BLUE DOT MATRIX BG LAYER */}
          <div 
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#73ACE9 1px, transparent 1px)',
              backgroundSize: '5px 5px',
            }}
          />

          {/* THE TEXT PRESENTER LAYER */}
          <span className="relative z-10 tracking-wide text-[#b1d1f4] select-none">
            Email copied. Fire away.
          </span>
        </div>
      )}
    </div>
  );
};