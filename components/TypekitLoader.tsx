'use client';

import { useEffect } from 'react';

const TYPEKIT_HREF = 'https://use.typekit.net/xyf8acw.css';

/** Apply Adobe Fonts after first paint so the stylesheet does not block rendering. */
export default function TypekitLoader() {
  useEffect(() => {
    if (document.querySelector(`link[data-fjorr-typekit="1"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = TYPEKIT_HREF;
    link.dataset.fjorrTypekit = '1';
    document.head.appendChild(link);
  }, []);

  return null;
}
