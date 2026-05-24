'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function AboutPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleLine1Ref = useRef<HTMLHeadingElement>(null);
  const titleLine2Ref = useRef<HTMLHeadingElement>(null);
  const heroSectionRef = useRef<HTMLDivElement>(null);
  const maskBackdropRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const stickyContainerRef = useRef<HTMLDivElement>(null);
  const textSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Force the video timeline to stay locked at frame zero on load
    video.pause();
    video.currentTime = 0;

    // Force mobile Safari to normalize structural height variables before calculations run
    ScrollTrigger.clearScrollMemory();
    window.scrollTo(0, 0);

    const initScrollTimeline = () => {
      // ACT I: INITIAL ON-LOAD HEADLINE ENTRANCE
      const loadTl = gsap.timeline();
      loadTl.fromTo(titleLine1Ref.current, 
        { opacity: 0, y: 25 }, 
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
      );
      loadTl.fromTo(titleLine2Ref.current, 
        { opacity: 0, y: 15 }, 
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 
        '+=0.2'
      );

      // ACT II: MASTER CHOREOGRAPHED PINNING TIMELINE
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: stickyContainerRef.current,
          start: 'top top',
          end: '+=350%', // Clear, deep layout runway forcing scroll length on mobile
          scrub: 0.5,    // Smooth tracking configuration across touch interactions
          pin: true,
          pinSpacing: true, // Forces layout sheets to generate real scrolling height below the fold
          invalidateOnRefresh: true,
          anticipatePin: 1
        }
      });

      // Scrub video playback parameters dynamically based on viewport offset coordinates
      scrollTl.fromTo(video, 
        { currentTime: 0 },
        {
          currentTime: video.duration || 4, 
          duration: 1.5,
          ease: 'none'
        }, 
        0
      );

      // Dissolve initial hero blocks
      scrollTl.to([heroSectionRef.current, maskBackdropRef.current], { opacity: 0, duration: 0.3 }, 0);

      // Fade and blur the video component out cleanly
      scrollTl.to(video, { 
        filter: 'blur(25px)', 
        opacity: 0, 
        duration: 0.8,
        ease: 'power1.inOut'
      }, 0.5);

      // Translate text container upward flawlessly across viewports
      scrollTl.fromTo(textSectionRef.current, 
        { y: '100vh' }, 
        { y: '-180vh', duration: 3.0, ease: 'none' }, 
        0.3
      );
    };

    // Use a small timeout tracking buffer to ensure Tailwind layout compilation completes first
    const timer = setTimeout(() => {
      if (video.readyState >= 1) {
        initScrollTimeline();
      } else {
        video.addEventListener('loadedmetadata', initScrollTimeline);
      }
      ScrollTrigger.refresh();
    }, 100);

    return () => {
      clearTimeout(timer);
      video.removeEventListener('loadedmetadata', initScrollTimeline);
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full bg-black text-white relative select-none min-h-screen">
      
      {/* MASTER PIN WRAPPER: Fixed mobile height calculations to anchor layout sheets */}
      <div 
        ref={stickyContainerRef} 
        className="w-full h-screen min-h-[-webkit-fill-available] relative overflow-hidden bg-black -mt-[72px]"
      >
        
        {/* VISUAL CENTER HUB */}
        <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center pt-[72px] z-10">
          
          {/* 🎯 BUMPED PRODUCTION VIDEO BOUNDS */}
          <div className="relative w-full max-w-[700px] h-[45vh] md:h-[65vh] px-4 flex items-center justify-center z-10">
            <video 
              ref={videoRef}
              src="/fjorr_scout.mp4"
              muted
              playsInline
              preload="auto"
              className="w-full h-full object-contain opacity-100 will-change-[filter,opacity]"
              style={{ pointerEvents: 'none' }}
            />
            <div ref={maskBackdropRef} className="absolute inset-0 bg-black z-15 pointer-events-none opacity-100" />
          </div>

  {/* Balanced Headline Presentation Engine */}
<div ref={heroSectionRef} className="absolute inset-0 flex flex-col items-center justify-center text-center z-20 px-6 max-w-4xl mx-auto pointer-events-none">
  
  {/* Embedded Native Animation Core Styles */}
  <style jsx global>{`
    @keyframes cinematicFadeUp {
      0% {
        opacity: 0;
        transform: translateY(28px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .reveal-line {
      animation: cinematicFadeUp 1200ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `}</style>

  <h1 className="font-futura text-[80px] sm:text-[80px] md:text-[100px] lg:text-[120px] leading-[0.75em] font-black uppercase tracking-tighter text-[#f5f5f7] w-full">
    
    {/* First Line Sequence (Staggered Intro) */}
    {/* 🎯 ANTI-FLASH FIX: Hardcoded opacity: 0 into inline styles so they load completely hidden */}
    <div ref={titleLine1Ref} className="flex flex-col">
      <span className="reveal-line block" style={{ opacity: 0, animationDelay: '100ms' }}>The</span>
      <span className="reveal-line block" style={{ opacity: 0, animationDelay: '250ms' }}>world</span>
      <span className="reveal-line block" style={{ opacity: 0, animationDelay: '400ms' }}>runs on</span>
      <span className="reveal-line block text-[#f5f5f7]" style={{ opacity: 0, animationDelay: '550ms' }}>atoms.</span>
    </div>
    
    {/* Dynamic Reveal Sequence (Fires after a longer cinematic beat) */}
    <span className="reveal-line block text-[#f5f5f7] mt-0" style={{ opacity: 0, animationDelay: '1650ms' }}>And</span>
    <span className="reveal-line block text-[#f5f5f7] mt-0" style={{ opacity: 0, animationDelay: '1950ms' }}>stories.</span>
  </h1>
</div>

        </div>

        {/* FIXED TEXT RUNWAY SCREEN */}
        <div 
          ref={textSectionRef}
          className="absolute inset-x-0 top-0 bg-transparent px-6 flex flex-col items-center justify-start z-30 font-inter text-center font-semibold text-[18px] leading-[1.4em] text-[#f5f5f7] will-change-transform"
          style={{ transform: 'translateY(100vh)' }}
        >
          <div className="max-w-xl w-full space-y-6 pt-[20vh]">
            
            <div>
              Short form stories <br/> show the way.
            </div>

            <div className="pt-2">
              They hit fast. <br/> They last. <br/> They travel.
            </div>

            <div>
              And they’ve always <br/> shaped people.
            </div>

            <div>
              And culture.
            </div>

            <div>
              So we’re building <br/> a myth engine.
            </div>

            <div>
              Short, cinematic films <br/> about the world’s <br/> greatest stories.
            </div>

            <div>
              Designed to form <br/> imagination, <br/> character, <br/> and cultural literacy.
            </div>

            <div>
              Just a few minutes. <br/> Done right.
            </div>

            <div>
              Not to keep you <br/> glued to glass.
            </div>

            <div className="pb-10">
              But to send you <br/> back into the world <br/> with something to carry.
            </div>

            <div className="pt-6 max-w-xl mx-auto w-full text-left font-inter pb-48">
              <Link 
                href="/why" 
                className="group block bg-neutral-900/40 hover:bg-neutral-900/70 border border-white/5 hover:border-white/10 rounded-lg p-6 transition-all duration-300 backdrop-blur-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-[14px] font-bold uppercase tracking-[0.05em] text-white">
                      Our Philosophy
                    </h3>
                    <p className="text-[12px] font-normal tracking-normal text-neutral-400 group-hover:text-neutral-300 transition-colors">
                      Discover why deep-grid craft is the true counterweight to modern endless distraction loops.
                    </p>
                  </div>
                  <div className="text-neutral-600 group-hover:text-white group-hover:translate-x-1 transition-all duration-300 text-[18px] font-mono leading-none">
                     →
                  </div>
                </div>
              </Link>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}