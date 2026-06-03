'use client';

import React from 'react';
import Link from 'next/link';
/* 🎯 DIRECT IMPORT: Pull ArrowRight straight from Lucide */
import { ArrowRight } from 'lucide-react'; 

export default function HeroHome() {
  return (
    <section className="w-full pt-[40px] pb-[30px] text-center px-[10%]">
      
      {/* 🎬 STEP 1: THE REVEALING HEADLINE */}
      <h1 className="font-futura font-extrabold text-5xl md:text-6xl lg:text-7xl uppercase tracking-tight mb-4 max-w-3xl mx-auto block
        leading-[0.85] 
        md:leading-[0.85] 
        lg:leading-[0.8]
        animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out"
      >
        The world {' '}
        <span className="block">runs on atoms.</span>
        <span className="block">And stories.</span>
      </h1>
      
      {/* 🎬 STEP 2: STAGGERED LEARN MORE LINK 
          🎯 BULLETPROOF TIMING FIX: 
          - Swapped the brittle class-based delay for a native inline style `animationDelay` parameter.
          - Kept 'opacity-0' out, letting Tailwind's 'animate-in' engine natively keep it hidden until the delay completes.
      */}
      <Link 
        href="/about" 
        className="inline-flex items-center gap-1 font-sans font-medium text-[17px] tracking-tight text-white/50 hover:text-white transition-colors group mx-auto w-fit
          animate-in fade-in slide-in-from-bottom-3 duration-700 ease-out fill-mode-both"
        style={{ animationDelay: '500ms' }}
      >
        <span>Learn more</span>
        
        {/* 🎯 THE OPTICAL CENTERING FIX: Injected translate-y-[2px] to nudge the icon down to the true text line */}
        <span className="flex items-center transform translate-x-0 group-hover:translate-x-1 translate-y-[2px] transition-transform duration-200 ease-out">
          <ArrowRight size={18} className="shrink-0" />
        </span>
      </Link>

    </section>
  );
}