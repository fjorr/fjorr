import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/site';

const DEFAULT_OG = {
  url: absoluteUrl('/opengraph-image.png'),
  width: 1200,
  height: 630,
  alt: 'Fjorr — short films of the world’s greatest stories',
} as const;

/** Explicit OG/Twitter images for marketing routes (avoid generic fallback). */
export function marketingShareImages(alt?: string): {
  openGraphImages: NonNullable<NonNullable<Metadata['openGraph']>['images']>;
  twitterImages: string[];
} {
  const image = alt ? { ...DEFAULT_OG, alt } : { ...DEFAULT_OG };
  return {
    openGraphImages: [image],
    twitterImages: [image.url],
  };
}
