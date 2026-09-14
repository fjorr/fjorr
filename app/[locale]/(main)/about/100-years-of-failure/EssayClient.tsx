'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import HouseScrollFooter from '@/components/HouseScrollFooter';
import { HOUSE_STAGE_SIDE_CLASS } from '@/components/house/house-stage-margins';
import {
  ESSAY_FAILURE_BODY,
  type EssayBlock,
} from '@/lib/content/essay-failure';

/** Méliès reel — same-origin public copy (R2 mirror at media.fjorr.com/app-assets/). */
export const ESSAY_HERO_VIDEO_SRC = '/about/fjorr-le-voyage-dans-la-lune-bg.mp4';

export const ESSAY_HERO_POSTER_SRC =
  'https://media.fjorr.com/app-assets/fjorr-le-voyage-dans-la-lune.jpg';

type Props = {
  title: string;
  lead: string;
  backLabel: string;
  exploreLabel: string;
  /** Optional override; defaults to ESSAY_HERO_VIDEO_SRC. */
  heroVideoSrc?: string;
};

type TimelineItem = {
  year: string;
  title: string;
  text: string;
};

/** Inline: `**bold**`, `*italic*` */
function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/);
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-[#0B0B0C]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={i} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/**
 * Full-bleed snap rail — cards exit left and right of the viewport;
 * first and last settle centered ("in the middle").
 */
function EssayCaseRail({ items }: { items: TimelineItem[] }) {
  const measureRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [columnWidth, setColumnWidth] = useState(0);
  const [sidePad, setSidePad] = useState(0);
  const gap = 16;

  useEffect(() => {
    const measure = measureRef.current;
    if (!measure) return;

    const update = () => {
      const width = Math.round(measure.getBoundingClientRect().width);
      const vw = window.innerWidth;
      setColumnWidth(width);
      setSidePad(Math.max(0, Math.round((vw - width) / 2)));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(measure);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || columnWidth <= 0) return;

    const stride = columnWidth + gap;
    const sync = () => {
      const next = Math.round(el.scrollLeft / stride);
      setIndex(Math.max(0, Math.min(items.length - 1, next)));
    };

    sync();
    el.addEventListener('scroll', sync, { passive: true });
    return () => el.removeEventListener('scroll', sync);
  }, [items.length, columnWidth, gap]);

  const goTo = (next: number) => {
    const el = scrollerRef.current;
    if (!el || columnWidth <= 0) return;
    const clamped = Math.max(0, Math.min(items.length - 1, next));
    el.scrollTo({ left: clamped * (columnWidth + gap), behavior: 'smooth' });
    setIndex(clamped);
  };

  return (
    <div className="relative mb-8 mt-10 sm:mb-10 sm:mt-14">
      <div ref={measureRef} className="h-0 w-full" aria-hidden />
      <div
        ref={scrollerRef}
        className="relative left-1/2 flex w-screen max-w-[100vw] -translate-x-1/2 snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          gap,
          paddingLeft: sidePad,
          paddingRight: sidePad,
        }}
        aria-label="Broken models through cinema history"
      >
        {items.map((item) => (
          <article
            key={item.title}
            className="shrink-0 snap-center"
            style={{
              width: columnWidth > 0 ? columnWidth : '100%',
            }}
          >
            <div className="h-full rounded-[8px] bg-[#F5F5F7] px-9 py-11 sm:px-12 sm:py-14">
              <p className="m-0 mb-3 font-futura text-[clamp(2.25rem,7vw,3.25rem)] leading-[0.9] tracking-tighter text-[#0B0B0C]">
                {item.year}
              </p>
              <h3 className="m-0 mb-3 font-interTight text-[16px] font-bold leading-snug tracking-tight text-[#0B0B0C] sm:text-[17px]">
                {item.title}
              </h3>
              <p className="m-0 font-sans text-[16px] font-medium leading-[1.7] tracking-[-0.01em] text-black/60 sm:text-[17px]">
                {renderInline(item.text)}
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={index <= 0}
          aria-label="Previous case"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-black/10 text-[#0B0B0C] transition-opacity enabled:hover:bg-black/[0.04] disabled:opacity-25"
        >
          <ArrowLeft className="size-[15px]" strokeWidth={2.25} aria-hidden />
        </button>
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Cases">
          {items.map((item, i) => (
            <button
              key={item.year + item.title}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`${item.year}: ${item.title}`}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? 'w-5 bg-[#0B0B0C]' : 'w-1.5 bg-black/20 hover:bg-black/35'
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          disabled={index >= items.length - 1}
          aria-label="Next case"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-black/10 text-[#0B0B0C] transition-opacity enabled:hover:bg-black/[0.04] disabled:opacity-25"
        >
          <ArrowRight className="size-[15px]" strokeWidth={2.25} aria-hidden />
        </button>
      </div>
    </div>
  );
}

function renderBody(blocks: EssayBlock[]) {
  let firstParagraph = true;
  return blocks.map((block, i) => {
    if (block.type === 'h2') {
      return (
        <h2
          key={`h2-${i}`}
          className="m-0 mb-4 mt-10 font-interTight text-[clamp(1.35rem,3.5vw,1.75rem)] font-bold leading-[1.2] tracking-tight text-[#0B0B0C] sm:mb-5 sm:mt-12"
        >
          {block.text}
        </h2>
      );
    }

    if (block.type === 'timeline') {
      return <EssayCaseRail key={`tl-${i}`} items={block.items} />;
    }

    if (block.type === 'figure') {
      return (
        <figure key={`fig-${i}`} className="mx-auto my-10 w-[75%] sm:my-14">
          <div className="overflow-hidden rounded-2xl bg-black/[0.04]">
            <Image
              src={block.src}
              alt={block.alt}
              width={block.width}
              height={block.height}
              className="block h-auto w-full"
              sizes="(max-width: 640px) 75vw, 504px"
              priority={false}
            />
          </div>
          {block.caption ? (
            <figcaption className="mt-3 px-1 text-center font-sans text-[13px] font-medium leading-[1.45] tracking-[-0.01em] text-black/45 sm:mt-3.5 sm:text-[14px]">
              {renderInline(block.caption)}
            </figcaption>
          ) : null}
        </figure>
      );
    }

    const isFirst = firstParagraph;
    firstParagraph = false;
    return (
      <p
        key={`p-${i}`}
        className={
          isFirst
            ? 'm-0 mb-8 font-interTight text-[21px] font-semibold leading-[1.45] tracking-tight text-[#0B0B0C] sm:mb-10'
            : 'm-0 mb-5 font-sans text-[16px] font-medium leading-[1.7] tracking-[-0.01em] text-black/70 sm:mb-6 sm:text-[17px]'
        }
      >
        {renderInline(block.text)}
      </p>
    );
  });
}

/**
 * Founding essay — framed Méliès reel (house gutters), then white paper body.
 */
export default function EssayClient({
  title,
  lead,
  backLabel,
  exploreLabel,
  heroVideoSrc = ESSAY_HERO_VIDEO_SRC,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !heroVideoSrc) return;

    // React often fails to apply the `muted` DOM property, which blocks autoplay.
    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');

    const markReady = () => setVideoReady(true);
    const tryPlay = () => {
      const p = video.play();
      if (p && typeof p.then === 'function') {
        p.then(markReady).catch(() => {});
      }
    };

    tryPlay();
    video.addEventListener('playing', markReady);
    video.addEventListener('canplay', tryPlay);
    video.addEventListener('loadeddata', tryPlay);
    return () => {
      video.removeEventListener('playing', markReady);
      video.removeEventListener('canplay', tryPlay);
      video.removeEventListener('loadeddata', tryPlay);
    };
  }, [heroVideoSrc]);

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-clip bg-white text-[#0B0B0C]">
      <section
        className={`relative w-full bg-white ${HOUSE_STAGE_SIDE_CLASS}`}
        aria-label={title}
      >
        {/* Nav 56 + footer chrome 54 — same stage window as film / join. */}
        <div className="relative flex h-[calc(100dvh-56px-54px)] w-full flex-col items-center justify-center overflow-hidden rounded-[8px] bg-black text-white">
          {/* Still shows immediately; video fades in once playing */}
          <img
            src={ESSAY_HERO_POSTER_SRC}
            alt=""
            className="absolute inset-0 z-0 h-full w-full object-cover"
            draggable={false}
          />
          {heroVideoSrc ? (
            <video
              ref={videoRef}
              className={`absolute inset-0 z-0 h-full w-full object-cover transition-opacity duration-700 ${
                videoReady ? 'opacity-100' : 'opacity-0'
              }`}
              muted
              playsInline
              loop
              autoPlay
              preload="auto"
              poster={ESSAY_HERO_POSTER_SRC}
              aria-hidden
            >
              <source src={heroVideoSrc} type="video/mp4" />
            </video>
          ) : null}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/55 via-black/25 to-black/35"
          />
          <header className="relative z-[2] mx-auto flex max-w-[42rem] flex-col items-center px-5 text-center sm:px-8">
            <h1 className="m-0 text-balance font-futura text-[clamp(2.75rem,9vw,5rem)] leading-[0.88] tracking-tighter text-white">
              {title}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-balance font-interTight text-[21px] font-semibold leading-normal tracking-tight text-white/70 sm:mt-5">
              {lead}
            </p>
          </header>
        </div>
      </section>

      <article className="relative mx-auto w-full max-w-[42rem] flex-1 overflow-x-visible px-5 pb-20 pt-10 sm:px-8 sm:pb-24 sm:pt-14">
        <p className="m-0 mb-10 text-center sm:mb-12">
          <Link
            href="/about"
            className="inline-flex items-center gap-1.5 font-sans text-[13px] font-semibold text-black/35 transition-colors hover:text-black/60"
          >
            <ArrowLeft className="size-[14px] shrink-0" strokeWidth={2.25} aria-hidden />
            {backLabel}
          </Link>
        </p>

        <div className="flex flex-col">{renderBody(ESSAY_FAILURE_BODY)}</div>

        <p className="m-0 mt-10 sm:mt-12">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-sans text-[14px] font-semibold text-black/45 transition-colors hover:text-black/80"
          >
            {exploreLabel}
            <ArrowRight className="size-[15px] shrink-0" strokeWidth={2.25} aria-hidden />
          </Link>
        </p>
      </article>
      <HouseScrollFooter />
    </div>
  );
}
