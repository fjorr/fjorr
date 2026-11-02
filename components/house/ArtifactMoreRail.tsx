'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Icon } from '@/components/ui/Icons';
import type { MoreArtifact } from '@/lib/content/artifact';

export default function ArtifactMoreRail({
  artifacts,
  isDarkBg,
}: {
  artifacts: MoreArtifact[];
  isDarkBg: boolean;
}) {
  const t = useTranslations('Artifact');
  const tFilm = useTranslations('Film');
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  const ink = isDarkBg ? 'text-white' : 'text-[#0B0B0C]';
  const inkSoft = isDarkBg ? 'text-white/55' : 'text-black/45';
  const well = isDarkBg ? 'bg-white/[0.06]' : 'bg-black/[0.06]';

  const sync = () => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const start = scroller.scrollLeft <= 2;
    const end =
      scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 2;
    setEdges((prev) =>
      prev.start === start && prev.end === end ? prev : { start, end }
    );
  };

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    // Open on the middle of the row so posters bleed off both edges, like More films.
    if (scroller) {
      scroller.scrollLeft = Math.max(0, (scroller.scrollWidth - scroller.clientWidth) / 2);
    }
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artifacts]);

  if (!artifacts.length) return null;

  const slideBy = (dir: -1 | 1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const card = scroller.querySelector('a');
    const step = card
      ? card.getBoundingClientRect().width + 12
      : Math.round(scroller.clientWidth * 0.7);
    scroller.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  return (
    <section className={`w-full pb-16 md:pb-20 ${ink}`} aria-label={t('moreArtifacts')}>
      <h2 className="mb-4 px-6 text-center font-[family-name:var(--font-circular-black)] text-[1.25rem] font-[900] leading-normal tracking-[-0.03em]">
        {t('moreArtifacts')}
      </h2>
      <div className="relative">
        <div
          ref={scrollerRef}
          onScroll={sync}
          className="overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="mx-auto flex w-max gap-3 px-6 pb-1 md:px-12">
            {artifacts.map((artifact) => (
              <Link
                key={artifact.slug}
                href={`/artifact/${artifact.slug}`}
                aria-label={artifact.meta ? `${artifact.name}, ${artifact.meta}` : artifact.name}
                className="group w-[clamp(160px,17vw,220px)] shrink-0 text-left"
              >
                <span className={`block aspect-[2/3] w-full overflow-hidden rounded-[8px] ${well}`}>
                  {artifact.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={artifact.image}
                      alt=""
                      className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-90"
                      draggable={false}
                    />
                  ) : null}
                </span>
                {artifact.meta ? (
                  <span className={`mt-2 block truncate font-sans text-[12px] font-medium leading-snug tracking-tight ${inkSoft}`}>
                    {artifact.meta}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
        <button
          type="button"
          aria-label={tFilm('previousFilm')}
          disabled={edges.start}
          onClick={() => slideBy(-1)}
          className="absolute left-3 top-[calc(clamp(160px,17vw,220px)*0.75)] z-10 hidden -translate-y-1/2 md:block disabled:pointer-events-none disabled:opacity-0"
        >
          <Icon
            name={isDarkBg ? 'circleNavBackDark' : 'circleNavBack'}
            className="!h-9 !w-9"
            aria-hidden
          />
        </button>
        <button
          type="button"
          aria-label={tFilm('nextFilm')}
          disabled={edges.end}
          onClick={() => slideBy(1)}
          className="absolute right-3 top-[calc(clamp(160px,17vw,220px)*0.75)] z-10 hidden -translate-y-1/2 md:block disabled:pointer-events-none disabled:opacity-0"
        >
          <Icon
            name={isDarkBg ? 'circleNavForwardDark' : 'circleNavForward'}
            className="!h-9 !w-9"
            aria-hidden
          />
        </button>
      </div>
    </section>
  );
}
