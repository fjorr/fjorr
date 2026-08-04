'use client';

import React from 'react';

/** Quiet field for The Manual — the mini-site card owns the chrome. */
export default function HelpShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-h-screen bg-page text-page flex flex-col">
      <main className="flex-1 min-h-0 w-full px-4 sm:px-6 py-10 sm:py-14 lg:py-16 flex items-center justify-center">
        {children}
      </main>
    </div>
  );
}
