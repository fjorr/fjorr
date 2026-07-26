'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

export default function PrivacyClient() {
  const t = useTranslations('Privacy');
  const targetText = t('title');
  const [displayedText, setDisplayedText] = useState("•••••••");
  // 🎯 ANIMATION BLOCKER STATE: Holds back content until headline finishes decoding
  const [isDecrypted, setIsDecrypted] = useState(false);

  // 🎯 MONOSPACE CHARACTER DECRYPT ENGINES
  useEffect(() => {
    let frame = 0;
    const totalFrames = targetText.length;
    
    const interval = setInterval(() => {
      if (frame <= totalFrames) {
        const revealed = targetText.slice(0, frame);
        const masked = "•".repeat(totalFrames - frame);
        setDisplayedText(revealed + masked);
        frame++;
      } else {
        clearInterval(interval);
        setIsDecrypted(true); // 🎯 Flip state to unleash the body text cascade
      }
    }, 80); 

    return () => clearInterval(interval);
  }, [targetText]);

  return (
    <div className="w-full min-h-screen pt-16 pb-24 px-[10%] text-left flex flex-col items-center">
      <div className="w-full max-w-lg flex flex-col">

        {/* 🧠 STRUCTURED DATA: AI Compliance Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Fjorr Privacy Policy",
            "description": "Fjorr digital privacy commitment: No accounts. No tracking. No cookies.",
            "dateModified": "2026-01-01"
          })
        }}
      />
        
        {/* HERO TITLE (Pure Monospace Decrypt String) */}
        <div className="w-full text-center mb-4 select-none">
          <h1 className="font-mono text-5xl md:text-6xl uppercase tracking-tight leading-none font-semibold text-white min-h-[48px] md:min-h-[60px]">
            {displayedText}
          </h1>
        </div>

        {/* 🎯 THE CASCADE WRAPPER: Entire body waits for the decrypt cue before dropping in */}
        {isDecrypted && (
          <div className="w-full flex flex-col animate-in fade-in slide-in-from-bottom-3 duration-700 fill-mode-both">
            
            {/* THE EDITORIAL DATE TRACKER HEADER */}
            <div className="w-full text-center flex flex-col gap-1.5 mb-16 font-mono font-bold text-xs tracking-relaxed text-white/40 uppercase">
              <span>{t('lastUpdated')}</span>
              <span>{t('date')}</span>
            </div>

            {/* CONTENT SECTIONS GRID STACK */}
            <div className="flex flex-col gap-10">
              
              {/* SECTION 1 */}
              <section className="flex flex-col gap-2">
                <h2 className="font-sans text-lg font-bold text-white">
                  {t('s1Title')}
                </h2>
                <p className="font-sans text-[15px] leading-normal text-white/60 ">
                  {t('s1Body')}
                </p>
              </section>

              {/* SECTION 2 */}
              <section className="flex flex-col gap-4">
                <h2 className="font-sans text-lg font-bold text-white ">
                  {t('s2Title')}
                </h2>
                <div className="flex flex-col gap-3 font-sans text-[15px] leading-normal text-white/60">
                  <p>
                    {t('s2p1')}
                  </p>
                  <p>
                    {t('s2p2')}
                  </p>
                  <p>
                    {t('s2p3')}
                  </p>
                </div>
              </section>

              {/* SECTION 3 */}
              <section className="flex flex-col gap-2">
                <h2 className="font-sans text-lg font-bold text-white ">
                  {t('s3Title')}
                </h2>
                <p className="font-sans text-[15px] leading-normal text-white/60 ">
                  {t('s3Body')}
                </p>
              </section>

              {/* SECTION 4 (THE BULLET POINT MATRIX) */}
              <section className="flex flex-col gap-3">
                <h2 className="font-sans text-lg font-bold text-white ">
                  {t('s4Title')}
                </h2>
                <ul className="list-none flex flex-col gap-1.5 font-sans text-[15px] text-white/60  pl-1.5">
                  <li className="flex items-center gap-2">
                    <span className="text-white/30 text-xs font-bold">•</span> {t('s4Item1')}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-white/30 text-xs font-bold">•</span> {t('s4Item2')}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-white/30 text-xs font-bold">•</span> {t('s4Item3')}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-white/30 text-xs font-bold">•</span> {t('s4Item4')}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-white/30 text-xs font-bold">•</span> {t('s4Item5')}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-white/30 text-xs font-bold">•</span> {t('s4Item6')}
                  </li>
                </ul>
              </section>

              {/* SECTION 5 */}
              <section className="flex flex-col gap-2">
                <h2 className="font-sans text-lg font-bold text-white ">
                  {t('s5Title')}
                </h2>
                <p className="font-sans text-base leading-normal text-white/60 ">
                  {t('s5Body')}
                </p>
              </section>

              {/* SECTION 6 */}
              <section className="flex flex-col gap-2">
                <h2 className="font-sans text-lg font-bold text-white ">
                  {t('s6Title')}
                </h2>
                <p className="font-sans text-base leading-normal text-white/60 ">
                  {t('s6Body')}
                </p>
              </section>

              {/* SECTION 7 */}
              <section className="flex flex-col gap-2">
                <h2 className="font-sans text-lg font-bold text-white ">
                  {t('s7Title')}
                </h2>
                <p className="font-sans text-base leading-normal text-white/60 ">
                  {t('s7Body')}
                </p>
              </section>

              {/* SECTION 8 */}
              <section className="flex flex-col gap-1.5">
                <h2 className="font-sans text-lg font-bold text-white ">
                  {t('s8Title')}
                </h2>
                <p className="font-sans text-base text-white/60 ">
                  {t('s8Body')}{' '}
                  <a 
                    href="mailto:team@fjorr.com" 
                    className="text-white hover:opacity-80 underline underline-offset-4 decoration-white/20 transition-opacity"
                  > team@fjorr.com
                  </a>
                </p>
              </section>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}