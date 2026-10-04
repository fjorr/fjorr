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

/** Straight-j wordmark. viewBox 0 0 399 245. */
const WORDMARK_PATHS = [
  {
    d: 'M202.332 57.1699C168.537 57.1699 141.138 84.5697 141.138 118.364C141.138 152.158 168.537 179.558 202.332 179.558C236.126 179.558 263.526 152.158 263.526 118.364C263.526 84.5697 236.126 57.1699 202.332 57.1699ZM202.332 142.99C188.727 142.99 177.699 131.961 177.699 118.356C177.699 104.752 188.727 93.7233 202.332 93.7233C215.936 93.7233 226.965 104.752 226.965 118.356C226.965 131.961 215.936 142.99 202.332 142.99Z',
    fillRule: 'evenodd' as const,
    clipRule: 'evenodd' as const,
  },
  {
    d: 'M280.217 174.261C280.217 174.261 280.217 174.269 280.225 174.269H318.981C318.981 174.269 318.988 174.269 318.988 174.261V94.1959C318.988 94.1959 318.989 94.1882 318.996 94.1882H332.006C332.006 94.1882 332.014 94.1882 332.014 94.1806V62.4593C332.014 62.4593 332.014 62.4593 332.006 62.4593H280.225V174.261H280.217Z',
  },
  {
    d: 'M346.952 62.4517V174.254C346.952 174.254 346.952 174.261 346.96 174.261H385.716C385.716 174.261 385.724 174.261 385.724 174.254V94.1882C385.724 94.1882 385.724 94.1806 385.731 94.1806H398.741C398.741 94.1806 398.749 94.1806 398.749 94.173V62.4517C398.749 62.4517 398.749 62.4517 398.741 62.4517H346.952Z',
  },
  {
    d: 'M105.918 43.0623C117.809 43.0623 127.449 33.4225 127.449 21.5311C127.449 9.63982 117.809 0 105.918 0C94.0266 0 84.3868 9.63982 84.3868 21.5311C84.3868 33.4225 94.0266 43.0623 105.918 43.0623Z',
  },
  {
    d: 'M125.307 62.4517H86.5361V244.098H125.307V62.4517Z',
  },
  {
    d: 'M68.9758 38.9009V7.16434H0V174.269H38.7713V113.7H64.1285V81.9631H38.7713V38.9009H68.9758Z',
  },
];

/** Pin progress where sequence/hold ends and the name beat plays. */
const NAME_BEAT_AT = 0.72;

type Props = {
  backLabel: string;
  logoTitle: string;
  logoBody: string;
  nameTitle: string;
  nameBody: React.ReactNode;
};

/** Load one frame; never hang on decode() (AVIF decode can stall in some browsers). */
function loadFrame(src: string, timeoutMs = 10000): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn();
    };
    const timer = setTimeout(
      () => finish(() => reject(new Error(`Timed out loading ${src}`))),
      timeoutMs
    );
    img.onload = () => finish(() => resolve(img));
    img.onerror = () => finish(() => reject(new Error(`Failed to load ${src}`)));
    img.src = src;
  });
}

async function preloadFrames(urls: string[]): Promise<HTMLImageElement[]> {
  return Promise.all(
    urls.map(async (src) => {
      try {
        return await loadFrame(src);
      } catch {
        const img = new Image();
        img.src = src;
        return img;
      }
    })
  );
}

/**
 * The mark — pinned stage: scroll scrubs 2D→3D frames + hold, then a
 * play-once wordmark outline→fill (same technique as main AboutClient).
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let nameTl: any = null;
    let namePlayed = false;

    const drawFrame = (index: number) => {
      const canvas = canvasRef.current;
      const img = frames[index];
      if (!canvas || !img || !img.complete) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const css = canvas.clientWidth || 300;
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
      // Kick off frame loads immediately (non-blocking). AVIF decode must not
      // gate the stage — that left the page blank when decode stalled.
      frames = MARK_FRAMES.map((src) => {
        const img = new Image();
        img.decoding = 'async';
        img.src = src;
        return img;
      });
      void preloadFrames(MARK_FRAMES).then((loaded) => {
        if (cancelled) return;
        frames = loaded;
        drawFrame(frameIndexRef.current);
      });

      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      if (cancelled || !trackRef.current || !stageRef.current) return;
      gsap.registerPlugin(ScrollTrigger);

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const q = gsap.utils.selector(trackRef.current);

      const resetWordmark = () => {
        gsap.set(q('.wordmark-path'), {
          attr: { 'stroke-dasharray': 800, 'stroke-dashoffset': 800 },
          strokeDasharray: 800,
          strokeDashoffset: 800,
          fill: 'rgba(255,255,255,0)',
        });
      };

      const resetNameBeat = () => {
        nameTl?.kill();
        nameTl = null;
        namePlayed = false;
        gsap.set(q('.mark-visual-logo'), { opacity: 1, visibility: 'visible' });
        gsap.set(q('.mark-copy-logo'), { opacity: 1, y: 0, visibility: 'visible' });
        gsap.set(q('.mark-visual-name'), { opacity: 0, visibility: 'hidden' });
        gsap.set(q('.mark-copy-name'), { opacity: 0, y: 10, visibility: 'hidden' });
        resetWordmark();
      };

      const playNameBeat = () => {
        if (namePlayed) return;
        namePlayed = true;
        nameTl?.kill();

        gsap.to(q('.mark-visual-logo'), {
          opacity: 0,
          duration: 0.35,
          ease: 'power1.in',
          onComplete: () => {
            gsap.set(q('.mark-visual-logo'), { visibility: 'hidden' });
          },
        });
        gsap.to(q('.mark-copy-logo'), {
          opacity: 0,
          y: -8,
          duration: 0.35,
          ease: 'power1.in',
        });

        gsap.set(q('.mark-visual-name'), { visibility: 'visible' });
        gsap.to(q('.mark-visual-name'), {
          opacity: 1,
          duration: 0.2,
          ease: 'power2.out',
        });

        resetWordmark();
        nameTl = gsap.timeline();
        // Outline→fill play-once (not scrubbed). Attr + CSS for SVG reliability.
        nameTl.fromTo(
          q('.wordmark-path'),
          {
            attr: { 'stroke-dashoffset': 800 },
            strokeDashoffset: 800,
            fill: 'rgba(255,255,255,0)',
          },
          {
            attr: { 'stroke-dashoffset': 0 },
            strokeDashoffset: 0,
            duration: 1.15,
            ease: 'power2.inOut',
          }
        );
        nameTl.to(
          q('.wordmark-path'),
          { fill: 'rgba(255,255,255,1)', duration: 0.4, ease: 'power1.out' },
          '-=0.28'
        );
        nameTl.set(q('.mark-copy-name'), { visibility: 'visible' }, '-=0.35');
        nameTl.to(
          q('.mark-copy-name'),
          { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' },
          '-=0.3'
        );
      };

      ctx = gsap.context(() => {
        gsap.set(q('.mark-visual-logo'), { opacity: 1, visibility: 'visible' });
        gsap.set(q('.mark-visual-name'), { opacity: 0, visibility: 'hidden' });
        gsap.set(q('.mark-copy-logo'), { opacity: 0, y: 10 });
        gsap.set(q('.mark-copy-name'), { opacity: 0, y: 10, visibility: 'hidden' });
        resetWordmark();

        if (reduced) {
          drawFrame(FRAME_COUNT - 1);
          gsap.set(q('.mark-visual-logo'), { opacity: 0, visibility: 'hidden' });
          gsap.set(q('.mark-copy-logo'), { opacity: 0, visibility: 'hidden' });
          gsap.set(q('.mark-visual-name'), { opacity: 1, visibility: 'visible' });
          gsap.set(q('.mark-copy-name'), { opacity: 1, y: 0, visibility: 'visible' });
          gsap.set(q('.wordmark-path'), {
            attr: { 'stroke-dashoffset': 0 },
            strokeDashoffset: 0,
            fill: 'rgba(255,255,255,1)',
          });
          if (!cancelled) setReady(true);
          return;
        }

        if (!cancelled) setReady(true);

        gsap.to(q('.mark-copy-logo'), {
          opacity: 1,
          y: 0,
          duration: 0.45,
          delay: 0.15,
          ease: 'power2.out',
        });

        // Pin + map scroll→frames. Wordmark outline→fill is play-once (not
        // scrubbed) so the stroke reads clearly — same as main AboutClient.
        ScrollTrigger.create({
          trigger: trackRef.current,
          start: 'top top',
          end: 'bottom bottom',
          pin: stageRef.current,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            // Finish frames before the name beat so the last frame holds.
            const frameProgress = Math.min(1, self.progress / NAME_BEAT_AT);
            const next = Math.round(frameProgress * (FRAME_COUNT - 1));
            if (next !== frameIndexRef.current) drawFrame(next);

            if (self.progress >= NAME_BEAT_AT) {
              playNameBeat();
            } else if (self.progress < NAME_BEAT_AT - 0.04 && namePlayed) {
              resetNameBeat();
            }
          },
        });

        // Ready gate toggles visibility after create — refresh pin metrics.
        requestAnimationFrame(() => {
          if (!cancelled) ScrollTrigger.refresh();
        });
      }, trackRef);
    };

    void run();

    return () => {
      cancelled = true;
      window.removeEventListener('resize', onResize);
      nameTl?.kill();
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

      <div ref={trackRef} className="relative h-[300vh] w-full">
        <div ref={stageRef} className="relative h-[100dvh] w-full overflow-hidden px-6">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              opacity: ready ? 1 : 0,
              visibility: ready ? 'visible' : 'hidden',
            }}
            aria-hidden={!ready}
          >
            {/* Vertically + horizontally centered visual slot */}
            <div className="absolute left-1/2 top-1/2 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 sm:h-[260px] sm:w-[260px] md:h-[300px] md:w-[300px]">
              <canvas
                ref={canvasRef}
                className="mark-visual-logo absolute inset-0 h-full w-full"
                aria-hidden
              />
              <div
                className="mark-visual-name absolute inset-0 z-[1] flex items-center justify-center opacity-0"
                style={{ visibility: 'hidden' }}
                role="img"
                aria-label="Fjorr"
              >
                <svg
                  width="399"
                  height="245"
                  viewBox="0 0 399 245"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-[56px] w-auto max-w-none shrink-0 overflow-visible sm:h-[72px] md:h-[81px]"
                  style={{ aspectRatio: '399 / 245' }}
                  aria-hidden
                >
                  <style>{`
                    .wordmark-path {
                      stroke: #ffffff;
                      stroke-width: 1.5px;
                      stroke-dasharray: 800;
                      stroke-dashoffset: 800;
                      fill: rgba(255, 255, 255, 0);
                    }
                  `}</style>
                  {WORDMARK_PATHS.map((p) => (
                    <path
                      key={p.d.slice(0, 24)}
                      className="wordmark-path"
                      d={p.d}
                      fillRule={p.fillRule}
                      clipRule={p.clipRule}
                      strokeDasharray={800}
                      strokeDashoffset={800}
                    />
                  ))}
                </svg>
              </div>
            </div>

            {/* Copy anchored under the centered visual */}
            <div className="absolute left-1/2 top-[calc(50%+100px+1.5rem)] w-full max-w-[20rem] -translate-x-1/2 text-center sm:top-[calc(50%+130px+1.75rem)] sm:max-w-[22rem] md:top-[calc(50%+150px+2rem)]">
              <div className="relative min-h-[4.75rem] w-full sm:min-h-[5rem]">
                <div className="mark-copy-logo w-full opacity-0">
                  <p className="m-0 mb-1.5 font-interTight text-[18px] font-bold tracking-tight text-white sm:mb-2 sm:text-[20px] md:text-[22px]">
                    {logoTitle}
                  </p>
                  <p className="m-0 font-sans text-[14px] font-medium leading-snug tracking-tight text-white/50 sm:text-[15px] md:text-[16px]">
                    {logoBody}
                  </p>
                </div>
                <div
                  className="mark-copy-name absolute inset-x-0 top-0 w-full opacity-0"
                  style={{ visibility: 'hidden' }}
                >
                  <p className="m-0 mb-1.5 font-interTight text-[18px] font-bold tracking-tight text-white sm:mb-2 sm:text-[20px] md:text-[22px]">
                    {nameTitle}
                  </p>
                  <p className="m-0 font-sans text-[14px] font-medium leading-snug tracking-tight text-white/50 sm:text-[15px] md:text-[16px]">
                    {nameBody}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <HouseScrollFooter variant="light" surfaceClassName="bg-black" />
    </div>
  );
}
