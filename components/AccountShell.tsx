import React from 'react';
import { Link } from '@/i18n/navigation';
import AccountNav from '@/components/AccountNav';
import type { ScoutProfile } from '@/lib/profile';
import {
  ensureBureauxNumber,
  getOwnBureauxLineage,
  getOwnBureauxMembership,
  isBureauxMembershipActive,
} from '@/lib/bureaux';

export type AccountHeaderLink = {
  href: string;
  label: string;
};

/** Own-account chrome — Mercury-style sidebar + main pane (theme-aware). */
export default async function AccountShell({
  children,
  profile,
  title,
  description,
  descriptionNote,
  headerLinks,
  wide = false,
  narrow = false,
}: {
  children: React.ReactNode;
  profile: ScoutProfile;
  title: string;
  description?: string;
  /** Quiet italic note under the description (e.g. Voyages etymology). */
  descriptionNote?: string;
  /** Quiet text links under the intro (e.g. Nominate · Bounties). */
  headerLinks?: AccountHeaderLink[];
  /** Stretch main pane content to full available width (e.g. Voyages table). */
  wide?: boolean;
  /** Form pages — ~560px reading/editing column. */
  narrow?: boolean;
}) {
  const name = profile.display_name?.trim() || null;
  const paneWidth = wide ? '' : narrow ? 'max-w-[560px]' : 'max-w-5xl';
  let membership = await getOwnBureauxMembership(profile.id);
  const bureauxActive = isBureauxMembershipActive(membership);
  // Lazy-assign for members activated before bureaux_number existed.
  if (bureauxActive && membership && !membership.bureaux_number) {
    const n = await ensureBureauxNumber(profile.id);
    if (n) membership = { ...membership, bureaux_number: n };
  }

  const lineage = bureauxActive
    ? await getOwnBureauxLineage(profile.id)
    : null;

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-page text-page flex flex-col md:flex-row">
      <AccountNav
        displayName={name}
        bureauxNumber={bureauxActive ? membership?.bureaux_number ?? null : null}
        broughtByNumber={lineage?.sponsoredByNumber ?? null}
        broughtInCount={lineage?.broughtInCount ?? 0}
      />

      <main className="flex-1 min-w-0 px-5 sm:px-8 md:px-10 py-8 md:py-10">
        <div className={`w-full flex flex-col gap-8 ${paneWidth}`}>
          <header
            className={`flex flex-col gap-2 text-left ${
              wide ? 'max-w-[560px]' : ''
            }`}
          >
            <h1 className="font-interTight font-bold text-3xl sm:text-4xl tracking-tight text-page select-none">
              {title}
            </h1>
            {description ? (
              <p className="font-sans text-[15px] text-page-muted leading-relaxed">
                {description}
              </p>
            ) : null}
            {descriptionNote ? (
              <p className="font-sans text-[13px] italic text-page-faint leading-relaxed">
                {descriptionNote}
              </p>
            ) : null}
            {headerLinks && headerLinks.length > 0 ? (
              <p className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5">
                {headerLinks.map((link) => (
                  <Link
                    key={`${link.href}-${link.label}`}
                    href={link.href}
                    className="font-sans text-[14px] font-semibold text-page-muted underline underline-offset-2 decoration-[color-mix(in_srgb,var(--page-fg)_25%,transparent)] hover:text-page hover:decoration-[color-mix(in_srgb,var(--page-fg)_45%,transparent)] transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </p>
            ) : null}
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}
