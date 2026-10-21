'use client';

import React from 'react';
import HouseScrollFooter from '@/components/HouseScrollFooter';
import SignInForm from '@/components/SignInForm';

/** Standalone sign-in — form centered, house footer at the bottom. */
export default function SignInPageClient({ nextPath }: { nextPath: string }) {
  return (
    <div className="flex min-h-[calc(100dvh-56px)] w-full flex-col bg-white text-[#0B0B0C]">
      <div className="flex w-full flex-1 items-center justify-center px-6 py-16">
        <SignInForm nextPath={nextPath} layout="page" />
      </div>
      <HouseScrollFooter />
    </div>
  );
}
