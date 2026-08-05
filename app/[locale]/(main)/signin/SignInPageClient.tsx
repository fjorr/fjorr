'use client';

import React from 'react';
import SignInForm from '@/components/SignInForm';

/** Standalone sign-in — form centered in the viewport. */
export default function SignInPageClient({ nextPath }: { nextPath: string }) {
  return (
    <div className="w-full min-h-[calc(100dvh-4.5rem)] bg-[var(--page-bg)] text-page flex items-center justify-center px-[10%] py-16 sm:py-20">
      <SignInForm nextPath={nextPath} layout="page" />
    </div>
  );
}
