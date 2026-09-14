'use client';

import React, { useCallback, useEffect } from 'react';
import { Icon } from '@/components/ui/Icons';

export type ProcessImage = {
  id: string;
  url: string;
  thumbUrl: string | null;
  caption: string | null;
};

/**
 * Full-bleed white lightbox for Process images.
 * Escape closes; ← → navigate.
 */
export default function ProcessLightbox({
  images,
  index,
  onClose,
  onIndexChange,
}: {
  images: ProcessImage[];
  index: number;
  onClose: () => void;
  onIndexChange: (next: number) => void;
}) {
  const image = images[index];
  const count = images.length;

  const go = useCallback(
    (delta: number) => {
      if (count <= 1) return;
      onIndexChange((index + delta + count) % count);
    },
    [count, index, onIndexChange]
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        go(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        go(1);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [go, onClose]);

  if (!image) return null;

  const navBtn =
    'absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center border-0 bg-transparent p-0 transition-opacity hover:opacity-80';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={image.caption || 'Process image'}
      className="fixed inset-0 z-[60] flex flex-col bg-white text-[#0B0B0C]"
    >
      <div className="flex h-[52px] shrink-0 items-center justify-end px-5 md:px-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-10 w-10 items-center justify-center text-black/55 transition-colors hover:text-black"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M18 6 6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-12 pb-8 md:px-16">
        {count > 1 ? (
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous image"
            className={`${navBtn} left-3 md:left-6`}
          >
            <Icon name="circleNavBack" className="!h-9 !w-9" aria-hidden />
          </button>
        ) : null}

        <figure className="flex max-h-full max-w-full flex-col items-center">
          <img
            src={image.url}
            alt={image.caption || ''}
            className="max-h-[min(78vh,900px)] max-w-full object-contain"
          />
          {image.caption ? (
            <figcaption className="mt-4 max-w-xl text-center font-sans text-[13px] text-black/50">
              {image.caption}
            </figcaption>
          ) : null}
        </figure>

        {count > 1 ? (
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next image"
            className={`${navBtn} right-3 md:right-6`}
          >
            <Icon name="circleNavForward" className="!h-9 !w-9" aria-hidden />
          </button>
        ) : null}
      </div>

      {count > 1 ? (
        <p className="shrink-0 pb-5 text-center font-mono text-[11px] text-black/35">
          {index + 1} / {count}
        </p>
      ) : null}
    </div>
  );
}
