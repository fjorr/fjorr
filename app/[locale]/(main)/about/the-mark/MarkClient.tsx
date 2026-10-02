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

/** Pin progress where sequence/hold ends and the name beat plays. */
const NAME_BEAT_AT = 0.72;

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

      const resetWordmark = () => {
        gsap.set('.wordmark-path', {
          strokeDasharray: 800,
          strokeDashoffset: 800,
          fill: 'rgba(255,255,255,0)',
        });
      };

      const resetNameBeat = () => {
        nameTl?.kill();
        nameTl = null;
        namePlayed = false;
        gsap.set('.mark-visual-logo', { opacity: 1, visibility: 'visible' });
        gsap.set('.mark-copy-logo', { opacity: 1, y: 0, visibility: 'visible' });
        gsap.set('.mark-visual-name', { opacity: 0, visibility: 'hidden' });
        gsap.set('.mark-copy-name', { opacity: 0, y: 10, visibility: 'hidden' });
        resetWordmark();
      };

      const playNameBeat = () => {
        if (namePlayed) return;
        namePlayed = true;
        nameTl?.kill();

        gsap.to('.mark-visual-logo', {
          opacity: 0,
          duration: 0.35,
          ease: 'power1.in',
          onComplete: () => {
            gsap.set('.mark-visual-logo', { visibility: 'hidden' });
          },
        });
        gsap.to('.mark-copy-logo', {
          opacity: 0,
          y: -8,
          duration: 0.35,
          ease: 'power1.in',
        });

        gsap.set('.mark-visual-name', { visibility: 'visible' });
        gsap.to('.mark-visual-name', {
          opacity: 1,
          duration: 0.2,
          ease: 'power2.out',
        });

        resetWordmark();
        nameTl = gsap.timeline();
        // Same outline→fill timing as main AboutClient (play-once, not scrubbed).
        nameTl.fromTo(
          '.wordmark-path',
          {
            strokeDashoffset: 800,
            fill: 'rgba(255,255,255,0)',
          },
          {
            strokeDashoffset: 0,
            duration: 1.15,
            ease: 'power2.inOut',
          }
        );
        nameTl.to(
          '.wordmark-path',
          { fill: 'rgba(255,255,255,1)', duration: 0.4, ease: 'power1.out' },
          '-=0.28'
        );
        nameTl.set('.mark-copy-name', { visibility: 'visible' }, '-=0.35');
        nameTl.to(
          '.mark-copy-name',
          { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' },
          '-=0.3'
        );
      };

      ctx = gsap.context(() => {
        gsap.set('.mark-visual-logo', { opacity: 1, visibility: 'visible' });
        gsap.set('.mark-visual-name', { opacity: 0, visibility: 'hidden' });
        gsap.set('.mark-copy-logo', { opacity: 0, y: 10 });
        gsap.set('.mark-copy-name', { opacity: 0, y: 10, visibility: 'hidden' });
        resetWordmark();

        if (reduced) {
          drawFrame(FRAME_COUNT - 1);
          gsap.set('.mark-visual-logo', { opacity: 0, visibility: 'hidden' });
          gsap.set('.mark-copy-logo', { opacity: 0, visibility: 'hidden' });
          gsap.set('.mark-visual-name', { opacity: 1, visibility: 'visible' });
          gsap.set('.mark-copy-name', { opacity: 1, y: 0, visibility: 'visible' });
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
                  width="143"
                  height="81"
                  viewBox="0 0 143 81"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-[56px] w-[100px] overflow-visible sm:h-[72px] sm:w-[128px] md:h-[81px] md:w-[143px]"
                  aria-hidden
                >
                  <style>{`
                    .wordmark-path {
                      stroke: #ffffff;
                      stroke-width: 1.5px;
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
