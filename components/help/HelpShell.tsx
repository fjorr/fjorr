import React from 'react';

/** Quiet field for The Manual — the mini-site card owns the chrome. */
export default function HelpShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-h-dvh bg-page text-page flex flex-col">
      {/*
        Mobile: stretch the card to the top with an even page-bg border.
        Desktop: keep the centered floating card.
      */}
      <main
        className="flex-1 min-h-0 w-full flex items-stretch sm:items-center justify-center
          pl-[max(0.75rem,env(safe-area-inset-left))]
          pr-[max(0.75rem,env(safe-area-inset-right))]
          pt-[max(0.75rem,env(safe-area-inset-top))]
          pb-[max(0.75rem,env(safe-area-inset-bottom))]
          sm:px-6 sm:py-14 lg:py-16"
      >
        {children}
      </main>
    </div>
  );
}
