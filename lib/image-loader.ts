/**
 * Pass through media.fjorr.com URLs as-is.
 * Cloudflare already serves optimized AVIF; Vercel's image optimizer is blocked
 * by the CDN (OPTIMIZED_EXTERNAL_IMAGE_REQUEST_UNAUTHORIZED).
 *
 * Next requires custom loaders to use `width` (for srcset). Cloudflare ignores `w`.
 */
export default function mediaImageLoader({
  src,
  width,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  const separator = src.includes("?") ? "&" : "?";
  return `${src}${separator}w=${width}`;
}
