'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Deep-link entry: land on home and open sign-in inside the nav glass. */
export default function SignInPageClient({ nextPath }: { nextPath: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
    const timer = window.setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('fjorr_open_signin', { detail: { nextPath } }),
      );
    }, 50);
    return () => window.clearTimeout(timer);
  }, [nextPath, router]);

  return (
    <div className="w-full min-h-[50vh] bg-[#1F1F1F]" aria-busy="true" />
  );
}
