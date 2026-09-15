import React from 'react';
import { Link } from '@/i18n/navigation';
import HouseScrollFooter from '@/components/HouseScrollFooter';
import type { ScoutProfile } from '@/lib/profile';

export type AccountHeaderLink = {
  href: string;
  label: string;
};

/** Own-account chrome — main pane on brand white (nav via Account poster). */
export default async function AccountShell({
  children,
  title,
  description,
  descriptionNote,
  headerLinks,
  wide = false,
  narrow = false,
  introNarrow = false,
  hideFooter = false,
  centered = false,
}: {
  children: React.ReactNode;
  /** Kept for call-site compatibility — identity lives in the Account poster. */
  profile: ScoutProfile;
  /** Omit to let the child own the page title (e.g. Voyages). */
  title?: string;
  description?: string;
  /** Quiet italic note under the description (e.g. Voyages etymology). */
  descriptionNote?: string;
  /** Quiet text links under the intro (e.g. Nominate · Bounties). */
  headerLinks?: AccountHeaderLink[];
  /** Stretch main pane content to full available width (e.g. Voyages table). */
  wide?: boolean;
  /** Form pages — ~560px reading/editing column. */
  narrow?: boolean;
  /** Tighter intro column — keeps short copy from widowing. */
  introNarrow?: boolean;
  /** Skip house footer — e.g. Voyages owns a bottom rail nav. */
  hideFooter?: boolean;
  /** Center title + content column on the page. */
  centered?: boolean;
}) {
  const paneWidth = wide ? '' : narrow ? 'max-w-[560px]' : 'max-w-5xl';
  const introWidth = introNarrow
    ? 'max-w-[22rem]'
    : wide
      ? 'max-w-[560px]'
      : '';

  return (
    <div
      className="flex min-h-[calc(100dvh-56px)] w-full flex-col bg-white text-[#0B0B0C]"
      style={
        {
          ['--page-bg' as string]: '#ffffff',
          ['--page-bg-color' as string]: '#ffffff',
          ['--page-fg' as string]: '#0B0B0C',
          ['--page-muted' as string]: 'rgba(11, 11, 12, 0.55)',
          ['--page-faint' as string]: 'rgba(11, 11, 12, 0.35)',
          ['--page-chip' as string]: 'rgba(0, 0, 0, 0.06)',
          ['--page-chip-hover' as string]: 'rgba(0, 0, 0, 0.1)',
        } as React.CSSProperties
      }
    >
      <main className="mx-auto w-full min-w-0 flex-1 px-5 py-8 sm:px-8 md:px-10 md:py-10">
        <div
          className={`flex w-full flex-col gap-8 ${paneWidth} ${
            paneWidth || centered ? 'mx-auto' : ''
          } ${centered ? 'items-center' : ''}`}
        >
          {title ? (
            <header
              className={`flex flex-col gap-2 ${introWidth} ${
                introWidth || centered ? 'mx-auto' : ''
              } ${centered ? 'items-center text-center' : 'text-left'}`}
            >
              <h1 className="select-none font-interTight text-3xl font-bold tracking-tight text-[#0B0B0C] sm:text-4xl">
                {title}
              </h1>
              {description ? (
                <p className="font-sans text-[16px] leading-relaxed text-black/55">
                  {description}
                </p>
              ) : null}
              {descriptionNote ? (
                <p className="font-sans text-[13px] italic leading-relaxed text-black/35">
                  {descriptionNote}
                </p>
              ) : null}
              {headerLinks && headerLinks.length > 0 ? (
                <div
                  className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-0.5 ${
                    centered ? 'justify-center' : ''
                  }`}
                >
                  {headerLinks.map((link) => (
                    <Link
                      key={`${link.href}-${link.label}`}
                      href={link.href}
                      className="font-sans text-[14px] font-semibold text-black/55 underline decoration-black/25 underline-offset-2 transition-colors hover:text-[#0B0B0C] hover:decoration-black/45"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </header>
          ) : null}
          <div className={centered ? 'w-full' : undefined}>{children}</div>
        </div>
      </main>
      {hideFooter ? null : <HouseScrollFooter />}
    </div>
  );
}
