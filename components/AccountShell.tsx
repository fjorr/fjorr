import React from 'react';
import AccountNav from '@/components/AccountNav';
import type { ScoutProfile } from '@/lib/profile';

/** Own-account chrome — Mercury-style sidebar + main pane, Fjorr dark quiet. */
export default async function AccountShell({
  children,
  profile,
  title,
  description,
  descriptionNote,
  wide = false,
  narrow = false,
}: {
  children: React.ReactNode;
  profile: ScoutProfile;
  title: string;
  description?: string;
  /** Quiet italic note under the description (e.g. Voyages etymology). */
  descriptionNote?: string;
  /** Stretch main pane content to full available width (e.g. Voyages table). */
  wide?: boolean;
  /** Form pages — ~560px reading/editing column. */
  narrow?: boolean;
}) {
  const name = profile.display_name?.trim() || null;
  const paneWidth = wide ? '' : narrow ? 'max-w-[560px]' : 'max-w-5xl';

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#1F1F1F] text-white flex flex-col md:flex-row">
      <AccountNav
        memberNumber={profile.member_number}
        displayName={name}
      />

      <main className="flex-1 min-w-0 px-5 sm:px-8 md:px-10 py-8 md:py-10">
        <div className={`w-full flex flex-col gap-8 ${paneWidth}`}>
          <header
            className={`flex flex-col gap-2 text-left ${
              wide ? 'max-w-[560px]' : ''
            }`}
          >
            <h1 className="font-sans text-[1.75rem] sm:text-3xl font-bold tracking-tight text-white">
              {title}
            </h1>
            {description ? (
              <p className="font-sans text-[15px] text-white/50 leading-relaxed">
                {description}
              </p>
            ) : null}
            {descriptionNote ? (
              <p className="font-sans text-[13px] italic text-white/35 leading-relaxed">
                {descriptionNote}
              </p>
            ) : null}
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}
