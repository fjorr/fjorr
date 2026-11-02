'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import RuntimeTag from '@/components/house/RuntimeTag';

export type CatalogPosterItem = {
  id: string;
  slug: string;
  name: string;
  thumb: string | null;
  /** Artifact exhibit ground when no poster crop. */
  pageBg?: string | null;
  /** Caption year, e.g. "1972" or "1600 BC". */
  captionYear?: string | null;
  /** Rest of the caption, e.g. "3m", "Coming Soon", or "Book". */
  captionDetail?: string | null;
  /** Films read "1972 · 3m"; artifacts read "Book · 2016". */
  yearFirst?: boolean;
  /** Shows captionDetail as a small outlined chip. */
  comingSoon?: boolean;
  /** Released film: captionDetail is a runtime shown with a play mark. */
  playable?: boolean;
};

/**
 * Poster-only catalog / search grid — tap plays / opens.
 */
export default function CatalogPosterGrid({
  items,
  onPlay,
  onScrollOffset,
  scrollable = true,
  highlightYear = false,
}: {
  items: CatalogPosterItem[];
  /** Sorted by year: lead every caption with a dark, semibold year. */
  highlightYear?: boolean;
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
        className="m-0 grid list-none grid-cols-2 gap-x-3 gap-y-5 p-0 sm:grid-cols-3 sm:gap-x-3.5 md:grid-cols-4 md:gap-x-4 md:gap-y-6 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7"
        aria-label={t('browseHeadline')}
      >
        {items.map((item) => {
          const year = item.captionYear || null;
          const detail = item.captionDetail || null;
          const yearLeads = highlightYear || item.yearFirst !== false;
          const parts = (yearLeads ? [year, detail] : [detail, year]).filter(Boolean);
          const caption = parts.join(' · ');
          return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onPlay(item.slug)}
              aria-label={caption ? `${item.name}, ${caption}` : item.name}
              className="group block w-full border-0 bg-transparent p-0 text-left"
            >
              <span
                className="relative block aspect-[2/3] w-full overflow-hidden rounded-[8px] bg-black/[0.06]"
                style={item.pageBg ? { backgroundColor: item.pageBg } : undefined}
              >
                {item.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.thumb}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                    draggable={false}
                  />
                ) : (
                  <span className="flex h-full items-center justify-center px-3 text-center font-sans text-[12px] font-semibold text-black/30">
                    {item.name}
                  </span>
                )}
              </span>
              {caption ? (
                <span className="mt-2 flex min-w-0 items-center gap-1 font-sans text-[12px] font-medium leading-snug tracking-tight text-black/45">
                  {(yearLeads ? ['year', 'detail'] : ['detail', 'year']).map((part, i, order) => {
                    const node =
                      part === 'year' ? (
                        year ? (
                          <span
                            className={`truncate ${highlightYear ? 'font-semibold text-[#0B0B0C]' : ''}`}
                          >
                            {year}
                          </span>
                        ) : null
                      ) : !detail ? null : item.comingSoon ? (
                        <span className="ml-0.5 shrink-0 rounded-full border border-black/15 px-1.5 py-[3px] text-[10px] font-semibold leading-none text-black/60">
                          {detail}
                        </span>
                      ) : item.playable ? (
                        <RuntimeTag runtime={detail} />
                      ) : (
                        <span className="truncate">{detail}</span>
                      );
                    if (!node) return null;
                    const prev = order[i - 1];
                    const prevShown = prev === 'year' ? Boolean(year) : prev === 'detail' ? Boolean(detail) : false;
                    const dot = i > 0 && prevShown && !(part === 'detail' && item.comingSoon);
                    return (
                      <React.Fragment key={part}>
                        {dot ? <span aria-hidden>·</span> : null}
                        {node}
                      </React.Fragment>
                    );
                  })}
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
