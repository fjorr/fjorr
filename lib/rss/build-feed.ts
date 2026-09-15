import { createPublicClient } from '@/lib/supabase/public';
import { absoluteUrl, SITE_ORIGIN } from '@/lib/site';
import { socialOgImageUrl } from '@/lib/og';

/** Canonical machine URL for readers (rewritten to /api/feed). */
export const RSS_FEED_PATH = '/feed.xml';

type FilmRow = {
  slug: string;
  name: string | null;
  teaser: string | null;
  release_date: string | null;
  updated_at: string | null;
  blok_ogrf: string | null;
};

type ArtifactRow = {
  slug: string;
  name: string | null;
  teaser: string | null;
  updated_at: string | null;
  blok_ogrf: string | null;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cdata(value: string): string {
  return `<![CDATA[${value.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

function rfc822(date: Date): string {
  return date.toUTCString();
}

export async function buildRssFeed(): Promise<{
  xml: string;
  cacheControl: string;
  itemCount: number;
}> {
  const nowIso = new Date().toISOString();
  let films: FilmRow[] = [];
  let artifacts: ArtifactRow[] = [];
  let loadFailed = false;

  try {
    const supabase = createPublicClient();
    const [filmsResponse, artifactsResponse] = await Promise.all([
      supabase
        .from('film')
        .select('slug, name, teaser, release_date, updated_at, blok_ogrf')
        .not('slug', 'is', null)
        .not('name', 'is', null)
        .lte('release_date', nowIso)
        .order('release_date', { ascending: false })
        .limit(50),
      supabase
        .from('artifact')
        .select('slug, name, teaser, updated_at, blok_ogrf')
        .not('slug', 'is', null)
        .not('name', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(30),
    ]);

    if (filmsResponse.error) {
      loadFailed = true;
      console.error('feed: film query failed', filmsResponse.error.message);
    } else {
      films = (filmsResponse.data || []) as FilmRow[];
    }
    if (artifactsResponse.error) {
      loadFailed = true;
      console.error('feed: artifact query failed', artifactsResponse.error.message);
    } else {
      artifacts = (artifactsResponse.data || []) as ArtifactRow[];
    }
  } catch (err) {
    loadFailed = true;
    console.error('feed: supabase unreachable', err);
  }

  type Item = {
    title: string;
    link: string;
    guid: string;
    description: string;
    pubDate: Date;
    category: string;
    enclosure?: string;
  };

  const items: Item[] = [];

  for (const film of films) {
    const pub = film.release_date
      ? new Date(film.release_date)
      : film.updated_at
        ? new Date(film.updated_at)
        : new Date();
    items.push({
      title: film.name || 'Untitled film',
      link: absoluteUrl(`/film/${film.slug}`),
      guid: absoluteUrl(`/film/${film.slug}`),
      description: film.teaser?.trim() || `Watch ${film.name} on Fjorr.`,
      pubDate: Number.isNaN(pub.getTime()) ? new Date() : pub,
      category: 'Film',
      enclosure: socialOgImageUrl(film.blok_ogrf),
    });
  }

  for (const art of artifacts) {
    const pub = art.updated_at ? new Date(art.updated_at) : new Date();
    items.push({
      title: art.name || 'Untitled artifact',
      link: absoluteUrl(`/artifact/${art.slug}`),
      guid: absoluteUrl(`/artifact/${art.slug}`),
      description: art.teaser?.trim() || `Archive entry: ${art.name}.`,
      pubDate: Number.isNaN(pub.getTime()) ? new Date() : pub,
      category: 'Archive',
      enclosure: socialOgImageUrl(art.blok_ogrf),
    });
  }

  items.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
  const latest = items[0]?.pubDate || new Date();
  const selfUrl = absoluteUrl(RSS_FEED_PATH);

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '<channel>',
    `  <title>${escapeXml('Fjorr')}</title>`,
    `  <link>${escapeXml(SITE_ORIGIN)}</link>`,
    `  <description>${escapeXml(
      "Short films of the world's greatest stories — film drops and archive updates."
    )}</description>`,
    `  <language>en</language>`,
    `  <lastBuildDate>${rfc822(latest)}</lastBuildDate>`,
    `  <atom:link href="${escapeXml(selfUrl)}" rel="self" type="application/rss+xml"/>`,
    ...items.slice(0, 60).flatMap((item) => {
      const lines = [
        '  <item>',
        `    <title>${escapeXml(item.title)}</title>`,
        `    <link>${escapeXml(item.link)}</link>`,
        `    <guid isPermaLink="true">${escapeXml(item.guid)}</guid>`,
        `    <pubDate>${rfc822(item.pubDate)}</pubDate>`,
        `    <category>${escapeXml(item.category)}</category>`,
        `    <description>${cdata(item.description)}</description>`,
      ];
      if (item.enclosure) {
        lines.push(
          `    <enclosure url="${escapeXml(item.enclosure)}" type="image/jpeg" length="0"/>`
        );
      }
      lines.push('  </item>');
      return lines;
    }),
    '</channel>',
    '</rss>',
    '',
  ].join('\n');

  const cacheControl =
    loadFailed || items.length === 0
      ? 'no-store'
      : 'public, s-maxage=3600, stale-while-revalidate=86400';

  return { xml, cacheControl, itemCount: items.length };
}
