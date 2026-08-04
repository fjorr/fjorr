'use client';

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import FjorrMark from '@/components/help/FjorrMark';

const PRINCIPLES = [
  { title: 'p1Title', body: 'p1Body', numeral: 'I' },
  { title: 'p2Title', body: 'p2Body', numeral: 'II' },
  { title: 'p3Title', body: 'p3Body', numeral: 'III' },
  { title: 'p4Title', body: 'p4Body', numeral: 'IV' },
  { title: 'p5Title', body: 'p5Body', numeral: 'V' },
  { title: 'p6Title', body: 'p6Body', numeral: 'VI' },
] as const;

/** 0 = hero; 1…n = principles; last = nominate CTA */
const TOTAL_SLIDES = PRINCIPLES.length + 2;

/**
 * Principles of a Myth — click-through cards (Manual-like).
 * No site nav/footer. Hero → myths → Nominate.
 */
export default function PrinciplesClient() {
  const t = useTranslations('Principles');
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const [cardHeight, setCardHeight] = useState<number | null>(null);
  const [heightReady, setHeightReady] = useState(false);

  const isHero = index === 0;
  const isCta = index === TOTAL_SLIDES - 1;
  const principle =
    !isHero && !isCta ? PRINCIPLES[index - 1] : null;
  const canPrev = index > 0;
  const canNext = index < TOTAL_SLIDES - 1;

  const syncHeight = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    setCardHeight(el.scrollHeight);
  }, []);

  useLayoutEffect(() => {
    syncHeight();
    const id = requestAnimationFrame(() => setHeightReady(true));
    return () => cancelAnimationFrame(id);
  }, [index, syncHeight]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const ro = new ResizeObserver(syncHeight);
    ro.observe(el);
    window.addEventListener('resize', syncHeight);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', syncHeight);
    };
  }, [index, syncHeight]);

  const go = useCallback((next: number) => {
    setIndex(Math.max(0, Math.min(TOTAL_SLIDES - 1, next)));
  }, []);

  const goNext = useCallback(() => {
    if (canNext) go(index + 1);
  }, [canNext, go, index]);

  const goPrev = useCallback(() => {
    if (canPrev) go(index - 1);
  }, [canPrev, go, index]);

  const handleExit = useCallback(() => {
    try {
      const ref = document.referrer;
      if (ref && new URL(ref).origin === window.location.origin) {
        router.back();
        return;
      }
    } catch {
      // fall through to home
    }
    router.push('/');
  }, [router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleExit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, handleExit]);

  const arrowClass =
    'inline-flex items-center justify-center size-9 rounded-full bg-transparent border-0 p-0 text-page-faint hover:text-page transition-colors cursor-pointer disabled:opacity-25 disabled:pointer-events-none';

  return (
    <div className="relative w-full min-h-dvh bg-page text-page flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Principles | Fjorr',
            description: t('intro'),
            url: 'https://www.fjorr.com/principles',
          }),
        }}
      />

      <main className="flex-1 w-full px-4 sm:px-6 flex flex-col items-center justify-center">
        <div className="relative w-full max-w-[28rem] -translate-y-3 sm:-translate-y-5">
          {/* Subtle running title — only after the hero */}
          <p
            aria-hidden={isHero}
            className={`absolute left-0 right-0 bottom-full mb-4 sm:mb-5 m-0 text-center font-sans text-[13px] font-semibold tracking-tight text-page-faint transition-opacity duration-300 ${
              isHero ? 'opacity-0 pointer-events-none select-none' : 'opacity-100'
            }`}
          >
            {t('title').replace(/\n/g, ' ')}
          </p>

          <div
            role="region"
            aria-roledescription="carousel"
            aria-label={t('title').replace(/\n/g, ' ')}
            className={`relative w-full overflow-hidden rounded-[16px] bg-page text-page text-center ${
              heightReady ? 'principles-card-height' : ''
            }`}
            style={cardHeight != null ? { height: cardHeight } : undefined}
          >
            <div ref={contentRef} className="px-10 pt-8 sm:pt-9 pb-10">
              {isHero ? (
                <button
                  key="hero"
                  type="button"
                  onClick={goNext}
                  className="principles-hero-in w-full text-center bg-transparent border-0 p-0 cursor-pointer group"
                  aria-label={t('next')}
                >
                  <FjorrMark className="mx-auto mb-5 sm:mb-6 h-[22px] w-auto text-page" />
                  <h1 className="m-0 font-futura tracking-tighter text-page select-none text-[clamp(2.5rem,8vw,3.5rem)] !leading-[0.92] text-balance">
                    {t('title')
                      .split('\n')
                      .filter(Boolean)
                      .map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                  </h1>
                  <p className="mt-5 sm:mt-6 m-0 font-sans font-medium text-[15px] sm:text-[16px] leading-[1.55] text-page-muted">
                    {t('intro')
                      .split('\n')
                      .filter(Boolean)
                      .map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                  </p>
                  <span className="mt-8 inline-flex h-9 items-center justify-center px-5 rounded-full bg-[var(--page-fg)] text-[var(--page-bg)] font-sans text-[13px] font-semibold tracking-tight group-hover:opacity-90 transition-opacity">
                    {t('go')}
                  </span>
                </button>
              ) : principle ? (
                <button
                  key={principle.numeral}
                  type="button"
                  onClick={goNext}
                  className="principles-slide-in w-full text-center bg-transparent border-0 p-0 cursor-pointer"
                  aria-label={t('next')}
                >
                  <span
                    className="block font-futura select-none text-[clamp(3.5rem,12vw,4.75rem)] tracking-tighter !leading-[0.85] text-page"
                    aria-hidden
                  >
                    {principle.numeral}.
                  </span>
                  <h2 className="mt-3 sm:mt-4 m-0 font-interTight font-bold tracking-tight text-[clamp(1.5rem,4.5vw,1.85rem)] leading-[1.12] text-page text-balance">
                    {t(principle.title)}
                  </h2>
                  <p className="mt-3 sm:mt-3.5 m-0 font-sans font-medium text-[15px] sm:text-[16px] leading-[1.55] text-page-muted">
                    {t(principle.body)}
                  </p>
                </button>
              ) : isCta ? (
                <div
                  key="cta"
                  className="principles-slide-in flex flex-col items-center"
                >
                  <p className="m-0 font-interTight font-bold tracking-tight text-[clamp(1.5rem,4.5vw,1.85rem)] leading-[1.12] text-page text-balance">
                    {t('footerNote')}
                  </p>
                  <Link
                    href="/nominate"
                    className="mt-8 inline-flex h-9 items-center justify-center px-5 rounded-full bg-[var(--page-fg)] text-[var(--page-bg)] font-sans text-[13px] font-semibold tracking-tight hover:opacity-90 transition-opacity no-underline"
                  >
                    {t('nominateCta')}
                  </Link>
                </div>
              ) : null}
            </div>
          </div>

          {/* Deck nav — arrows + count + Exit */}
          <div className="mt-5 flex items-center justify-center gap-3">
            {!isHero ? (
              <>
                <button
                  type="button"
                  aria-label={t('prev')}
                  disabled={!canPrev}
                  onClick={goPrev}
                  className={arrowClass}
                >
                  <ArrowLeft size={18} strokeWidth={1.75} aria-hidden />
                </button>
                <span className="min-w-[3.5rem] text-center font-mono text-[11px] font-medium tabular-nums tracking-[0.08em] text-page-faint select-none">
                  {isCta ? '·' : `${index} / ${PRINCIPLES.length}`}
                </span>
                <button
                  type="button"
                  aria-label={t('next')}
                  disabled={!canNext}
                  onClick={goNext}
                  className={arrowClass}
                >
                  <ArrowRight size={18} strokeWidth={1.75} aria-hidden />
                </button>
                <span
                  aria-hidden
                  className="w-px h-3 bg-[color-mix(in_srgb,var(--page-fg)_18%,transparent)]"
                />
              </>
            ) : null}
            <button
              type="button"
              onClick={handleExit}
              aria-label={t('exitAria')}
              className="font-sans text-[12px] font-medium text-page-faint hover:text-page transition-colors bg-transparent border-0 p-0 cursor-pointer"
            >
              {t('exit')}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
