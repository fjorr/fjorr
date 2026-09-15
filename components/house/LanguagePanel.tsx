'use client';

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  localeLabels,
  locales,
  type AppLocale,
} from '@/i18n/config';
import { LANGUAGE_HELLO } from '@/lib/language-hello-dom';
import { Icon } from '@/components/ui/Icons';
import SheetEnter from '@/components/house/SheetEnter';

const CODE_MAX_PX = 140;
const CODE_MIN_PX = 48;

export { LANGUAGE_HELLO };

/** Intro card — code, language name, and Change in one black surface. */
function IntroCard({
  eyebrow,
  code,
  label,
  changeLabel,
  onChange,
}: {
  eyebrow: string;
  code: string;
  label: string;
  changeLabel: string;
  onChange: () => void;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  const fit = useCallback(() => {
    const el = ref.current;
    const measure = measureRef.current;
    if (!el || !measure) return;

    el.style.fontSize = `${CODE_MAX_PX}px`;
    let size = CODE_MAX_PX;
    while (size > CODE_MIN_PX && el.scrollWidth > measure.clientWidth - 64) {
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
  }, [code, fit]);

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
        {code}
      </span>
      <span className="font-sans text-[18px] font-semibold leading-tight tracking-tight text-white/70 md:text-[20px]">
        {label}
      </span>
      <button
        type="button"
        onClick={onChange}
        className="inline-flex h-10 items-center justify-center rounded-full bg-white px-5 font-sans text-[14px] font-semibold tracking-tight text-[#0B0B0C] transition-opacity hover:opacity-85"
      >
        {changeLabel}
      </button>
    </div>
  );
}

/** Huge locale code — one line, scales down only if needed. */
function SpecimenCode({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);

  const fit = useCallback(() => {
    const el = ref.current;
    const measure = measureRef.current;
    if (!el || !measure) return;

    el.style.fontSize = `${CODE_MAX_PX}px`;
    let size = CODE_MAX_PX;
    while (size > CODE_MIN_PX && el.scrollWidth > measure.clientWidth) {
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
      >
        {text}
      </span>
    </span>
  );
}

type IntroSlide = { kind: 'intro' };
type LocaleSlide = { kind: 'locale'; code: AppLocale };
type Slide = IntroSlide | LocaleSlide;

/**
 * Language sheet — intro = current (chip), then other locales only.
 * Selection hands off to the provider’s Hello beat + locale swap.
 */
export default function LanguagePanel({
  onConfirm,
}: {
  onConfirm: (code: AppLocale) => void;
}) {
  const t = useTranslations('Nav');
  const locale = useLocale() as AppLocale;

  const slides: Slide[] = useMemo(
    () => [
      { kind: 'intro' },
      ...locales
        .filter((code) => code !== locale)
        .map((code) => ({ kind: 'locale' as const, code })),
    ],
    [locale]
  );

  const [index, setIndex] = useState(0);
  const current = slides[Math.min(index, Math.max(slides.length - 1, 0))];

  useEffect(() => {
    setIndex(0);
  }, [locale]);

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
    if (current.kind === 'intro') {
      go(1);
      return;
    }
    onConfirm(current.code);
  }, [current, go, onConfirm]);

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
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, runCurrent]);

  if (!current) return null;

  return (
    <div
      role="dialog"
      aria-label={t('languages')}
      className="absolute inset-0 z-50 flex flex-col bg-white text-[#0B0B0C]"
    >
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-8 px-5 md:gap-10 md:px-10">
        <SheetEnter
          key={current.kind === 'intro' ? 'intro' : current.code}
          className="flex w-full flex-col items-center gap-8 md:gap-10"
        >
          {current.kind === 'intro' ? (
            <IntroCard
              eyebrow={t('language')}
              code={locale.toUpperCase()}
              label={localeLabels[locale]}
              changeLabel={t('languagesChange')}
              onChange={() => go(1)}
            />
          ) : (
            <button
              type="button"
              onClick={() => onConfirm(current.code)}
              className="flex w-full max-w-[min(92vw,720px)] flex-col items-center gap-3 border-0 bg-transparent p-0 text-center transition-opacity duration-200 hover:opacity-55 md:gap-4"
            >
              <SpecimenCode text={current.code.toUpperCase()} />
              <span className="font-sans text-[18px] font-semibold leading-tight tracking-tight text-[#0B0B0C] md:text-[20px]">
                {localeLabels[current.code]}
              </span>
            </button>
          )}
        </SheetEnter>

        {slides.length > 1 && current.kind !== 'intro' ? (
          <SheetEnter delay={90}>
            <div className="flex shrink-0 items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => go(-1)}
                disabled={!canPrev}
                aria-label={t('languagesPrevious')}
                className="flex h-9 w-9 items-center justify-center border-0 bg-transparent p-0 transition-opacity hover:enabled:opacity-80 disabled:cursor-default disabled:opacity-35"
              >
                <Icon name="circleNavBack" className="!h-9 !w-9" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                disabled={!canNext}
                aria-label={t('languagesNext')}
                className="flex h-9 w-9 items-center justify-center border-0 bg-transparent p-0 transition-opacity hover:enabled:opacity-80 disabled:cursor-default disabled:opacity-35"
              >
                <Icon
                  name="circleNavForward"
                  className="!h-9 !w-9"
                  aria-hidden
                />
              </button>
            </div>
          </SheetEnter>
        ) : null}
      </div>
    </div>
  );
}
