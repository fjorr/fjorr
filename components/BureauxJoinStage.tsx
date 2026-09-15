'use client';

import React, { useCallback, useEffect, useState, type ReactNode } from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Navbar from '@/components/Navbar';
import BureauxIncludedList from '@/components/BureauxIncludedList';
import SheetEnter from '@/components/house/SheetEnter';
import { LIGHT_PAGE_BG } from '@/lib/color-scheme';
import { useSwipeNav } from '@/lib/use-swipe-nav';

const BUREAUX_IMAGE =
  'https://media.fjorr.com/app-assets/fjorr-home-bureaux-breakdancing.avif';

const SITE_BG = LIGHT_PAGE_BG;

/** Poster → pitch (with price) → checkout. */
const PHASES = ['poster', 'pitch', 'email'] as const;
type Phase = (typeof PHASES)[number];

type Props = {
  price: string;
  checkout: ReactNode;
  startInCheckout?: boolean;
  /** Post-pay confirmation — full black stage. */
  claimMode?: boolean;
};

/**
 * Join deck — three full-bleed slides.
 * 1) Poster  2) Pitch + price  3) Checkout form
 */
export default function BureauxJoinStage({
  price,
  checkout,
  startInCheckout = false,
  claimMode = false,
}: Props) {
  const t = useTranslations('Bureaux');
  const [reduced, setReduced] = useState(false);
  const [phase, setPhase] = useState<Phase>(
    startInCheckout ? 'email' : 'poster'
  );
  const [pitchKey, setPitchKey] = useState(0);
  const [emailKey, setEmailKey] = useState(0);

  useEffect(() => {
    setReduced(
      typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }, []);

  const goTo = useCallback((next: Phase) => {
    setPhase((current) => {
      if (current === next) return current;
      if (next === 'pitch') setPitchKey((k) => k + 1);
      if (next === 'email') setEmailKey((k) => k + 1);
      return next;
    });
  }, []);

  const phaseIndex = PHASES.indexOf(phase);
  const canPrev = phaseIndex > 0;
  const canNext = phaseIndex < PHASES.length - 1;

  const goPrev = useCallback(() => {
    if (!canPrev) return;
    goTo(PHASES[phaseIndex - 1]);
  }, [canPrev, goTo, phaseIndex]);

  const goNext = useCallback(() => {
    if (!canNext) return;
    goTo(PHASES[phaseIndex + 1]);
  }, [canNext, goTo, phaseIndex]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrev();
        return;
      }
      if (
        event.key === 'ArrowRight' ||
        (phase === 'poster' &&
          (event.key === 'ArrowDown' ||
            event.key === 'PageDown' ||
            event.key === ' ' ||
            event.key === 'Enter'))
      ) {
        event.preventDefault();
        goNext();
      }
    };
    const onWheel = (event: WheelEvent) => {
      if (phase !== 'poster' || event.deltaY <= 0) return;
      goNext();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', onWheel);
    };
  }, [phase, goPrev, goNext]);

  const swipe = useSwipeNav({
    onPrev: goPrev,
    onNext: goNext,
    enabled: canPrev || canNext,
  });

  const stageVars = {
    ['--page-bg' as string]: SITE_BG,
    ['--page-bg-color' as string]: SITE_BG,
    ['--page-fg' as string]: '#0B0B0C',
    ['--page-muted' as string]: 'rgba(11, 11, 12, 0.55)',
    ['--page-faint' as string]: 'rgba(11, 11, 12, 0.35)',
  } as React.CSSProperties;

  const onPoster = phase === 'poster';
  const chromeVariant = claimMode || onPoster ? 'light' : 'dark';

  const slideLayer = (id: Phase) =>
    `absolute inset-0 overflow-y-auto overscroll-contain transition-opacity duration-[900ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
      phase === id ? 'opacity-100' : 'pointer-events-none opacity-0'
    }`;

  const centeredPad =
    'flex min-h-full w-full flex-col items-center justify-center px-6 py-28 text-center sm:px-10 md:px-14 lg:px-16';

  if (claimMode) {
    return (
      <section
        className="relative flex h-dvh w-full flex-col overflow-hidden bg-[#0B0B0C] text-white"
        aria-label={t('joinPaidRegistry')}
      >
        <div className="pointer-events-none fixed inset-x-0 top-0 z-50">
          <div className="pointer-events-auto">
            <Navbar variant="light" />
          </div>
        </div>
        <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-y-auto overscroll-contain px-6 py-28 sm:px-10">
          <SheetEnter className="flex w-full max-w-md flex-col items-center text-center md:max-w-lg">
            {checkout}
          </SheetEnter>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative flex h-dvh w-full touch-pan-y flex-col overflow-hidden"
      style={{ backgroundColor: SITE_BG }}
      aria-label={t('joinHeadline')}
      {...swipe}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes fjorr-bureaux-title {
              from {
                opacity: 0;
                transform: translate3d(0, 0.35em, 0);
              }
              to {
                opacity: 1;
                transform: translate3d(0, 0, 0);
              }
            }
          `,
        }}
      />

      <div className="pointer-events-none fixed inset-x-0 top-0 z-50">
        <div className="pointer-events-auto">
          <Navbar variant={chromeVariant} />
        </div>
        <div className="pointer-events-auto flex justify-center pt-0.5">
          <div
            className="flex items-center gap-1"
            role="tablist"
            aria-label={t('joinHeadline')}
          >
            {PHASES.map((id, i) => {
              const active = i === phaseIndex;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={`${i + 1} of ${PHASES.length}`}
                  onClick={() => goTo(id)}
                  className="-mx-0.5 flex h-6 w-4 items-center justify-center"
                >
                  <span
                    className={`block h-1.5 w-1.5 rounded-full transition-opacity duration-300 ${
                      active ? 'opacity-100' : 'opacity-30 hover:opacity-60'
                    } ${onPoster ? 'bg-white' : 'bg-[#0B0B0C]'}`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="relative min-h-0 w-full flex-1">
        {/* 1 — Poster */}
        <div
          className={slideLayer('poster')}
          aria-hidden={phase !== 'poster'}
        >
          <Image
            src={BUREAUX_IMAGE}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[28%_72%] sm:object-[38%_58%] md:object-[48%_48%] lg:object-[52%_center]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/45 via-black/15 to-transparent"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center sm:px-10">
            <h1
              className="m-0 flex flex-col items-center gap-0.5 text-white select-none will-change-[transform,opacity]"
              style={
                reduced
                  ? undefined
                  : {
                      opacity: 0,
                      animation:
                        'fjorr-bureaux-title 0.9s cubic-bezier(0.25, 0.1, 0.25, 1) 0.35s both',
                    }
              }
            >
              <span className="font-futura text-[clamp(1.75rem,4.5vw,2.75rem)] leading-none tracking-tight">
                {t('eyebrow')}
              </span>
              <span className="font-futura text-[clamp(3.25rem,12vw,7.5rem)] leading-[0.86] tracking-tighter uppercase">
                {t('joinMark')}
              </span>
            </h1>
            <button
              type="button"
              onClick={goNext}
              aria-label={t('joinContinueCue')}
              className="mt-8 inline-flex size-11 items-center justify-center rounded-full bg-white text-[#0B0B0C] transition-transform hover:scale-[1.04] active:scale-[0.97] sm:size-12"
              style={
                reduced
                  ? undefined
                  : {
                      opacity: 0,
                      animation:
                        'fjorr-bureaux-title 0.7s cubic-bezier(0.25, 0.1, 0.25, 1) 0.85s both',
                    }
              }
            >
              <ArrowRight className="size-5" strokeWidth={2.25} aria-hidden />
            </button>
          </div>
        </div>

        {/* 2 — Pitch + price */}
        <div
          className={slideLayer('pitch')}
          style={stageVars}
          aria-hidden={phase !== 'pitch'}
        >
          {phase === 'pitch' ? (
            <div key={pitchKey} className={centeredPad}>
              <SheetEnter className="flex w-full max-w-[52ch] flex-col items-center text-center md:max-w-[58ch]">
                <h2 className="m-0 font-interTight text-[clamp(1.65rem,2.8vw,1.75rem)] font-extrabold leading-[1.12] tracking-tight text-[#0B0B0C] md:text-[28px]">
                  {t('subhead')}
                </h2>
                <div className="mt-7 flex w-full flex-col gap-5 font-interTight text-[17px] font-medium leading-[1.45] tracking-tight text-black/50 md:mt-8 md:text-[18px]">
                  {t('aboutBody')
                    .split(/\n\s*\n/)
                    .map((paragraph) => paragraph.trim())
                    .filter(Boolean)
                    .map((paragraph) => (
                      <p key={paragraph.slice(0, 48)} className="m-0">
                        {paragraph}
                      </p>
                    ))}
                </div>
                <div className="mt-10 flex w-full justify-center md:mt-12">
                  <BureauxIncludedList align="center" quiet />
                </div>
                <button
                  type="button"
                  onClick={() => goTo('email')}
                  className="mt-10 inline-flex h-11 items-center justify-center rounded-full bg-[#0B0B0C] px-7 font-interTight text-[15px] font-semibold leading-none tracking-tight text-white transition-opacity hover:opacity-85 active:scale-[0.98] md:mt-12 md:h-12 md:px-8 md:text-[16px]"
                >
                  {t('ctaJoinPrice', { price })}
                </button>
                <div className="mt-4 flex flex-col items-center gap-0 font-interTight text-[13px] font-medium leading-[1.35] tracking-tight text-black/40">
                  <p className="m-0">{t('billedAnnually')}</p>
                  <p className="m-0">{t('cancelAnytime')}</p>
                </div>
              </SheetEnter>
            </div>
          ) : null}
        </div>

        {/* 3 — Form */}
        <div
          className={slideLayer('email')}
          style={stageVars}
          aria-hidden={phase !== 'email'}
        >
          {phase === 'email' ? (
            <div key={emailKey} className={centeredPad}>
              <SheetEnter className="mx-auto flex w-full max-w-md flex-col items-center justify-center text-center md:max-w-lg">
                <div className="flex w-full justify-center">{checkout}</div>
              </SheetEnter>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
