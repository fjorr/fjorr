import type { Metadata } from 'next';

const PREVIEW_ORIGIN = 'https://staging.fjorr.com';

/** Per-comp share card — image should be the trailer hero poster. */
export function projectPageMetadata({
  title,
  description,
  path,
  image,
}: {
  title: string;
  description: string;
  /** Absolute path, e.g. `/preview/story-inc/rolling-loud` */
  path: string;
  /** Absolute public path to the hero trailer image */
  image: string;
}): Metadata {
  const url = `${PREVIEW_ORIGIN}${path}`;
  return {
    title,
    description,
    openGraph: {
      title: `${title} | Story Inc`,
      description,
      url,
      siteName: 'Story Inc',
      type: 'website',
      images: [
        {
          url: image,
          alt: `${title} — Story Inc`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Story Inc`,
      description,
      images: [image],
    },
  };
}
