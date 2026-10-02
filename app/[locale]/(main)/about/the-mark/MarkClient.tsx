'use client';

import React, { useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { FjorrWordmark } from '@/components/brand/FjorrMarks';
import HouseScrollFooter from '@/components/HouseScrollFooter';

const FRAME_COUNT = 48;
const FRAME_BASE =
  'https://media.fjorr.com/app-assets/animation/mark/fjorr-mark-2d3d-';

const MARK_FRAMES = Array.from({ length: FRAME_COUNT }, (_, i) => {
  const n = String(i + 1).padStart(2, '0');
  return `${FRAME_BASE}${n}.avif`;
});

type Props = {
  backLabel: string;
  logoTitle: string;
  logoBody: string;
  nameTitle: string;
  nameBody: React.ReactNode;
};

function preloadFrames(urls: string[]): Promise<HTMLImageElement[]> {
  return Promise.all(
    urls.map(
      (src) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.decoding = 'async';
          img.onload = () => {
            if (typeof img.decode === 'function') {
              img.decode().then(() => resolve(img)).catch(() => resolve(img));
            } else {
              resolve(img);
            }
          };
          img.onerror = () => reject(new Error(`Failed to load ${src}`));
          img.src = src;
        })
    )
  );
}

/**
 * The mark — pinned stage: scroll scrubs 2D→3D frame sequence, then name fades in.
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIndexRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let ctx: { revert: () => void } | null = null;
    let frames: HTMLImageElement[] = [];

    const drawFrame = (index: number) => {
      const canvas = canvasRef.current;
      const img = frames[index];
      if (!canvas || !img || !img.complete) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const css = canvas.clientWidth || 340;
      const size = Math.round(css * dpr);
      if (canvas.width !== size || canvas.height !== size) {
        canvas.width = size;
        canvas.height = size;
      }
      const c = canvas.getContext('2d');
      if (!c) return;
      c.clearRect(0, 0, size, size);
      c.drawImage(img, 0, 0, size, size);
      frameIndexRef.current = index;
    };

    const onResize = () => drawFrame(frameIndexRef.current);
    window.addEventListener('resize', onResize);

    const run = async () => {
      try {
        frames = await preloadFrames(MARK_FRAMES);
      } catch {
        frames = MARK_FRAMES.map((src) => {
          const img = new Image();
          img.src = src;
          return img;
        });
      }
      if (cancelled) return;

      drawFrame(0);

      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      if (cancelled || !trackRef.current || !stageRef.current) return;
      gsap.registerPlugin(ScrollTrigger);

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      ctx = gsap.context(() => {
        gsap.set('.mark-beat-logo', { opacity: 1, y: 0 });
        gsap.set('.mark-beat-name', { opacity: 0, y: 18 });
        gsap.set('.fjorr-mark-wordmark', { opacity: 0 });
        gsap.set('.mark-copy-logo', { opacity: 0, y: 12 });

        if (reduced) {
          drawFrame(FRAME_COUNT - 1);
          gsap.set('.mark-beat-logo', { opacity: 0 });
          gsap.set('.mark-beat-name', { opacity: 1, y: 0 });
          gsap.set('.fjorr-mark-wordmark', { opacity: 1 });
          return;
        }

        gsap.to('.mark-copy-logo', {
          opacity: 1,
          y: 0,
          duration: 0.45,
          delay: 0.15,
          ease: 'power2.out',
        });

        // Scrub frames across most of the pin, then crossfade to the name beat.
        const morph = gsap.timeline({
          scrollTrigger: {
            trigger: trackRef.current,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.35,
            pin: stageRef.current,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        const frameProxy = { i: 0 };
        morph.to(
          frameProxy,
          {
            i: FRAME_COUNT - 1,
            duration: 0.72,
            ease: 'none',
            onUpdate: () => {
              const next = Math.round(frameProxy.i);
              if (next !== frameIndexRef.current) drawFrame(next);
            },
          },
          0
        );

        morph
          .to(
            '.mark-beat-logo',
            { opacity: 0, y: -16, duration: 0.28, ease: 'power1.in' },
            0.62
          )
          .to(
            '.fjorr-mark-wordmark',
            { opacity: 1, duration: 0.28, ease: 'power2.out' },
            0.72
          )
          .to(
            '.mark-beat-name',
            { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out' },
            0.74
          );
      }, trackRef);
    };

    void run();

    return () => {
      cancelled = true;
      window.removeEventListener('resize', onResize);
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
      <div ref={trackRef} className="relative h-[280vh] w-full">
        <div
          ref={stageRef}
          className="relative flex h-[100dvh] w-full flex-col items-center justify-center px-6"
        >
          {/* Beat A — 2D→3D mark scrub */}
          <div className="mark-beat-logo absolute inset-x-6 flex flex-col items-center justify-center text-center">
            <div className="relative mb-10 h-[220px] w-[220px] sm:mb-12 sm:h-[300px] sm:w-[300px] md:h-[340px] md:w-[340px]">
              <canvas
                ref={canvasRef}
                className="absolute inset-0 h-full w-full"
                aria-hidden
              />
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
