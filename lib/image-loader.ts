/**
 * Pass through media.fjorr.com URLs as-is.
 * Cloudflare already serves optimized AVIF; Vercel's image optimizer is blocked
 * by the CDN (OPTIMIZED_EXTERNAL_IMAGE_REQUEST_UNAUTHORIZED).
 */
export default function mediaImageLoader({
  src,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  return src;
}
