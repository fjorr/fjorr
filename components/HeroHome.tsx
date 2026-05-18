import React from 'react';
import Link from 'next/link';

import { Icon } from '@/components/ui/Icons'; // 🎯 ADD THIS AT THE VERY TOP OF THE FILE

export default function HeroHome() {
  return (
    <section className="w-full pt-[40px] pb-[60px] text-center px-[10%]">
    {/* 🎯 NATIVE UPGRADE: Fixed text blocks and applied font-futura + font-extrabold directly */}
    <h1 className="font-futura font-extrabold text-[40px] md:text-[50px] lg:text-[60px] uppercase tracking-[-0.05em] leading-[0.85] mb-4 max-w-3xl mx-auto block">
      The world {' '}
      <span className="block">runs on atoms.</span>
      <span className="block">And stories.</span>
    </h1>
    
    {/* Styled to match Inter Medium @ 17px */}
    {/* 🎯 CHANGED: Added 'inline-flex items-center gap-1.5' to keep things perfectly centered on one line */}
    <Link 
  href="/about" 
  className="inline-flex items-center gap-1.5 font-sans font-medium text-[17px] tracking-tight text-white/50 hover:text-white transition-colors group"
>
  <span>Learn more</span>
  
  {/* 🎯 CHANGED: Injected your design system icon instance */}
  <Icon 
    name="arrowRight" 
    className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" 
  />
</Link>
  </section>
  );
}