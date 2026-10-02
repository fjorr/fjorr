'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import HouseScrollFooter from '@/components/HouseScrollFooter';

const FRAME_COUNT = 52;
const FRAME_BASE =
  'https://media.fjorr.com/app-assets/animation/mark/fjorr-mark-2d3d-';

const MARK_FRAMES = Array.from({ length: FRAME_COUNT }, (_, i) => {
  const n = String(i + 1).padStart(2, '0');
  return `${FRAME_BASE}${n}.avif`;
});

/** Same letter paths as main AboutClient wordmark draw (viewBox 0 0 143 81). */
const WORDMARK_PATHS = [
  {
    d: 'M0 0.908003V48.498C0 49.0001 0.405462 49.406 0.906954 49.406H11.9931C12.4946 49.406 12.9001 49.0001 12.9001 48.498V35.1397C12.9001 34.6376 13.3055 34.2317 13.807 34.2317H26.0616C26.5631 34.2317 26.9685 33.8258 26.9685 33.3237V23.6615C26.9685 23.1594 26.5631 22.7535 26.0616 22.7535H13.807C13.3055 22.7535 12.9001 22.3476 12.9001 21.8455V12.3755C12.9001 11.8735 13.3055 11.4675 13.807 11.4675H27.4967C27.9982 11.4675 28.4037 11.0616 28.4037 10.5595V0.908003C28.4037 0.405931 27.9982 0 27.4967 0H0.906954C0.405462 0 0 0.405931 0 0.908003Z',
  },
  {
    d: 'M35.9047 15.0355C35.4032 15.0355 34.9978 15.4414 34.9978 15.9435V60.9377C34.9978 65.4136 31.5887 69.0883 27.23 69.505C26.7605 69.5477 26.403 69.9322 26.403 70.4023V80.0912C26.403 80.6146 26.8405 81.0206 27.3633 80.9992C37.996 80.4971 46.4627 71.7109 46.4627 60.9377V15.9435C46.4627 15.4414 46.0573 15.0355 45.5558 15.0355H35.9047Z',
  },
  {
    d: 'M71.3559 13.2942C60.8993 13.2942 52.4273 21.7814 52.4273 32.2448C52.4273 42.7082 60.9046 51.1953 71.3559 51.1953C81.8073 51.1953 90.2846 42.7082 90.2846 32.2448C90.2846 21.7814 81.8073 13.2942 71.3559 13.2942ZM71.3559 24.7725C67.232 24.7725 63.8869 28.1214 63.8869 32.2501C63.8869 36.3789 67.232 39.7278 71.3559 39.7278C75.4799 39.7278 78.825 36.3789 78.825 32.2501C78.825 28.1214 75.4799 24.7725 71.3559 24.7725Z',
    fillRule: 'evenodd' as const,
    clipRule: 'evenodd' as const,
  },
  {
    d: 'M116.309 15.9435V22.7375C116.309 23.2395 115.903 23.6455 115.402 23.6455H108.509C108.066 23.6455 107.709 24.0033 107.709 24.4466V48.5568C107.709 49.0589 107.303 49.4648 106.802 49.4648H97.1508C96.6493 49.4648 96.2438 49.0589 96.2438 48.5568V15.9435C96.2438 15.4414 96.6493 15.0355 97.1508 15.0355H115.402C115.903 15.0355 116.309 15.4414 116.309 15.9435Z',
  },
  {
    d: 'M143 15.9435V22.7375C143 23.2395 142.595 23.6455 142.093 23.6455H135.2C134.757 23.6455 134.4 24.0033 134.4 24.4466V48.5568C134.4 49.0589 133.994 49.4648 133.493 49.4648H123.842C123.34 49.4648 122.935 49.0589 122.935 48.5568V15.9435C122.935 15.4414 123.34 15.0355 123.842 15.0355H142.093C142.595 15.0355 143 15.4414 143 15.9435Z',
  },
];

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
 * The mark — pinned stage: scroll scrubs 2D→3D frames, holds, then wordmark
 * outline draws and fills (restored from main AboutClient).
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
  /** Gate: keep stage invisible until preload + GSAP initial state are applied. */
  const [ready, setReady] = useState(false);

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
        // Initial state before reveal — also mirrored in CSS to prevent flash.
        gsap.set('.mark-beat-logo', { opacity: 1, y: 0 });
        gsap.set('.mark-beat-name', { opacity: 0, y: 18, visibility: 'hidden' });
        gsap.set('.mark-copy-logo', { opacity: 0, y: 12 });
        gsap.set('.wordmark-path', {
          strokeDasharray: 800,
          strokeDashoffset: reduced ? 0 : 800,
          fill: reduced ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0)',
        });

        if (reduced) {
          drawFrame(FRAME_COUNT - 1);
          gsap.set('.mark-beat-logo', { opacity: 0, visibility: 'hidden' });
          gsap.set('.mark-beat-name', { opacity: 1, y: 0, visibility: 'visible' });
          gsap.set('.wordmark-path', {
            strokeDashoffset: 0,
            fill: 'rgba(255,255,255,1)',
          });
          if (!cancelled) setReady(true);
          return;
        }

        if (!cancelled) setReady(true);

        gsap.to('.mark-copy-logo', {
          opacity: 1,
          y: 0,
          duration: 0.45,
          delay: 0.15,
          ease: 'power2.out',
        });

        // Scrub frames → hold final → logo out → wordmark draw/fill → name copy.
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
            duration: 0.55,
            ease: 'none',
            onUpdate: () => {
              const next = Math.round(frameProxy.i);
              if (next !== frameIndexRef.current) drawFrame(next);
            },
          },
          0
        );

        // Hold final frame ~0.55–0.78, then crossfade into name beat.
        morph
          .to(
            '.mark-beat-logo',
            { opacity: 0, y: -16, duration: 0.12, ease: 'power1.in' },
            0.78
          )
          .set('.mark-beat-name', { visibility: 'visible' }, 0.78)
          .to(
            '.mark-beat-name',
            { opacity: 1, y: 0, duration: 0.1, ease: 'power2.out' },
            0.78
          )
          // Outline draw (same 800→0 technique as main AboutClient).
          .fromTo(
            '.wordmark-path',
            {
              strokeDashoffset: 800,
              fill: 'rgba(255,255,255,0)',
            },
            {
              strokeDashoffset: 0,
              duration: 0.14,
              ease: 'power2.inOut',
            },
            0.8
          )
          // Fill in as the stroke finishes.
          .to(
            '.wordmark-path',
            { fill: 'rgba(255,255,255,1)', duration: 0.06, ease: 'power1.out' },
            0.9
          )
          .fromTo(
            '.mark-copy-name',
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.08, ease: 'power2.out' },
            0.9
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
      <div ref={trackRef} className="relative h-[320vh] w-full">
        <div
          ref={stageRef}
          className="relative flex h-[100dvh] w-full flex-col items-center justify-center px-6"
        >
          {/*
            Hide the whole stage until frames are preloaded and GSAP has set
            initial opacities — prevents wordmark/name flash before JS runs.
          */}
          <div
            className="absolute inset-0"
            style={{
              opacity: ready ? 1 : 0,
              visibility: ready ? 'visible' : 'hidden',
            }}
            aria-hidden={!ready}
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
              <div className="mark-copy-logo max-w-[22rem] opacity-0">
                <p className="m-0 mb-2 font-interTight text-[20px] font-bold tracking-tight text-white sm:text-[22px]">
                  {logoTitle}
                </p>
                <p className="m-0 font-sans text-[15px] font-medium leading-snug tracking-tight text-white/50 sm:text-[16px]">
                  {logoBody}
                </p>
              </div>
            </div>

            {/* Beat B — wordmark draw/fill + name (hidden until ready + scroll) */}
            <div
              className="mark-beat-name absolute inset-x-6 flex flex-col items-center justify-center text-center opacity-0"
              style={{ visibility: 'hidden' }}
            >
              <div
                className="fjorr-mark-wordmark mb-10 h-[88px] w-[144px] sm:mb-12 sm:h-[120px] sm:w-[196px]"
                role="img"
                aria-label="Fjorr"
              >
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 143 81"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="overflow-visible"
                  aria-hidden
                >
                  <style>{`
                    .wordmark-path {
                      stroke: #ffffff;
                      stroke-width: 1px;
                      fill: rgba(255, 255, 255, 0);
                      stroke-dasharray: 800;
                      stroke-dashoffset: 800;
                    }
                  `}</style>
                  {WORDMARK_PATHS.map((p) => (
                    <path
                      key={p.d.slice(0, 24)}
                      className="wordmark-path"
                      d={p.d}
                      fillRule={p.fillRule}
                      clipRule={p.clipRule}
                    />
                  ))}
                </svg>
              </div>
              <div className="mark-copy-name max-w-[22rem] opacity-0">
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
      </div>

      <HouseScrollFooter variant="light" surfaceClassName="bg-black" />
    </div>
  );
}
