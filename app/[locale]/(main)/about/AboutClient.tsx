'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import HouseScrollFooter from '@/components/HouseScrollFooter';
import { ContactPill } from '@/components/ui/contact-pill';
import { Icon } from '@/components/ui/Icons';

export type AboutPoster = {
  href: string;
  title: string;
  /** Optional line breaks for billboard posters (e.g. essay). */
  titleLines?: string[];
  tagline: string;
  image: string | null;
  /** Optional muted loop — plays while in view (no still). */
  video?: string | null;
  /** When set, image is contained (mark) instead of cover-cropped. */
  imageFit?: 'cover' | 'contain';
};

export type AboutBeat = {
  text: string;
};

export type AboutCopy = {
  /** Manifesto beats — one sentence at a time via arrows. */
  manifestoBeats: AboutBeat[];
  scrollLabel: string;
  deckHintLead: string;
  deckHint: string;
  contactHeadlineLines: string[];
  contactBlurb: string;
  posters: AboutPoster[];
};

const BEAT_TYPE =
  'm-0 w-full max-w-[22rem] text-balance text-center font-interTight text-[30px] font-semibold leading-[1.25] tracking-tight text-[#f5f5f7] sm:max-w-[34rem] md:max-w-[40rem]';

/** Apple-style: soft fade + rise. One motion for every beat. */
function AppleBeat({ text }: { text: string }) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(
      typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }, []);

  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const stacked = lines.length > 1;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes fjorr-apple-up {
              from {
                opacity: 0;
                transform: translate3d(0, 0.55em, 0);
              }
              to {
                opacity: 1;
                transform: translate3d(0, 0, 0);
              }
            }
          `,
        }}
      />
      <p
        className={BEAT_TYPE}
        style={{ fontSize: 30 }}
        aria-label={stacked ? lines.join(' ') : undefined}
      >
        {lines.map((line, i) => (
          <span
            key={`${i}-${line}`}
            className={`${stacked ? 'block' : 'inline-block'} will-change-[transform,opacity]`}
            style={
              reduced
                ? undefined
                : {
                    opacity: 0,
                    animation:
                      'fjorr-apple-up 0.9s cubic-bezier(0.25, 0.1, 0.25, 1) both',
                    animationDelay: `${i * 100}ms`,
                  }
            }
          >
            {line}
          </span>
        ))}
      </p>
    </>
  );
}

function PosterFace({ poster }: { poster: AboutPoster }) {
  const fit = poster.imageFit ?? 'cover';
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const hasVideo = Boolean(poster.video);

  useEffect(() => {
    if (!poster.video) return;
    const root = rootRef.current;
    const video = videoRef.current;
    if (!root || !video) return;

    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;

    const play = () => {
      const p = video.play();
      if (p && typeof p.then === 'function') {
        p.then(() => setVideoReady(true)).catch(() => {});
      }
    };
    const pause = () => {
      video.pause();
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) play();
        else pause();
      },
      { threshold: 0.35 }
    );
    io.observe(root);
    return () => io.disconnect();
  }, [poster.video]);

  return (
    <div ref={rootRef} className="absolute inset-0 bg-black">
      {!hasVideo && poster.image ? (
        <Image
          src={poster.image}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 720px"
          className={
            fit === 'contain'
              ? 'object-contain object-center p-[18%] sm:p-[20%]'
              : 'object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]'
          }
        />
      ) : null}
      {!hasVideo && !poster.image ? (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(/about/dot-grid.png)',
            backgroundSize: '18px 18px',
            backgroundRepeat: 'repeat',
            backgroundColor: '#0c0c0c',
          }}
        />
      ) : null}
      {poster.video ? (
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            videoReady ? 'opacity-100' : 'opacity-0'
          }`}
          muted
          playsInline
          loop
          preload="auto"
          aria-hidden
        >
          <source src={poster.video} type="video/mp4" />
        </video>
      ) : null}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 ${
          hasVideo
            ? 'bg-gradient-to-t from-black/80 via-black/35 to-black/25'
            : 'bg-gradient-to-t from-black/85 via-black/25 to-black/10'
        }`}
      />
      {hasVideo ? (
        <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center px-6 text-center sm:px-8">
          <h2 className="m-0 text-balance font-futura text-[clamp(2.35rem,6.5vw,3.75rem)] leading-[0.88] tracking-tighter text-white">
            {(poster.titleLines?.length
              ? poster.titleLines
              : [poster.title]
            ).map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h2>
          <p className="m-0 mt-4 max-w-[22rem] text-balance font-interTight text-[14px] font-semibold leading-snug tracking-tight text-white/70 sm:mt-5 sm:text-[15px]">
            {poster.tagline}
          </p>
        </div>
      ) : (
        <div className="absolute inset-x-0 bottom-0 z-[1] p-5 text-left sm:p-7 md:p-8">
          <h2 className="m-0 font-futura text-[clamp(1.35rem,3.2vw,1.85rem)] leading-[0.9] tracking-tighter text-white">
            {poster.title}
          </h2>
          <p className="m-0 mt-1.5 max-w-[22rem] font-interTight text-[14px] font-semibold leading-snug tracking-tight text-white/65 sm:text-[15px]">
            {poster.tagline}
          </p>
        </div>
      )}
    </div>
  );
}

const SCOUT_SRC = '/fjorr_scout.mp4';

/** Make 'Em Feel — black poster: copy left, scout right. */
function MakeEmFeelPoster({
  headlineLines,
  blurb,
}: {
  headlineLines: string[];
  blurb: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const video = videoRef.current;
    if (!root || !video) return;

    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;
    if (!video.getAttribute('src')) {
      video.src = SCOUT_SRC;
      video.load();
    }

    const play = () => {
      const p = video.play();
      if (p && typeof p.then === 'function') {
        p.then(() => setVideoReady(true)).catch(() => {});
      }
    };
    const pause = () => video.pause();

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) play();
        else pause();
      },
      { threshold: 0.25 }
    );
    io.observe(root);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={rootRef}
      className="grid min-h-[420px] w-full grid-cols-1 overflow-hidden rounded-[8px] bg-black sm:min-h-[480px] md:min-h-[520px] md:grid-cols-2 lg:min-h-[560px]"
    >
      <div className="flex flex-col justify-center px-10 py-14 text-left sm:px-12 sm:py-16 md:px-14 md:py-16 lg:px-16 lg:py-20">
        <h2 className="m-0 whitespace-pre-line font-futura text-[clamp(2.35rem,6.5vw,3.75rem)] leading-[0.88] tracking-tighter text-white">
          {headlineLines.join('\n')}
        </h2>
        <p className="m-0 mt-5 max-w-[28rem] font-interTight text-[17px] font-semibold leading-[1.45] tracking-tight text-white/65 sm:mt-6 sm:text-[18px]">
          {blurb}
        </p>
        <div
          className="mt-8 w-fit md:mt-10"
          style={
            {
              ['--page-fg' as string]: '#FFFFFF',
              ['--page-bg' as string]: '#0B0B0C',
            } as React.CSSProperties
          }
        >
          <ContactPill className="!min-w-0 !justify-start" />
        </div>
      </div>

      <div className="relative flex min-h-[320px] items-center justify-center bg-black px-6 py-12 sm:min-h-[360px] md:min-h-full md:justify-start md:pl-2 md:pr-10 md:py-14 lg:pl-0 lg:pr-12 lg:py-16">
        <div className="relative aspect-[440/359] w-full max-w-[min(520px,92%)]">
          <video
            ref={videoRef}
            muted
            playsInline
            loop
            preload="none"
            className={`h-full w-full object-contain transition-opacity duration-700 ${
              videoReady ? 'opacity-100' : 'opacity-0'
            }`}
            aria-label="Fjorr scout"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * About — 100vh black manifesto deck (arrows like Language), then white paper.
 * Dispatches `fjorr:about-hero` so MainChrome can flip nav at the seam.
 */
export default function AboutClient({ copy }: { copy: AboutCopy }) {
  const { manifestoBeats, scrollLabel, deckHintLead, deckHint } = copy;
  const beats = manifestoBeats;
  const [index, setIndex] = useState(0);
  const stageRef = useRef<HTMLElement>(null);
  const paperRef = useRef<HTMLElement>(null);

  const safeIndex = Math.min(index, Math.max(beats.length - 1, 0));
  const current = beats[safeIndex];
  const currentText = (current?.text ?? '').replace(
    /^(Taking the world's)\s+/i,
    '$1\n'
  );
  const canPrev = safeIndex > 0;
  const canNext = safeIndex < beats.length - 1;
  const atEnd = beats.length > 0 && safeIndex === beats.length - 1;

  const go = useCallback(
    (direction: -1 | 1) => {
      const next = safeIndex + direction;
      if (next < 0 || next >= beats.length) return;
      setIndex(next);
    },
    [beats.length, safeIndex]
  );

  const scrollToPaper = useCallback(() => {
    paperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);
  // Nav chrome: white over black frame, dark on paper.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const publish = (overHero: boolean) => {
      window.dispatchEvent(
        new CustomEvent('fjorr:about-hero', { detail: overHero })
      );
    };

    publish(true);
    const io = new IntersectionObserver(
      ([entry]) => {
        publish(Boolean(entry?.isIntersecting));
      },
      { threshold: 0.2, rootMargin: '0px 0px -12% 0px' }
    );
    io.observe(stage);
    return () => {
      io.disconnect();
      publish(false);
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        go(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        go(1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-clip bg-white text-[#0B0B0C] select-none">
      <section
        ref={stageRef}
        className="relative -mt-[44px] flex h-[calc(100dvh+44px)] w-full flex-col overflow-hidden bg-black px-6 text-white md:-mt-[60px] md:h-[calc(100dvh+60px)] lg:-mt-[100px] lg:h-[calc(100dvh+100px)]"
        aria-roledescription="carousel"
        aria-label="About Fjorr"
      >
        {/* Beat — stays centered; length doesn’t shove the controls */}
        <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-28 pt-16 md:pb-32">
          <div key={safeIndex} className="relative z-0 flex w-full justify-center">
            <AppleBeat text={currentText} />
          </div>
        </div>

        {/* Controls — pinned to bottom of the black stage */}
        <div className="absolute inset-x-0 bottom-0 z-[2] flex flex-col items-center gap-4 px-6 pb-16 pt-4 md:pb-20 lg:pb-24">
          {atEnd ? (
            <button
              type="button"
              onClick={scrollToPaper}
              className="inline-flex items-center gap-1.5 border-0 bg-transparent p-0 font-sans text-[13px] font-medium tracking-tight text-white/45 transition-colors hover:text-white/70"
            >
              <span>{scrollLabel}</span>
              <ArrowDown className="size-3.5" strokeWidth={2.25} aria-hidden />
            </button>
          ) : null}

          {beats.length > 1 ? (
            <div className="flex flex-col items-center gap-3">
              {!atEnd ? (
                <p className="m-0 flex items-center justify-center gap-1.5 font-sans text-[13px] font-medium tracking-tight text-white/40">
                  <span>{deckHintLead}</span>
                  <span className="inline-flex items-center gap-0.5 text-white/50" aria-hidden>
                    <ArrowLeft className="size-3.5" strokeWidth={2.25} />
                    <ArrowRight className="size-3.5" strokeWidth={2.25} />
                  </span>
                  <span>{deckHint}</span>
                </p>
              ) : null}
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  disabled={!canPrev}
                  aria-label="Previous"
                  className="flex h-9 w-9 items-center justify-center border-0 bg-transparent p-0 text-white transition-opacity hover:enabled:opacity-80 disabled:cursor-default disabled:opacity-35"
                >
                  <Icon
                    name="circleNavBackDark"
                    className="!h-9 !w-9"
                    aria-hidden
                  />
                </button>
                <p
                  className="m-0 min-w-[3.25rem] text-center font-sans text-[13px] font-medium tabular-nums tracking-tight text-white/45"
                  aria-live="polite"
                >
                  {safeIndex + 1}
                  <span className="text-white/25"> / </span>
                  {beats.length}
                </p>
                <button
                  type="button"
                  onClick={() => go(1)}
                  disabled={!canNext}
                  aria-label="Next"
                  className="flex h-9 w-9 items-center justify-center border-0 bg-transparent p-0 text-white transition-opacity hover:enabled:opacity-80 disabled:cursor-default disabled:opacity-35"
                >
                  <Icon
                    name="circleNavForwardDark"
                    className="!h-9 !w-9"
                    aria-hidden
                  />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* White paper — doors + contact */}
      <section
        ref={paperRef}
        className="relative w-full bg-white px-5 pb-28 pt-20 sm:px-8 md:px-16 md:pb-36 md:pt-28"
      >
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5">
          <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2">
            {copy.posters.map((poster) => (
              <Link
                key={poster.href}
                href={poster.href}
                className="group relative block aspect-[5/4] w-full overflow-hidden rounded-[8px] bg-[#0c0c0c] sm:aspect-[4/3]"
              >
                <PosterFace poster={poster} />
              </Link>
            ))}
          </div>

          <MakeEmFeelPoster
            headlineLines={copy.contactHeadlineLines}
            blurb={copy.contactBlurb}
          />
        </div>
      </section>

      <HouseScrollFooter />
    </div>
  );
}
