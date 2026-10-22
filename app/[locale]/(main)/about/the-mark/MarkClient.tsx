'use client';

import { useEffect, useRef } from 'react';
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

/**
 * Four exclusive beats on one pinned scroll.
 * Text, helmet scrub, text, wordmark draw. Each holds alone.
 */
const BEAT = {
  logoFade: [0.16, 0.21],
  helmetScrub: [0.21, 0.48],
  helmetHold: 0.52,
  nameFadeIn: [0.52, 0.58],
  nameFadeOut: [0.72, 0.78],
  wordmarkDraw: [0.78, 0.94],
} as const;

type Props = {
  backLabel: string;
  logoTitle: string;
  logoBody: string;
  nameTitle: string;
  nameBody: string;
};

const MARK_HEAD =
  "m-0 text-balance font-[family-name:var(--font-circular-black)] text-[clamp(2.25rem,5.5vw,3rem)] font-[900] leading-[1.05] tracking-[-0.03em] text-white";

const MARK_SUB =
  'm-0 mx-auto mt-6 max-w-[34rem] text-balance font-interTight text-[20px] font-semibold leading-[1.45] tracking-tight text-white/70 sm:mt-8 sm:text-[22px]';

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

/** 0 before `a`, 1 after `b`. */
function unitRange(progress: number, start: number, end: number) {
  if (progress <= start) return 0;
  if (progress >= end) return 1;
  return (progress - start) / (end - start);
}

/**
 * The mark — four pinned beats, one thing on screen:
 * helmet copy, helmet scrub, name copy, wordmark draw.
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
  const frameRef = useRef<HTMLImageElement>(null);
  const frameIndexRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let ctx: { revert: () => void } | null = null;

    const showFrame = (index: number) => {
      const next = Math.max(0, Math.min(FRAME_COUNT - 1, index));
      const el = frameRef.current;
      if (!el || next === frameIndexRef.current) return;
      frameIndexRef.current = next;
      el.src = MARK_FRAMES[next];
    };

    const run = async () => {
      void preloadFrames(MARK_FRAMES);

      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      if (cancelled || !trackRef.current || !stageRef.current) return;
      gsap.registerPlugin(ScrollTrigger);

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const root = trackRef.current;
      const q = gsap.utils.selector(root);

      const paintWordmark = (draw: number) => {
        const offset = 800 * (1 - draw);
        const fill = unitRange(draw, 0.72, 1);
        gsap.set(q('.wordmark-path'), {
          attr: { 'stroke-dasharray': 800, 'stroke-dashoffset': offset },
          strokeDasharray: 800,
          strokeDashoffset: offset,
          fill: `rgba(255,255,255,${fill})`,
        });
      };

      const paintLayer = (selector: string, opacity: number) => {
        gsap.set(q(selector), {
          opacity,
          visibility: opacity < 0.02 ? 'hidden' : 'visible',
        });
      };

      const paint = (progress: number) => {
        const logoOp = 1 - unitRange(progress, BEAT.logoFade[0], BEAT.logoFade[1]);
        const helmetIn = unitRange(progress, BEAT.logoFade[0], BEAT.logoFade[1]);
        const helmetOut = unitRange(progress, BEAT.helmetHold, BEAT.nameFadeIn[1]);
        const nameIn = unitRange(progress, BEAT.nameFadeIn[0], BEAT.nameFadeIn[1]);
        const nameOut = unitRange(progress, BEAT.nameFadeOut[0], BEAT.nameFadeOut[1]);
        const wordIn = unitRange(progress, BEAT.nameFadeOut[0], BEAT.nameFadeOut[1]);

        paintLayer('.mark-copy-logo', logoOp);
        paintLayer('.mark-visual-logo', helmetIn * (1 - helmetOut));
        paintLayer('.mark-copy-name', nameIn * (1 - nameOut));
        paintLayer('.mark-visual-name', wordIn);

        const scrub = unitRange(progress, BEAT.helmetScrub[0], BEAT.helmetScrub[1]);
        showFrame(Math.round(scrub * (FRAME_COUNT - 1)));
        paintWordmark(unitRange(progress, BEAT.wordmarkDraw[0], BEAT.wordmarkDraw[1]));
      };

      ctx = gsap.context(() => {
        if (reduced && trackRef.current && stageRef.current) {
          trackRef.current.style.height = 'auto';
          stageRef.current.style.height = 'auto';
          stageRef.current.style.display = 'flex';
          stageRef.current.style.flexDirection = 'column';
          stageRef.current.style.justifyContent = 'center';
          stageRef.current.style.gap = '6rem';
          stageRef.current.style.paddingTop = '8rem';
          stageRef.current.style.paddingBottom = '8rem';
          q('.mark-layer').forEach((node) => {
            const el = node as HTMLElement;
            el.style.position = 'relative';
            el.style.inset = 'auto';
            el.style.opacity = '1';
            el.style.visibility = 'visible';
          });
          showFrame(0);
          paintWordmark(1);
          return;
        }

        paint(0);

        ScrollTrigger.create({
          trigger: trackRef.current,
          start: 'top top',
          end: 'bottom bottom',
          pin: stageRef.current,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => paint(self.progress),
        });

        requestAnimationFrame(() => {
          if (!cancelled) ScrollTrigger.refresh();
        });
      }, root);
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

      <div ref={trackRef} className="relative h-[680vh] w-full">
        <div ref={stageRef} className="relative h-[100dvh] w-full overflow-hidden">
          <div className="mark-layer mark-copy-logo absolute inset-0 flex items-center justify-center px-6">
            <style>{`
              @keyframes fjorr-apple-up {
                from { opacity: 0; transform: translate3d(0, 0.55em, 0); }
                to { opacity: 1; transform: translate3d(0, 0, 0); }
              }
              @media (prefers-reduced-motion: reduce) {
                .mark-enter { animation: none !important; opacity: 1 !important; transform: none !important; }
              }
            `}</style>
            <div className="w-full max-w-[44rem] text-center">
              <h1
                className={`${MARK_HEAD} mark-enter will-change-[transform,opacity]`}
                style={{
                  animation: 'fjorr-apple-up 0.9s cubic-bezier(0.25, 0.1, 0.25, 1) both',
                }}
              >
                {logoTitle}
              </h1>
              <p
                className={`${MARK_SUB} mark-enter will-change-[transform,opacity]`}
                style={{
                  animation: 'fjorr-apple-up 0.9s cubic-bezier(0.25, 0.1, 0.25, 1) both',
                  animationDelay: '100ms',
                }}
              >
                {logoBody}
              </p>
            </div>
          </div>

          <div
            className="mark-layer mark-visual-logo absolute inset-0 flex items-center justify-center opacity-0"
            style={{ visibility: 'hidden' }}
          >
            <img
              ref={frameRef}
              src={MARK_FRAMES[0]}
              alt=""
              className="object-contain"
              style={{
                width: 'min(560px, 72vw, 68dvh)',
                height: 'min(560px, 72vw, 68dvh)',
              }}
            />
          </div>

          <div
            className="mark-layer mark-copy-name absolute inset-0 flex items-center justify-center px-6 opacity-0"
            style={{ visibility: 'hidden' }}
          >
            <div className="w-full max-w-[44rem] text-center">
              <p className={MARK_HEAD}>{nameTitle}</p>
              <p className={MARK_SUB}>{nameBody}</p>
            </div>
          </div>

          <div
            className="mark-layer mark-visual-name absolute inset-0 flex items-center justify-center opacity-0"
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
              className="w-auto max-w-[88vw] shrink-0 overflow-visible"
              style={{
                height: 'min(420px, 52vw, 48dvh)',
                aspectRatio: '399 / 245',
              }}
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
      </div>

      <HouseScrollFooter variant="light" surfaceClassName="bg-black" />
    </div>
  );
}
