'use client';

import React, { useCallback, type ComponentProps } from 'react';
import { Link, useRouter } from '@/i18n/navigation';

type LinkProps = ComponentProps<typeof Link>;

/**
 * Link that prefetches on hover/focus for snappier film/artifact navigation.
 * (Viewport prefetch still applies; this warms routes before they scroll into view.)
 */
export default function PrefetchLink({
  href,
  onMouseEnter,
  onFocus,
  ...rest
}: LinkProps) {
  const router = useRouter();

  const prefetch = useCallback(() => {
    const path = typeof href === 'string' ? href : href.pathname;
    if (!path) return;
    if (path.startsWith('/film/') || path.startsWith('/artifact/')) {
      router.prefetch(path);
    }
  }, [href, router]);

  return (
    <Link
      href={href}
      onMouseEnter={(event) => {
        prefetch();
        onMouseEnter?.(event);
      }}
      onFocus={(event) => {
        prefetch();
        onFocus?.(event);
      }}
      {...rest}
    />
  );
}
