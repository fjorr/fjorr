'use client';

import React, { useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { FjorrWordmark } from '@/components/brand/FjorrMarks';
import HouseScrollFooter from '@/components/HouseScrollFooter';

const HELMET_FRAMES = [
  'https://media.fjorr.com/app-assets/animation/icon/fjorr-production-logo-frame-01.avif',
  'https://media.fjorr.com/app-assets/animation/icon/fjorr-production-logo-frame-02.avif',
  'https://media.fjorr.com/app-assets/animation/icon/fjorr-production-logo-frame-03.avif',
  'https://media.fjorr.com/app-assets/animation/icon/fjorr-production-logo-frame-04.avif',
  'https://media.fjorr.com/app-assets/animation/icon/fjorr-production-logo-frame-05.avif',
] as const;

type Props = {
  backLabel: string;
  logoTitle: string;
  logoBody: string;
  nameTitle: string;
  nameBody: React.ReactNode;
};

/**
 * The mark — pinned stage: helmet fades out on scroll, name fades in.
 */
export default function MarkClient({
  backLabel,
  logoTitle,
  logoBody,
  nameTitle,
  nameBody,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let ctx: { revert: () => void } | null = null;

    const run = async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      if (cancelled || !trackRef.current || !stageRef.current) return;
      gsap.registerPlugin(ScrollTrigger);

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      ctx = gsap.context(() => {
        gsap.set('.helmet-frame', { opacity: 0, visibility: 'hidden' });
        gsap.set('.helmet-frame-1', {
          opacity: 1,
          visibility: 'visible',
        });
        gsap.set('.mark-beat-logo', { opacity: 1, y: 0 });
        gsap.set('.mark-beat-name', { opacity: 0, y: 18 });
        gsap.set('.fjorr-mark-wordmark', { opacity: 0 });

        if (reduced) {
          gsap.set('.helmet-frame-1', { opacity: 0, visibility: 'hidden' });
          gsap.set('.mark-beat-logo', { opacity: 0 });
          gsap.set('.mark-beat-name', { opacity: 1, y: 0 });
          gsap.set('.fjorr-mark-wordmark', { opacity: 1 });
          return;
        }

        // Intro flip once the stage is ready.
        const intro = gsap.timeline({ delay: 0.12 });
        for (let i = 2; i <= 5; i++) {
          intro.to(`.helmet-frame-${i}`, {
            opacity: 1,
            visibility: 'visible',
            duration: 0.08,
            ease: 'steps(1)',
          });
          intro.set(`.helmet-frame-${i - 1}`, {
            opacity: 0,
            visibility: 'hidden',
          });
        }
        intro.fromTo(
          '.mark-copy-logo',
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.4 },
          '+=0.05'
        );

        // Pinned crossfade: helmet out → name in.
        const morph = gsap.timeline({
          scrollTrigger: {
            trigger: trackRef.current,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.45,
            pin: stageRef.current,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        morph
          .to(
            '.mark-beat-logo',
            { opacity: 0, y: -16, duration: 0.45, ease: 'power1.in' },
            0.15
          )
          .to(
            '.fjorr-mark-wordmark',
            { opacity: 1, duration: 0.4, ease: 'power2.out' },
            0.42
          )
          .to(
            '.mark-beat-name',
            { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' },
            0.48
          );
      }, trackRef);
    };

    void run();
    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return (
    <div className="w-full bg-black text-white">
      <p className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-40 flex justify-center pt-[44px] md:pt-[60px] lg:pt-[100px]">
        <Link
          href="/about"
          className="pointer-events-auto inline-flex items-center gap-1.5 font-sans text-[13px] font-semibold text-white/35 transition-colors hover:text-white/60"
        >
          <ArrowLeft className="size-[14px] shrink-0" strokeWidth={2.25} aria-hidden />
          {backLabel}
        </Link>
      </p>

      {/* Tall track drives the pin; stage stays sticky in the viewport */}
      <div ref={trackRef} className="relative h-[220vh] w-full">
        <div
          ref={stageRef}
          className="relative flex h-[100dvh] w-full flex-col items-center justify-center px-6"
        >
          {/* Beat A — helmet */}
          <div className="mark-beat-logo absolute inset-x-6 flex flex-col items-center justify-center text-center">
            <div className="relative mb-10 h-[220px] w-[220px] sm:mb-12 sm:h-[300px] sm:w-[300px] md:h-[340px] md:w-[340px]">
              {HELMET_FRAMES.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  className={`helmet-frame helmet-frame-${i + 1} absolute inset-0 h-full w-full object-contain`}
                  draggable={false}
                />
              ))}
            </div>
            <div className="mark-copy-logo max-w-[22rem]">
              <p className="m-0 mb-2 font-interTight text-[20px] font-bold tracking-tight text-white sm:text-[22px]">
                {logoTitle}
              </p>
              <p className="m-0 font-sans text-[15px] font-medium leading-snug tracking-tight text-white/50 sm:text-[16px]">
                {logoBody}
              </p>
            </div>
          </div>

          {/* Beat B — name (stacked in same frame) */}
          <div className="mark-beat-name absolute inset-x-6 flex flex-col items-center justify-center text-center">
            <FjorrWordmark className="fjorr-mark-wordmark mb-10 h-[88px] w-[144px] text-white sm:mb-12 sm:h-[120px] sm:w-[196px]" />
            <div className="max-w-[22rem]">
              <p className="m-0 mb-2 font-interTight text-[20px] font-bold tracking-tight text-white sm:text-[22px]">
                {nameTitle}
              </p>
              <p className="m-0 font-sans text-[15px] font-medium leading-snug tracking-tight text-white/50 sm:text-[16px]">
                {nameBody}
              </p>
            </div>
          </div>
        </div>
      </div>

      <HouseScrollFooter variant="light" surfaceClassName="bg-black" />
    </div>
  );
}
