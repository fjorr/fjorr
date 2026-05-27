'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function AboutClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleLine1Ref = useRef<HTMLHeadingElement>(null);
  const titleLine2Ref = useRef<HTMLHeadingElement>(null);
  const heroSectionRef = useRef<HTMLDivElement>(null);
  const maskBackdropRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const stickyContainerRef = useRef<HTMLDivElement>(null);
  const textSectionRef = useRef<HTMLDivElement>(null);

  // TECHNICAL ENGINE REFS
  const techDotOverlayRef = useRef<HTMLDivElement>(null);
  const helmetContainerRef = useRef<HTMLDivElement>(null);
  const helmetTextRef = useRef<HTMLDivElement>(null);
  const wordmarkStageRef = useRef<HTMLDivElement>(null);
  const wordmarkTextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    video.currentTime = 0;

    ScrollTrigger.clearScrollMemory();
    window.scrollTo(0, 0);

    const initScrollTimeline = () => {
      // ACT I: INITIAL ON-LOAD HEADLINE ENTRANCE
      const loadTl = gsap.timeline();
      loadTl.to('.reveal-line', {
        opacity: 1,
        y: 0,
        stagger: (index) => {
          if (index < 4) return index * 0.15;
          return 1.1 + (index - 4) * 0.3;
        },
        duration: 1.2,
        ease: 'cubic-bezier(0.16, 1, 0.3, 1)'
      });

      // ACT II: THE MASTER CONTINUOUS PINNING RUNWAY
      const masterTl = gsap.timeline({
        scrollTrigger: {
          trigger: stickyContainerRef.current,
          start: 'top top',
          end: '+=450%', // ⚡ TIGHTENED RUNWAY: Drastically reduced to prevent dead scrolling zones
          scrub: 0.5,    
          pin: true,
          pinSpacing: true, 
          invalidateOnRefresh: true,
          anticipatePin: 1
        }
      });

      // 🎥 PART 1: Main Video Playback Scrubbing
      masterTl.fromTo(video, 
        { currentTime: 0 },
        { currentTime: video.duration || 4, duration: 1.5, ease: 'none' }, 
        0
      );

      // Dissolve text overlays and mask blocks
      masterTl.to([heroSectionRef.current, maskBackdropRef.current], { opacity: 0, duration: 0.3 }, 0);
      masterTl.to(video, { filter: 'blur(25px)', opacity: 0, duration: 0.8, ease: 'power1.inOut' }, 0.5);

      // 📝 PART 2: Text Runway Crawls Up
      // ⚡ TIMING OPTIMIZATION: Stopped the text crawl at -25vh so it crossfades immediately into the logo work
      masterTl.fromTo(textSectionRef.current, 
        { y: '100vh' }, 
        { y: '-25vh', duration: 2.0, ease: 'none' }, 
        0.3
      );
      
      // Fast crossfade transition out for the text runway lines
      masterTl.to(textSectionRef.current, { opacity: 0, duration: 0.3 }, '>-=0.2');

      // ⚛️ PART 3: Technical JetBrains Section Activates (Dot Grid Fades In)
      masterTl.fromTo(techDotOverlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4 }, '>-=0.1');

      // --- Pinned Helmet Frame Dispatcher Sequential Loop ---
      masterTl.fromTo(helmetContainerRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4 });
      
      masterTl.to('.helmet-frame', { display: 'none', duration: 0.01 });
      masterTl.to('.helmet-frame-1', { display: 'block', duration: 0.1 });
      masterTl.to('.helmet-frame-1', { display: 'none', duration: 0.01 });
      masterTl.to('.helmet-frame-2', { display: 'block', duration: 0.1 });
      masterTl.to('.helmet-frame-2', { display: 'none', duration: 0.01 });
      masterTl.to('.helmet-frame-3', { display: 'block', duration: 0.1 });
      masterTl.to('.helmet-frame-3', { display: 'none', duration: 0.01 });
      masterTl.to('.helmet-frame-4', { display: 'block', duration: 0.1 });
      masterTl.to('.helmet-frame-4', { display: 'none', duration: 0.01 });
      masterTl.to('.helmet-frame-5', { display: 'block', duration: 0.1 });

      masterTl.fromTo(helmetTextRef.current, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4 }, '>-=0.05');

      // Clear the Helmet layout frame out
      masterTl.to([helmetContainerRef.current, helmetTextRef.current], { opacity: 0, y: -30, duration: 0.4 }, '+=0.4');

      // 📐 PART 4: Engineering Blueprint Wordmark Tracing Engine
      masterTl.fromTo(wordmarkStageRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4 });

      // Animate SVG path metrics to trace lines out, keeping fill completely transparent
      masterTl.fromTo('.wordmark-path', {
        strokeDashoffset: 800,
        fill: 'rgba(255, 255, 255, 0)'
      }, {
        strokeDashoffset: 0,
        duration: 1.2,
        ease: 'power2.inOut'
      }, '>-=0.1');

      // Fade in the JetBrains wordmark metadata details block
      masterTl.fromTo(wordmarkTextRef.current, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4 }, '>-=0.4');

      // Release page layout container to let footer slide up smoothly
      masterTl.to(techDotOverlayRef.current, { opacity: 1, duration: 0.5 }, '+=0.6');
    };

    const runTimers = setTimeout(() => {
      if (video.readyState >= 1) {
        initScrollTimeline();
      } else {
        video.addEventListener('loadedmetadata', initScrollTimeline);
      }
      ScrollTrigger.refresh();
    }, 100);

    return () => {
      clearTimeout(runTimers);
      video.removeEventListener('loadedmetadata', initScrollTimeline);
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full bg-black text-white relative select-none min-h-screen">

      {/* 🧠 STRUCTURED DATA: AI About Manifesto Indexing */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "AboutPage",
            "name": "About Fjorr",
            "description": "We are building a myth engine. Short, cinematic films about the world’s greatest stories designed to form imagination, character, and cultural literacy.",
            "publisher": {
              "@type": "Organization",
              "name": "Fjorr",
              "url": "https://fjorr.com"
            }
          })
        }}
      />
      
      {/* MASTER PIN WRAPPER */}
      <div 
        ref={stickyContainerRef} 
        className="w-full h-screen min-h-[-webkit-fill-available] relative overflow-hidden bg-black -mt-[72px]"
      >
        
        {/* VISUAL CENTER HUB */}
        <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center pt-[72px] z-10">
          
          {/* VIDEO LAYER */}
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
            <h1 className="font-futura text-[80px] sm:text-[80px] md:text-[100px] lg:text-[120px] leading-[0.75em] font-black uppercase tracking-tighter text-[#f5f5f7] w-full">
              <div ref={titleLine1Ref} className="flex flex-col">
                <span className="reveal-line block opacity-0 translate-y-7">The</span>
                <span className="reveal-line block opacity-0 translate-y-7">world</span>
                <span className="reveal-line block opacity-0 translate-y-7">runs on</span>
                <span className="reveal-line block text-[#f5f5f7] opacity-0 translate-y-7">atoms.</span>
              </div>
              <span ref={titleLine2Ref} className="reveal-line block text-[#f5f5f7] mt-0 opacity-0 translate-y-7">And</span>
              <span className="reveal-line block text-[#f5f5f7] mt-0 opacity-0 translate-y-7">stories.</span>
            </h1>
          </div>

        </div>

        {/* FIXED TEXT RUNWAY SCREEN */}
        <div 
          ref={textSectionRef}
          className="absolute inset-x-0 top-0 bg-transparent px-6 flex flex-col items-center justify-start z-30 font-inter text-center font-semibold text-3xl leading-[1.4em] text-[#f5f5f7] will-change-transform"
          style={{ transform: 'translateY(100vh)' }}
        >
          <div className="max-w-xl w-full space-y-6 pt-[20vh]">
  <div> 
    We’re building <br/> a myth engine.
    <br />Short, cinematic films <br/> about the world’s <br/> greatest stories.
    <br />Designed to form <br/> imagination, <br/> character, <br/> and cultural literacy.
    <br />Just a few minutes. <br/> Done right.
    <br />Not to keep you <br/> glued to glass.
    <br />But to send you <br/> back into the world <br/> with something to carry.
  </div>
</div> {/* 🎯 FIXED: Both divs are now properly closed */}
        </div>

        {/* ==========================================
            TECHNICAL JETBRAINS ENGINE RUNWAY STAGE
           ========================================== */}
        <div 
          ref={techDotOverlayRef}
          className="absolute inset-0 z-40 bg-black flex flex-col items-center justify-center opacity-0 pointer-events-none font-mono text-[13px]"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        >
          {/* HELMET STAGE LAYOUT */}
<div ref={helmetContainerRef} className="absolute inset-0 flex flex-col items-center justify-center p-6 opacity-0">
  {/* ⚡ Size bumped from w-32/h-32 to w-40/h-40 */}
  <div className="w-[250px] h-[250px] relative flex items-center justify-center">
    {/* Added 'origin-center will-change-transform' to aid animation performance */}
    <img src="https://media.fjorr.com/assets/animation/icon/fjorr-production-logo-frame-01.avif" className="helmet-frame helmet-frame-1 block w-full h-full object-contain origin-center will-change-transform" alt="" />
    <img src="https://media.fjorr.com/assets/animation/icon/fjorr-production-logo-frame-02.avif" className="helmet-frame helmet-frame-2 hidden w-full h-full object-contain origin-center will-change-transform" alt="" />
    <img src="https://media.fjorr.com/assets/animation/icon/fjorr-production-logo-frame-03.avif" className="helmet-frame helmet-frame-3 hidden w-full h-full object-contain origin-center will-change-transform" alt="" />
    <img src="https://media.fjorr.com/assets/animation/icon/fjorr-production-logo-frame-04.avif" className="helmet-frame helmet-frame-4 hidden w-full h-full object-contain origin-center will-change-transform" alt="" />
    <img src="https://media.fjorr.com/assets/animation/icon/fjorr-production-logo-frame-05.avif" className="helmet-frame helmet-frame-5 hidden w-full h-full object-contain origin-center will-change-transform" alt="" />
  </div>
  
  <div ref={helmetTextRef} className="mt-6 text-center font-mono text-base tracking-tight text-[#f5f5f7]/80 opacity-0 max-w-sm">
    <div className="font-bold border border-white/60 rounded px-2 py-0.5 text-[11px] uppercase tracking-normal text-white/60 mb-3 w-max mx-auto">Logo</div>
    <span className="text-white text-lg font-bold block mb-1">The Cardboard Helmet</span>
    Every explorer starts here.
  </div>
</div>

          {/* BLUEPRINT WORDMARK TRACING STAGE */}
          <div ref={wordmarkStageRef} className="absolute inset-0 flex flex-col items-center justify-center p-6 opacity-0">
            <div className="w-[250px] flex items-center justify-center">
              <svg 
                id="fjorr-wordmark-svg" 
                width="250" 
                viewBox="0 0 143 81" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="overflow-visible"
              >
                <style>{`
                  .wordmark-path {
                    stroke: #ffffff;
                    stroke-width: 1px;
                    stroke-dasharray: 800;
                  }
                `}</style>
                <path className="wordmark-path" d="M0 0.908003V48.498C0 49.0001 0.405462 49.406 0.906954 49.406H11.9931C12.4946 49.406 12.9001 49.0001 12.9001 48.498V35.1397C12.9001 34.6376 13.3055 34.2317 13.807 34.2317H26.0616C26.5631 34.2317 26.9685 33.8258 26.9685 33.3237V23.6615C26.9685 23.1594 26.5631 22.7535 26.0616 22.7535H13.807C13.3055 22.7535 12.9001 22.3476 12.9001 21.8455V12.3755C12.9001 11.8735 13.3055 11.4675 13.807 11.4675H27.4967C27.9982 11.4675 28.4037 11.0616 28.4037 10.5595V0.908003C28.4037 0.405931 27.9982 0 27.4967 0H0.906954C0.405462 0 0 0.405931 0 0.908003Z"/>
                <path className="wordmark-path" d="M35.9047 15.0355C35.4032 15.0355 34.9978 15.4414 34.9978 15.9435V60.9377C34.9978 65.4136 31.5887 69.0883 27.23 69.505C26.7605 69.5477 26.403 69.9322 26.403 70.4023V80.0912C26.403 80.6146 26.8405 81.0206 27.3633 80.9992C37.996 80.4971 46.4627 71.7109 46.4627 60.9377V15.9435C46.4627 15.4414 46.0573 15.0355 45.5558 15.0355H35.9047Z"/>
                <path className="wordmark-path" fillRule="evenodd" clipRule="evenodd" d="M71.3559 13.2942C60.8993 13.2942 52.4273 21.7814 52.4273 32.2448C52.4273 42.7082 60.9046 51.1953 71.3559 51.1953C81.8073 51.1953 90.2846 42.7082 90.2846 32.2448C90.2846 21.7814 81.8073 13.2942 71.3559 13.2942ZM71.3559 24.7725C67.232 24.7725 63.8869 28.1214 63.8869 32.2501C63.8869 36.3789 67.232 39.7278 71.3559 39.7278C75.4799 39.7278 78.825 36.3789 78.825 32.2501C78.825 28.1214 75.4799 24.7725 71.3559 24.7725Z"/>
                <path className="wordmark-path" d="M116.309 15.9435V22.7375C116.309 23.2395 115.903 23.6455 115.402 23.6455H108.509C108.066 23.6455 107.709 24.0033 107.709 24.4466V48.5568C107.709 49.0589 107.303 49.4648 106.802 49.4648H97.1508C96.6493 49.4648 96.2438 49.0589 96.2438 48.5568V15.9435C96.2438 15.4414 96.6493 15.0355 97.1508 15.0355H115.402C115.903 15.0355 116.309 15.4414 116.309 15.9435Z"/>
                {/* 🛠️ SVG CODE FIX APPLIED HERE: Cleaned broken path tag attributes and properties */}
                <path className="wordmark-path" d="M143 15.9435V22.7375C143 23.2395 142.595 23.6455 142.093 23.6455H135.2C134.757 23.6455 134.4 24.0033 134.4 24.4466V48.5568C134.4 49.0589 133.994 49.4648 133.493 49.4648H123.842C123.34 49.4648 122.935 49.0589 122.935 48.5568V15.9435C122.935 15.4414 123.34 15.0355 123.842 15.0355H142.093C142.595 15.0355 143 15.4414 143 15.9435Z"/>
              </svg>
            </div>

            <div ref={wordmarkTextRef} className="mt-8 text-center font-mono text-base tracking-tight text-[#f5f5f7]/70 opacity-0 px-6 max-w-sm">
              <div className="border border-white/60 rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-normal text-white/60 mb-3 w-max mx-auto">Name</div>
              <span className="text-white font-bold block text-lg mb-1">Rooted in the <br />Old Norse word <span className="italic font-mono">fjọr.</span></span>
              Meaning the primal life-force that keeps living things moving. <br/>
              <span className="text-sm text-white/60 mt-2 block">[f-yōr] Rhymes with <span className="italic text-white/70">your.</span></span>
            </div>
          </div>

        </div>

      </div>

      

    </div>
  );
}