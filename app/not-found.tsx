'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function NotFound() {
  // Stagger gates to coordinate our cinematic entry cadence
  const [animateHeadline, setAnimateHeadline] = useState(false);
  const [showBodyElements, setShowBodyElements] = useState(false);

  useEffect(() => {
    // 🎥 1. Fire the headline fade-and-glide immediately on page mount
    setAnimateHeadline(true);

    // 🎥 2. Wait exactly 350ms for the headline to land, then bring up the technical metadata strings
    const timer = setTimeout(() => {
      setShowBodyElements(true);
    }, 350);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Navbar />
      
      <div className="w-full h-dvh flex flex-col items-center justify-center bg-[#1f1f1f] text-white px-6 relative font-sans select-none">
        
        {/* COMPACT CENTER PANEL GRID */}
        <div className="max-w-xl text-center flex flex-col items-center gap-4 z-10">
          
          {/* HERO TITLE BLOCK */}
          {/* ⚡ CINEMATIC HEADLINE REVEAL ENGINE */}
          <h1 
            className={`text-[52px] sm:text-[75px] md:text-[95px] font-extrabold uppercase tracking-tighter text-white leading-[0.9] font-futura mx-auto select-none mb-3 transform-gpu transition-all ease-out duration-[900ms] ${
              animateHeadline ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            LOST?
          </h1>
          
          {/* SECONDARY LAYER STAGGER WRAPPER */}
          <div 
            className={`flex flex-col items-center gap-4 transform-gpu transition-all ease-out duration-[700ms] ${
              showBodyElements ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            }`}
          >
          

            {/* THE EDITORIAL DECK BLURB */}
            <p className="text-[15px] md:text-[16px] font-medium font-inter text-zinc-400 max-w-xs tracking-relaxed leading-relaxed mb-4">
              Better stories this way.
            </p>

            {/* ACTION HOVER PILL BUTTON */}
            <div>
              <Link 
                href="/"
                className="inline-flex items-center justify-center bg-white text-black font-semibold font-sans text-[14px] px-8 py-3 rounded-full hover:bg-zinc-200 transition-colors duration-200 ease-out shadow-lg"
              >
                Home
              </Link>
            </div>
          </div>
          
        </div>
      </div>

      <Footer />
    </>
  );
}