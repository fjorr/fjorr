import { absoluteUrl } from '@/lib/site';

const SAFE_OG_EXT = /\.(jpe?g|png|webp)(\?|$)/i;
const AVIF_EXT = /\.avif(\?|$)/i;

/**
 * Open Graph / Twitter share images.
 * iMessage and most social crawlers do not render AVIF — prefer JPG/PNG/WebP,
 * then a JPG sibling of an AVIF asset, then the site PNG fallback.
 */
export function socialOgImageUrl(source?: string | null): string {
  const fallback = absoluteUrl('/opengraph-image.png');
  if (!source) return fallback;
  if (SAFE_OG_EXT.test(source)) return source;
  if (AVIF_EXT.test(source)) {
    // Convention: upload fjorr-*-blok-ogrf.jpg next to the .avif
    return source.replace(AVIF_EXT, '.jpg$1');
  }
  return source;
}

/**
 * Like socialOgImageUrl, but if the JPG sibling is missing, use the PNG fallback
 * so share previews never point at an unsupported AVIF or a 404.
 */
export async function resolveSocialOgImage(source?: string | null): Promise<string> {
  const fallback = absoluteUrl('/opengraph-image.png');
  if (!source) return fallback;

  if (SAFE_OG_EXT.test(source)) return source;

  if (AVIF_EXT.test(source)) {
    const jpgUrl = source.replace(AVIF_EXT, '.jpg$1');
    try {
      const res = await fetch(jpgUrl, {
        method: 'HEAD',
        next: { revalidate: 3600 },
      });
      if (res.ok) return jpgUrl;
    } catch {
      // fall through to site PNG
    }
    return fallback;
  }

  return source;
}
