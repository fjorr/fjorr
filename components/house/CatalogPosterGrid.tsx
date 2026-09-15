'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

export type CatalogPosterItem = {
  id: string;
  slug: string;
  name: string;
  thumb: string | null;
  comingSoon: boolean;
  kind?: 'film' | 'artifact';
  /** Artifact exhibit ground when no poster crop. */
  pageBg?: string | null;
};

/**
 * Poster-only catalog / search grid — tap plays / opens.
 */
export default function CatalogPosterGrid({
  items,
  onPlay,
  onScrollOffset,
  scrollable = true,
}: {
  items: CatalogPosterItem[];
  onPlay: (slug: string) => void;
  /** Fires with scrollTop as the results list moves (mobile search compact). */
  onScrollOffset?: (scrollTop: number) => void;
  /** When false, grow with content and let a parent scroller own overflow. */
  scrollable?: boolean;
}) {
  const t = useTranslations('Film');

  if (items.length === 0) {
    return (
      <p className="py-1.5 font-sans text-[13px] text-black/40">—</p>
    );
  }

  return (
    <div
      className={
        scrollable ? 'min-h-0 flex-1 overflow-y-auto' : 'w-full'
      }
      onScroll={
        scrollable && onScrollOffset
          ? (event) => onScrollOffset(event.currentTarget.scrollTop)
          : undefined
      }
    >
      <ul
        className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 sm:gap-3.5 md:grid-cols-4 md:gap-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7"
        aria-label={t('browseHeadline')}
      >
        {items.map((item) => {
          const isArtifact = item.kind === 'artifact';
          return (
            <li key={`${item.kind || 'film'}:${item.id}`}>
              <button
                type="button"
                onClick={() => onPlay(item.slug)}
                aria-label={item.name}
                className="group relative block aspect-[2/3] w-full overflow-hidden rounded-[8px] border-0 bg-black/[0.06] p-0 text-left"
                style={
                  isArtifact && item.pageBg
                    ? { backgroundColor: item.pageBg }
                    : undefined
                }
              >
                {item.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.thumb}
                    alt=""
                    className="h-full w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                    draggable={false}
                  />
                ) : (
                  <span className="flex h-full items-center justify-center px-3 text-center font-sans text-[12px] font-semibold text-black/30">
                    {item.name}
                  </span>
                )}
                {item.comingSoon ? (
                  <span className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate rounded-[6px] bg-black/55 px-2 py-1 font-sans text-[10px] font-semibold tracking-tight text-white/90 backdrop-blur-md">
                    {t('comingSoon')}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
