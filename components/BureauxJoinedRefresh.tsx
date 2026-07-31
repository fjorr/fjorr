'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';

/** After checkout, poll briefly until webhook marks membership active. */
export default function BureauxJoinedRefresh() {
  const router = useRouter();

  useEffect(() => {
    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      router.refresh();
      if (n >= 8) window.clearInterval(id);
    }, 1500);
    return () => window.clearInterval(id);
  }, [router]);

  return null;
}
