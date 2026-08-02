import type { Metadata } from 'next';

const PREVIEW_ORIGIN = 'https://staging.fjorr.com';

/**
 * Shared Story Inc mock shell. Per-comp Open Graph images are set on each
 * project page from that project's trailer hero.
 */
export const metadata: Metadata = {
  metadataBase: new URL(PREVIEW_ORIGIN),
  title: {
    default: 'Story Inc',
    template: '%s | Story Inc',
  },
  description: 'Story Inc project comps.',
  robots: { index: false, follow: false },
  openGraph: {
    siteName: 'Story Inc',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function StoryIncPreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
