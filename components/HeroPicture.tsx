'use client';

import Image from 'next/image';
import React from 'react';

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

/**
 * Art-directed hero with next/image for priority/lazy semantics.
 * Media URLs pass through the custom loader (Cloudflare AVIF already).
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

  return (
    <picture className={className}>
      {wide ? <source media="(min-width: 1024px)" srcSet={wide} /> : null}
      {clsx || wide ? (
        <source media="(min-width: 768px)" srcSet={clsx || wide || undefined} />
      ) : null}
      <Image
        src={fallback}
        alt={alt}
        fill
        sizes="100vw"
        priority={priority}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        className={imgClassName}
        onError={onError}
      />
    </picture>
  );
}
