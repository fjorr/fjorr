import type { Metadata } from 'next';

const PREVIEW_ORIGIN = 'https://staging.fjorr.com';
const OG_IMAGE = '/preview/story-inc/hero-banner.jpg';

/** Share cards for the Story Inc client mock — not Fjorr chrome. */
export const metadata: Metadata = {
  metadataBase: new URL(PREVIEW_ORIGIN),
  title: {
    default: 'Angry Birds 3 | Story Inc',
    template: '%s | Story Inc',
  },
  description:
    'Follow Angry Birds 3 on Story Inc — rewards, markets, and the project page.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Angry Birds 3 | Story Inc',
    description:
      'Follow Angry Birds 3 on Story Inc — rewards, markets, and the project page.',
    url: `${PREVIEW_ORIGIN}/preview/story-inc/v1`,
    siteName: 'Story Inc',
    type: 'website',
    images: [
      {
        url: OG_IMAGE,
        width: 1600,
        height: 700,
        alt: 'Angry Birds 3 — Story Inc',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Angry Birds 3 | Story Inc',
    description:
      'Follow Angry Birds 3 on Story Inc — rewards, markets, and the project page.',
    images: [OG_IMAGE],
  },
};

export default function StoryIncPreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
