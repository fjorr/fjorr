'use client';

import Image from 'next/image';
import React from 'react';
import mediaImageLoader from '@/lib/image-loader';

type HeroPictureProps = {
  wide?: string | null;
  clsx?: string | null;
  tall?: string | null;
  alt: string;
  /** LCP hero — sets priority + high fetchPriority */
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  onError?: React.ReactEventHandler<HTMLImageElement>;
};

const WIDE_WIDTHS = [1280, 1600, 1920, 2560];
const CLSX_WIDTHS = [768, 1024, 1280, 1600];

function buildSrcSet(src: string, widths: number[]) {
  return widths
    .map((width) => `${mediaImageLoader({ src, width })} ${width}w`)
    .join(', ');
}

/**
 * Art-directed hero with next/image for priority/lazy semantics.
 * `<source>` srcSets go through the same Cloudflare-aware loader as Image.
 */
export default function HeroPicture({
  wide,
  clsx,
  tall,
  alt,
  priority = false,
  className = '',
  imgClassName = 'object-cover object-center',
  onError,
}: HeroPictureProps) {
  const fallback = tall || clsx || wide;
  if (!fallback) return null;

  const wideSrcSet = wide ? buildSrcSet(wide, WIDE_WIDTHS) : null;
  const midSrc = clsx || wide;
  const clsxSrcSet = midSrc ? buildSrcSet(midSrc, CLSX_WIDTHS) : null;

  return (
    <picture className={className}>
      {wideSrcSet ? (
        <source media="(min-width: 1024px)" srcSet={wideSrcSet} sizes="100vw" />
      ) : null}
      {clsxSrcSet ? (
        <source media="(min-width: 768px)" srcSet={clsxSrcSet} sizes="100vw" />
      ) : null}
      <Image
        src={fallback}
        alt={alt}
        fill
        sizes="100vw"
        priority={priority}
        fetchPriority={priority ? 'high' : 'auto'}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={imgClassName}
        onError={onError}
      />
    </picture>
  );
}
