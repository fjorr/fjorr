'use client';

import React, { useEffect, useRef } from 'react';
import { Link } from '@/i18n/navigation';

export type AboutCopy = {
  heroLines: string[];
  manifestoHeadline: string;
  manifestoParagraphs: string[];
  logoLabel: string;
  logoTitle: string;
  logoBody: string;
  nameLabel: string;
  nameTitle: string;
  nameBody: React.ReactNode;
  exploreFjorr: string;
};

const HELMET_FRAMES = [1, 2, 3, 4, 5] as const;
const SCOUT_SRC = '/fjorr_scout.mp4';

/**
 * About — three beats:
 * 1 Statement (Matter / Myth)
 * 2 Scout stage — small overlay line on the girl, then body reveal
 * 3 Name / mark cards
 */
export default function AboutClient({ copy }: { copy: AboutCopy }) {
  const { heroLines, manifestoHeadline, manifestoParagraphs } = copy;

  const heroSectionRef = useRef<HTMLElement>(null);
  const scoutSectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const markGridRef = useRef<HTMLDivElement>(null);
  const markCardRef = useRef<HTMLElement>(null);
  const nameCardRef = useRef<HTMLElement>(null);

  // Attach scout video src when section nears viewport
  useEffect(() => {
    const el = scoutSectionRef.current;
    const video = videoRef.current;
    if (!el || !video) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        if (!video.getAttribute('src')) {
          video.src = SCOUT_SRC;
          video.load();
        }
        io.disconnect();
      },
      { rootMargin: '100px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Motions — GSAP loaded on demand
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let openTl: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let matterReplay: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mythExit: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let scoutTl: any = null;
    let scoutTrigger: { kill: () => void } | null = null;
    let heroReplayTrigger: { kill: () => void } | null = null;
    let ctx: { revert: () => void } | null = null;

    const run = async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const video = videoRef.current;

      openTl = gsap.timeline({ defaults: { ease: 'none' } });
      if (reduced) {
        gsap.set('.reveal-line', { visibility: 'visible', opacity: 1 });
        gsap.set('.scout-headline', { opacity: 1, y: 0 });
        gsap.set('.scout-body-p', { opacity: 1, y: 0 });
        gsap.set('.scout-explore', { opacity: 1 });
      } else {
        // Both lines on page load: fade + rise, line 1 then line 2.
        // Then Matter fades after a read beat — Myth stays until scout.
        gsap.set('.reveal-line', {
          visibility: 'visible',
          opacity: 0,
          y: 22,
          filter: 'blur(0px)',
        });

        openTl.to('.reveal-line-matter', {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
        });
        openTl.to(
          '.reveal-line-myth',
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
          },
          '-=0.4'
        );
        openTl.to(
          '.reveal-line-matter',
          {
            opacity: 0,
            filter: 'blur(10px)',
            y: -8,
            duration: 1,
            ease: 'power2.inOut',
          },
          '+=1.15'
        );

        // Wire Myth's scroll-exit only after the entrance finishes —
        // otherwise ScrollTrigger's fromTo immediate-renders and skips the fade-up.
        openTl.add(() => {
          mythExit = gsap.fromTo(
            '.reveal-line-myth',
            { opacity: 1, y: 0 },
            {
              opacity: 0,
              y: -16,
              ease: 'power1.in',
              immediateRender: false,
              scrollTrigger: {
                trigger: scoutSectionRef.current,
                start: 'top 85%',
                end: 'top 45%',
                scrub: 0.2,
              },
            }
          );
        });

        // Scroll back to hero → Matter is present again, then blurs out.
        const replayMatterFade = () => {
          matterReplay?.kill();
          gsap.killTweensOf('.reveal-line-matter');
          gsap.set('.reveal-line-matter', {
            visibility: 'visible',
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            clearProps: 'autoAlpha',
          });
          gsap.set('.reveal-line-myth', {
            visibility: 'visible',
            opacity: 1,
            y: 0,
          });
          matterReplay = gsap.to('.reveal-line-matter', {
            opacity: 0,
            filter: 'blur(10px)',
            y: -8,
            duration: 1,
            ease: 'power2.inOut',
            delay: 0.85,
          });
        };

        heroReplayTrigger = ScrollTrigger.create({
          trigger: heroSectionRef.current,
          start: 'top 70%',
          // Skip the initial enter (openTl handles first play).
          onEnterBack: replayMatterFade,
        });

        gsap.set('.scout-headline', { opacity: 0, y: 10 });
        gsap.set('.scout-body-p', { opacity: 0, y: 14 });
        gsap.set('.scout-explore', { opacity: 0 });
      }

      const ensureScoutSrc = () => {
        if (!video) return;
        if (!video.getAttribute('src')) {
          video.src = SCOUT_SRC;
          video.load();
        }
      };

      const playScout = () => {
        if (!video || reduced) return;
        ensureScoutSrc();
        video.pause();
        video.currentTime = 0;
        video.loop = false;
        const p = video.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      };

      const resetScoutReveal = () => {
        if (reduced) return;
        scoutTl?.kill();
        scoutTl = null;
        if (video) {
          video.pause();
          try {
            video.currentTime = 0;
          } catch {
            /* ignore seek before load */
          }
        }
        gsap.set('.scout-headline', { opacity: 0, y: 10 });
        gsap.set('.scout-body-p', { opacity: 0, y: 14 });
        gsap.set('.scout-explore', { opacity: 0 });
      };

      const runScoutReveal = () => {
        if (reduced) return;
        // Restart cleanly if user scrolled away mid-sequence.
        scoutTl?.kill();
        playScout();

        scoutTl = gsap.timeline({ defaults: { ease: 'power2.out' } });
        // Small line fades over her after the scout has a beat alone.
        scoutTl.fromTo(
          '.scout-headline',
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 1.05, delay: 1.1 }
        );
        // Body follows after the line has been readable.
        scoutTl.fromTo(
          '.scout-body-p',
          { opacity: 0, y: 14 },
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.14,
          },
          '+=1.35'
        );
        scoutTl.fromTo(
          '.scout-explore',
          { opacity: 0 },
          { opacity: 1, duration: 0.4 },
          '-=0.15'
        );
      };

      // Replay when scrolling back up past the stage, then down again.
      scoutTrigger = ScrollTrigger.create({
        trigger: scoutSectionRef.current,
        start: 'top 62%',
        onEnter: runScoutReveal,
        onLeaveBack: resetScoutReveal,
      });

      ctx = gsap.context(() => {
        gsap.set('.helmet-frame', { opacity: 0, visibility: 'hidden' });
        gsap.set('.helmet-frame-1', {
          opacity: reduced ? 1 : 0,
          visibility: reduced ? 'visible' : 'hidden',
        });
        gsap.set('.wordmark-path', {
          strokeDasharray: 800,
          strokeDashoffset: reduced ? 0 : 800,
          fill: reduced ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0)',
        });
        gsap.set('.mark-copy', { opacity: reduced ? 1 : 0, y: reduced ? 0 : 10 });

        if (reduced) {
          gsap.set('.helmet-frame-1', { opacity: 1, visibility: 'visible' });
          return;
        }

        // Fire when each card is actually in view (not when the grid top peeks in).
        const cardEnter = {
          start: 'top 68%',
          once: true,
        } as const;

        const markTl = gsap.timeline({
          delay: 0.2,
          scrollTrigger: {
            trigger: markCardRef.current,
            ...cardEnter,
          },
        });

        markTl.set('.helmet-frame-1', { opacity: 1, visibility: 'visible' });
        markTl.to('.helmet-frame-2', {
          opacity: 1,
          visibility: 'visible',
          duration: 0.08,
          ease: 'steps(1)',
        });
        markTl.set('.helmet-frame-1', { opacity: 0, visibility: 'hidden' });
        markTl.to('.helmet-frame-3', {
          opacity: 1,
          visibility: 'visible',
          duration: 0.08,
          ease: 'steps(1)',
        });
        markTl.set('.helmet-frame-2', { opacity: 0, visibility: 'hidden' });
        markTl.to('.helmet-frame-4', {
          opacity: 1,
          visibility: 'visible',
          duration: 0.08,
          ease: 'steps(1)',
        });
        markTl.set('.helmet-frame-3', { opacity: 0, visibility: 'hidden' });
        markTl.to('.helmet-frame-5', {
          opacity: 1,
          visibility: 'visible',
          duration: 0.08,
          ease: 'steps(1)',
        });
        markTl.set('.helmet-frame-4', { opacity: 0, visibility: 'hidden' });
        markTl.to('.mark-copy-logo', { opacity: 1, y: 0, duration: 0.35 }, '-=0.05');

        const nameTl = gsap.timeline({
          delay: 0.25,
          scrollTrigger: {
            trigger: nameCardRef.current,
            ...cardEnter,
          },
        });

        nameTl.fromTo(
          '.wordmark-path',
          {
            strokeDashoffset: 800,
            fill: 'rgba(255,255,255,0)',
          },
          {
            strokeDashoffset: 0,
            duration: 1.05,
            ease: 'power2.inOut',
          }
        );
        nameTl.to(
          '.wordmark-path',
          { fill: 'rgba(255,255,255,1)', duration: 0.35 },
          '-=0.25'
        );
        nameTl.to(
          '.mark-copy-name',
          { opacity: 1, y: 0, duration: 0.35 },
          '-=0.2'
        );
      }, markGridRef);
    };

    void run();

    return () => {
      cancelled = true;
      openTl?.kill();
      matterReplay?.kill();
      mythExit?.scrollTrigger?.kill();
      mythExit?.kill();
      scoutTl?.kill();
      scoutTrigger?.kill();
      heroReplayTrigger?.kill();
      videoRef.current?.pause();
      ctx?.revert();
    };
  }, [heroLines.length]);

  return (
    <div className="w-full bg-black text-white relative select-none min-h-screen">
      {/* Beat 1 — Statement */}
      <section
        ref={heroSectionRef}
        className="relative w-full min-h-[calc(100dvh+72px)] flex flex-col items-center justify-center text-center px-6 -mt-[72px]"
      >
        <h1 className="font-futura font-extrabold uppercase tracking-tighter text-[#f5f5f7] w-full max-w-5xl text-[clamp(2.75rem,12.5vw,8.75rem)] leading-[0.88] -translate-y-[min(5vh,2.75rem)]">
          {heroLines.map((line, i) => (
            <span
              key={line}
              className={`reveal-line block${
                i === 0
                  ? ' reveal-line-matter'
                  : i === 1
                    ? ' reveal-line-myth'
                    : ''
              }`}
            >
              {line}
            </span>
          ))}
        </h1>
      </section>

      {/* Beat 2 — Scout stage + overlay line, then body */}
      <section
        ref={scoutSectionRef}
        className="relative w-full flex flex-col items-center px-6 pb-14 md:pb-20"
      >
        <div className="relative flex w-full min-h-[min(78dvh,720px)] flex-col items-center justify-center pt-6 md:pt-10">
          <div className="relative w-full max-w-[min(620px,88vw)] aspect-[440/359]">
            <video
              ref={videoRef}
              muted
              playsInline
              preload="none"
              className="h-full w-full object-contain"
              aria-label="Fjorr scout"
            />
            {/* Soft veil so small type reads over the lantern */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-[8%] bottom-[18%] top-[42%] rounded-full opacity-80"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.18) 48%, transparent 72%)',
              }}
            />
            <h2 className="scout-headline pointer-events-none absolute inset-x-6 top-[52%] z-[1] -translate-y-1/2 text-center font-interTight text-[clamp(1.05rem,2.6vw,1.35rem)] font-semibold leading-snug tracking-tight text-[#f5f5f7] text-balance sm:inset-x-10">
              {manifestoHeadline}
            </h2>
          </div>
        </div>

        <div className="mx-auto mt-2 w-full max-w-[28rem] space-y-4 text-left font-sans text-[clamp(1.05rem,2.1vw,1.2rem)] font-medium leading-[1.5] tracking-normal text-[#f5f5f7]/88 md:mt-4 md:space-y-5">
          {manifestoParagraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="scout-body-p m-0">
              {paragraph}
            </p>
          ))}
        </div>
        <div className="scout-explore mx-auto mt-7 w-full max-w-[28rem] md:mt-8">
          <Link
            href="/"
            className="font-sans text-[14px] font-semibold text-white/45 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white/80"
          >
            {copy.exploreFjorr}
          </Link>
        </div>
      </section>

      {/* Beat 3 — Name & mark cards */}
      <section className="relative w-full px-6 sm:px-8 md:px-16 pt-10 md:pt-16 pb-20 md:pb-24">
        <div
          ref={markGridRef}
          className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-[20px] md:grid-cols-2"
        >
          {/* Mark / helmet */}
          <article
            ref={markCardRef}
            className="relative flex min-h-[360px] flex-col overflow-hidden rounded-[8px] border border-white/15 bg-[#0c0c0c] text-white md:min-h-[400px] lg:min-h-[440px]"
            style={{
              backgroundImage: 'url(/about/dot-grid.png)',
              backgroundSize: '18px 18px',
              backgroundRepeat: 'repeat',
            }}
          >
            <div className="relative flex flex-1 flex-col px-6 py-8 sm:px-8 md:px-10">
              <p className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">
                {copy.logoLabel}
              </p>
              <div className="flex flex-1 items-center justify-center py-14 md:py-16">
                <div className="relative h-[120px] w-[120px] sm:h-[136px] sm:w-[136px]">
                  {HELMET_FRAMES.map((n) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={n}
                      src={`/about/helmet/frame-0${n}.avif`}
                      alt=""
                      width={256}
                      height={256}
                      decoding="async"
                      loading={n === 1 ? 'eager' : 'lazy'}
                      className={`helmet-frame helmet-frame-${n} absolute inset-0 h-full w-full object-contain object-center`}
                      style={{ opacity: 0, visibility: 'hidden' }}
                    />
                  ))}
                </div>
              </div>
              <div className="mark-copy mark-copy-logo mt-auto w-full max-w-[22rem] text-left font-sans">
                <p className="mb-1.5 text-[14px] font-bold leading-snug text-white sm:text-[15px]">
                  {copy.logoTitle}
                </p>
                <p className="text-[13px] font-medium leading-snug tracking-tight text-[#f5f5f7]/65 sm:text-[14px]">
                  {copy.logoBody}
                </p>
              </div>
            </div>
          </article>

          {/* Name / wordmark */}
          <article
            ref={nameCardRef}
            className="relative flex min-h-[360px] flex-col overflow-hidden rounded-[8px] border border-white/15 bg-[#0c0c0c] text-white md:min-h-[400px] lg:min-h-[440px]"
            style={{
              backgroundImage: 'url(/about/dot-grid.png)',
              backgroundSize: '18px 18px',
              backgroundRepeat: 'repeat',
            }}
          >
            <div className="relative flex flex-1 flex-col px-6 py-8 sm:px-8 md:px-10">
              <p className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">
                {copy.nameLabel}
              </p>
              <div className="flex flex-1 items-center justify-center py-14 md:py-16">
                <div className="h-[72px] w-[128px] sm:h-[81px] sm:w-[143px]">
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
                      }
                    `}</style>
                    <path
                      className="wordmark-path"
                      d="M0 0.908003V48.498C0 49.0001 0.405462 49.406 0.906954 49.406H11.9931C12.4946 49.406 12.9001 49.0001 12.9001 48.498V35.1397C12.9001 34.6376 13.3055 34.2317 13.807 34.2317H26.0616C26.5631 34.2317 26.9685 33.8258 26.9685 33.3237V23.6615C26.9685 23.1594 26.5631 22.7535 26.0616 22.7535H13.807C13.3055 22.7535 12.9001 22.3476 12.9001 21.8455V12.3755C12.9001 11.8735 13.3055 11.4675 13.807 11.4675H27.4967C27.9982 11.4675 28.4037 11.0616 28.4037 10.5595V0.908003C28.4037 0.405931 27.9982 0 27.4967 0H0.906954C0.405462 0 0 0.405931 0 0.908003Z"
                    />
                    <path
                      className="wordmark-path"
                      d="M35.9047 15.0355C35.4032 15.0355 34.9978 15.4414 34.9978 15.9435V60.9377C34.9978 65.4136 31.5887 69.0883 27.23 69.505C26.7605 69.5477 26.403 69.9322 26.403 70.4023V80.0912C26.403 80.6146 26.8405 81.0206 27.3633 80.9992C37.996 80.4971 46.4627 71.7109 46.4627 60.9377V15.9435C46.4627 15.4414 46.0573 15.0355 45.5558 15.0355H35.9047Z"
                    />
                    <path
                      className="wordmark-path"
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M71.3559 13.2942C60.8993 13.2942 52.4273 21.7814 52.4273 32.2448C52.4273 42.7082 60.9046 51.1953 71.3559 51.1953C81.8073 51.1953 90.2846 42.7082 90.2846 32.2448C90.2846 21.7814 81.8073 13.2942 71.3559 13.2942ZM71.3559 24.7725C67.232 24.7725 63.8869 28.1214 63.8869 32.2501C63.8869 36.3789 67.232 39.7278 71.3559 39.7278C75.4799 39.7278 78.825 36.3789 78.825 32.2501C78.825 28.1214 75.4799 24.7725 71.3559 24.7725Z"
                    />
                    <path
                      className="wordmark-path"
                      d="M116.309 15.9435V22.7375C116.309 23.2395 115.903 23.6455 115.402 23.6455H108.509C108.066 23.6455 107.709 24.0033 107.709 24.4466V48.5568C107.709 49.0589 107.303 49.4648 106.802 49.4648H97.1508C96.6493 49.4648 96.2438 49.0589 96.2438 48.5568V15.9435C96.2438 15.4414 96.6493 15.0355 97.1508 15.0355H115.402C115.903 15.0355 116.309 15.4414 116.309 15.9435Z"
                    />
                    <path
                      className="wordmark-path"
                      d="M143 15.9435V22.7375C143 23.2395 142.595 23.6455 142.093 23.6455H135.2C134.757 23.6455 134.4 24.0033 134.4 24.4466V48.5568C134.4 49.0589 133.994 49.4648 133.493 49.4648H123.842C123.34 49.4648 122.935 49.0589 122.935 48.5568V15.9435C122.935 15.4414 123.34 15.0355 123.842 15.0355H142.093C142.595 15.0355 143 15.4414 143 15.9435Z"
                    />
                  </svg>
                </div>
              </div>
              <div className="mark-copy mark-copy-name mt-auto w-full max-w-[22rem] text-left font-sans">
                <p className="mb-1.5 text-[14px] font-bold leading-snug text-white sm:text-[15px]">
                  {copy.nameTitle}
                </p>
                <p className="text-[13px] font-medium leading-snug tracking-tight text-[#f5f5f7]/65 sm:text-[14px]">
                  {copy.nameBody}
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
