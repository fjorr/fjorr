'use client';

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { Icon } from '@/components/ui/Icons';
import HouseScrollFooter from '@/components/HouseScrollFooter';

const PRINCIPLES = [
  { title: 'p1Title', body: 'p1Body', numeral: 'I' },
  { title: 'p2Title', body: 'p2Body', numeral: 'II' },
  { title: 'p3Title', body: 'p3Body', numeral: 'III' },
  { title: 'p4Title', body: 'p4Body', numeral: 'IV' },
  { title: 'p5Title', body: 'p5Body', numeral: 'V' },
  { title: 'p6Title', body: 'p6Body', numeral: 'VI' },
] as const;

const SPECIMEN_MAX_PX = 140;
const SPECIMEN_MIN_PX = 48;

type IntroSlide = { kind: 'intro' };
type PrincipleSlide = {
  kind: 'principle';
  title: (typeof PRINCIPLES)[number]['title'];
  body: (typeof PRINCIPLES)[number]['body'];
  numeral: string;
};
type CtaSlide = { kind: 'cta' };
type Slide = IntroSlide | PrincipleSlide | CtaSlide;

/** Intro — black chip, same family as language sheet. */
function IntroCard({
  eyebrow,
  specimen,
  label,
  actionLabel,
  onAction,
}: {
  eyebrow: string;
  specimen: string;
  label: string;
  actionLabel: string;
  onAction: () => void;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  const fit = useCallback(() => {
    const el = ref.current;
    const measure = measureRef.current;
    if (!el || !measure) return;
    el.style.fontSize = `${SPECIMEN_MAX_PX}px`;
    let size = SPECIMEN_MAX_PX;
    while (size > SPECIMEN_MIN_PX && el.scrollWidth > measure.clientWidth - 64) {
      size -= 2;
      el.style.fontSize = `${size}px`;
    }
  }, []);

  useLayoutEffect(() => {
    fit();
    const measure = measureRef.current;
    const ro =
      typeof ResizeObserver !== 'undefined' && measure
        ? new ResizeObserver(() => fit())
        : null;
    if (measure) ro?.observe(measure);
    window.addEventListener('resize', fit);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, [specimen, fit]);

  return (
    <div
      ref={measureRef}
      className="flex w-[min(72vw,16.5rem)] flex-col items-center gap-5 rounded-[22px] bg-[#0B0B0C] px-8 py-8 text-white md:w-[18rem] md:gap-6 md:rounded-[28px] md:px-10 md:py-10"
    >
      <span className="font-sans text-[15px] font-semibold tracking-normal text-white/55 sm:text-[16px]">
        {eyebrow}
      </span>
      <span
        ref={ref}
        className="inline-block max-w-full whitespace-nowrap font-futura leading-none tracking-tighter text-white"
      >
        {specimen}
      </span>
      <span className="text-center font-sans text-[16px] font-semibold leading-snug tracking-tight text-white/70 md:text-[18px]">
        {label}
      </span>
      <button
        type="button"
        onClick={onAction}
        className="inline-flex h-10 items-center justify-center rounded-full bg-white px-5 font-sans text-[14px] font-semibold tracking-tight text-[#0B0B0C] transition-opacity hover:opacity-85"
      >
        {actionLabel}
      </button>
    </div>
  );
}

/** Huge numeral — one line, scales down only if needed. */
function SpecimenNumeral({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);

  const fit = useCallback(() => {
    const el = ref.current;
    const measure = measureRef.current;
    if (!el || !measure) return;
    el.style.fontSize = `${SPECIMEN_MAX_PX}px`;
    let size = SPECIMEN_MAX_PX;
    while (size > SPECIMEN_MIN_PX && el.scrollWidth > measure.clientWidth) {
      size -= 2;
      el.style.fontSize = `${size}px`;
    }
  }, []);

  useLayoutEffect(() => {
    fit();
    const measure = measureRef.current;
    const ro =
      typeof ResizeObserver !== 'undefined' && measure
        ? new ResizeObserver(() => fit())
        : null;
    if (measure) ro?.observe(measure);
    window.addEventListener('resize', fit);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, [text, fit]);

  return (
    <span
      ref={measureRef}
      className="flex w-full max-w-[min(92vw,720px)] items-center justify-center px-4 text-center"
    >
      <span
        ref={ref}
        className="inline-block max-w-full whitespace-nowrap font-futura leading-none tracking-tighter text-[#0B0B0C]"
        aria-hidden
      >
        {text}
      </span>
    </span>
  );
}

/**
 * Principles of a Myth — language-sheet grammar:
 * intro chip, then one principle at a time, circle arrows.
 */
export default function PrinciplesClient() {
  const t = useTranslations('Principles');
  const router = useRouter();

  const slides: Slide[] = useMemo(
    () => [
      { kind: 'intro' },
      ...PRINCIPLES.map((p) => ({
        kind: 'principle' as const,
        title: p.title,
        body: p.body,
        numeral: p.numeral,
      })),
      { kind: 'cta' },
    ],
    []
  );

  const [index, setIndex] = useState(0);
  const current = slides[Math.min(index, Math.max(slides.length - 1, 0))];

  const canPrev = index > 0;
  const canNext = index < slides.length - 1;

  const go = useCallback(
    (direction: -1 | 1) => {
      setIndex((i) => {
        const next = i + direction;
        if (next < 0 || next >= slides.length) return i;
        return next;
      });
    },
    [slides.length]
  );

  const runCurrent = useCallback(() => {
    if (!current) return;
    if (current.kind === 'intro' || current.kind === 'principle') {
      if (canNext) go(1);
    }
  }, [canNext, current, go]);

  const handleExit = useCallback(() => {
    try {
      const ref = document.referrer;
      if (ref && new URL(ref).origin === window.location.origin) {
        router.back();
        return;
      }
    } catch {
      /* home */
    }
    router.push('/about');
  }, [router]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        go(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        go(1);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        runCurrent();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        handleExit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, handleExit, runCurrent]);

  if (!current) return null;

  const introLabel = t('intro')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)[0];

  return (
    <div className="flex min-h-screen w-full flex-col bg-white text-[#0B0B0C]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Principles | Fjorr',
            description: t('intro').replace(/\n/g, ' '),
            url: 'https://www.fjorr.com/principles',
          }),
        }}
      />

      <div
        role="region"
        aria-roledescription="carousel"
        aria-label={t('title').replace(/\n/g, ' ')}
        className="flex min-h-0 flex-1 flex-col items-center justify-center gap-8 px-5 md:gap-10 md:px-10"
      >
        {current.kind === 'intro' ? (
          <IntroCard
            eyebrow={t('eyebrow')}
            specimen="Myth"
            label={introLabel}
            actionLabel={t('go')}
            onAction={() => go(1)}
          />
        ) : current.kind === 'principle' ? (
          <button
            type="button"
            onClick={() => go(1)}
            className="flex w-full max-w-[min(92vw,720px)] flex-col items-center gap-3 border-0 bg-transparent p-0 text-center transition-opacity duration-200 hover:opacity-55 md:gap-4"
          >
            <SpecimenNumeral text={current.numeral} />
            <span className="max-w-md font-interTight text-[22px] font-bold leading-tight tracking-tight text-[#0B0B0C] md:text-[26px]">
              {t(current.title)}
            </span>
            <span className="max-w-sm font-sans text-[16px] font-medium leading-snug tracking-tight text-black/55 md:text-[17px]">
              {t(current.body)}
            </span>
          </button>
        ) : (
          <div className="flex w-full max-w-[min(92vw,28rem)] flex-col items-center gap-6 text-center">
            <p className="m-0 font-interTight text-[24px] font-bold leading-tight tracking-tight text-[#0B0B0C] md:text-[28px]">
              {t('footerNote')}
            </p>
            <Link
              href="/about"
              className="inline-flex h-10 items-center justify-center rounded-full bg-[#0B0B0C] px-5 font-sans text-[14px] font-semibold tracking-tight text-white transition-opacity hover:opacity-85"
            >
              {t('aboutLink')}
            </Link>
          </div>
        )}

        {slides.length > 1 && current.kind !== 'intro' ? (
          <div className="flex shrink-0 items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={!canPrev}
              aria-label={t('prev')}
              className="flex h-9 w-9 items-center justify-center border-0 bg-transparent p-0 transition-opacity hover:enabled:opacity-80 disabled:cursor-default disabled:opacity-35"
            >
              <Icon name="circleNavBack" className="!h-9 !w-9" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              disabled={!canNext}
              aria-label={t('next')}
              className="flex h-9 w-9 items-center justify-center border-0 bg-transparent p-0 transition-opacity hover:enabled:opacity-80 disabled:cursor-default disabled:opacity-35"
            >
              <Icon
                name="circleNavForward"
                className="!h-9 !w-9"
                aria-hidden
              />
            </button>
          </div>
        ) : null}
      </div>

      <HouseScrollFooter />
    </div>
  );
}
