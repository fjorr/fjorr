'use client';

import React, { useState, useEffect } from 'react';
import { ContactPill } from '@/components/ui/contact-pill';

export default function ContactClient() {
  const targetText = "THINKING";
  const [displayedText, setDisplayedText] = useState("");
  
  // Staggered gates to handle the crisp visual timing sequence
  const [showSubhead, setShowSubhead] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    let currentIdx = 0;
    let timeoutId: NodeJS.Timeout;

    function typeNextCharacter() {
      if (currentIdx <= targetText.length) {
        setDisplayedText(targetText.slice(0, currentIdx));
        currentIdx++;

        // Fast, perfectly even typing flow (exactly 70ms per stroke)
        timeoutId = setTimeout(typeNextCharacter, 70);
      } else {
        // Headline finishes -> Wait 200ms -> Fade in Subhead
        setTimeout(() => {
          setShowSubhead(true);
        }, 200);

        // Subhead finishes -> Wait 350ms -> Fade in Contact Pill Button
        setTimeout(() => {
          setShowButton(true);
        }, 550);
      }
    }

    // Fire immediately on mount
    typeNextCharacter();

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    /* 🎯 PERFECT IMMERSIVE CANVAS: 
       - 'h-dvh' scales smoothly with shifting mobile browser chrome address bars.
       - 'flex items-center justify-center' forces your marketing block dead center.
    */
    <div className="w-full h-dvh flex flex-col items-center justify-center px-6 relative font-sans select-none">

      {/* 🧠 STRUCTURED DATA: AI Contact Destination Mapping */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            "name": "Contact Fjorr",
            "description": "Reach out to the Fjorr team for ideas, inquiries, collaborations, or partnerships.",
            "url": "https://fjorr.com/contact"
          })
        }}
      />
      
      {/* COMPACT CENTER PANEL GRID */}
      <div className="max-w-xl text-center flex flex-col items-center gap-4 z-10">
        
        {/* HERO TITLE BLOCK */}
        <h1 className="text-[52px] sm:text-[75px] md:text-[95px] font-extrabold uppercase tracking-tighter text-white leading-[0.9] font-futura relative max-w-fit mx-auto select-none mb-3">
          
          {/* THE JUMP-PROOF INVISIBLE FOOTPRINT */}
          <span className="opacity-0 pointer-events-none select-none" aria-hidden="true">
            {targetText}
          </span>

          {/* THE VISIBLE TYPING TRACK */}
          <span className="absolute inset-y-0 left-0 flex items-center justify-start whitespace-nowrap text-white">
            {displayedText}
            
            {/* CURSOR ACCENT */}
            <span className="inline-block h-[38px] sm:h-[55px] md:h-[70px] w-[4px] md:w-[6px] bg-[#73ACE9] ml-2 animate-terminal-blink" />
          </span>
        </h1>
        
        {/* 🎬 STAGGER SELECTION 1: THE EDITORIAL DECK BLURB */}
        <p 
          className={`text-[15px] md:text-[16px] font-medium font-inter text-zinc-400 max-w-xs tracking-relaxed leading-relaxed mb-5 transform-gpu transition-all ease-out duration-700 ${
            showSubhead ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          Ideas, partnerships, or something worth making. We&apos;re here for it.
        </p>

        {/* 🎬 STAGGER SELECTION 2: THE BOT-PROOF COPY TO CLIPBOARD PILL */}
        <div
          className={`transform-gpu transition-all ease-out duration-700 ${
            showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          <ContactPill />
        </div>
        
      </div>

      {/* INFINITE BLINK TIMING SYSTEM */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes cursorPulse {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        
        .animate-terminal-blink {
          animation: cursorPulse 950ms steps(2, start) infinite;
        }
      `}} />
    </div>
  );
}