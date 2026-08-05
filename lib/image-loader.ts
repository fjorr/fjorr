/**
 * media.fjorr.com via Cloudflare.
 * Vercel’s optimizer is blocked by the CDN, so we use a custom loader.
 *
 * Set NEXT_PUBLIC_CF_IMAGE_RESIZE=true once Cloudflare Image Resizing is
 * enabled on media.fjorr.com — then `/cdn-cgi/image/...` width variants apply.
 * Otherwise pass through (Cloudflare already serves AVIF).
 */

function cloudflareImageUrl(src: string, width: number, quality?: number) {
  if (process.env.NEXT_PUBLIC_CF_IMAGE_RESIZE !== 'true') return null;
  try {
    const url = new URL(src);
    if (url.hostname !== 'media.fjorr.com') return null;
    if (url.pathname.startsWith('/cdn-cgi/image/')) return src;

    const q = quality ?? 75;
    const params = `width=${width},quality=${q},format=auto,fit=cover`;
    return `${url.origin}/cdn-cgi/image/${params}${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

export default function mediaImageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  const transformed = cloudflareImageUrl(src, width, quality);
  if (transformed) return transformed;

  const separator = src.includes('?') ? '&' : '?';
  return `${src}${separator}w=${width}`;
}
