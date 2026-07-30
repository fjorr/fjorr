'use client';

import { useEffect } from 'react';
import { TYPEKIT_HREF } from '@/lib/typekit';

/** Ensure Adobe Fonts stylesheet is present (backup if layout <link> missed). */
export default function TypekitLoader() {
  useEffect(() => {
    const existing = document.querySelector(
      `link[href="${TYPEKIT_HREF}"], link[data-fjorr-typekit="1"]`
    );
    if (existing) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = TYPEKIT_HREF;
    link.dataset.fjorrTypekit = '1';
    document.head.appendChild(link);
  }, []);

  return null;
}
