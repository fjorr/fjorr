import { buildRssFeed } from '@/lib/rss/build-feed';

export const revalidate = 3600;

/** Machine RSS — public URL is /feed.xml (rewritten here). */
export async function GET() {
  const { xml, cacheControl } = await buildRssFeed();
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': cacheControl,
    },
  });
}
