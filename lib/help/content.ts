/**
 * The Manual — numbered instrument.
 * Fixed entries. State-aware CTAs. One (or two) actions each.
 */

/** Bump when Manual copy or structure ships. Shown in footer. */
export const MANUAL_UPDATED = '4 Aug 2026';

export type ManualAudience = 'guest' | 'member';

export type ManualAction = {
  href: string;
  label: string;
};

export type ManualEntry = {
  /** 00 … 11 */
  number: string;
  slug: string;
  title: string;
  what: string;
  happens: string;
  /** CTAs — usually one; Terms uses two */
  actions: Record<ManualAudience, ManualAction[]>;
  /**
   * Optional reference image under public/ — opens full-bleed in the card.
   * e.g. `/manual/watch.svg`
   */
  plate?: string;
};

function both(actions: ManualAction[]): Record<ManualAudience, ManualAction[]> {
  return { guest: actions, member: actions };
}

export const MANUAL_ENTRIES: ManualEntry[] = [
  {
    number: '00',
    slug: 'why',
    title: 'Why',
    what: "The algorithm doesn't care who you become. Fjorr does — short films made on purpose, not for the feed.",
    happens:
      "Fjorr is a home for the world's greatest stories, told as short films people can actually finish. The Bureaux funds the work so watching stays free and clean. Membership is how you take part — nominate, mark craft, leave a trail — not a paywall on the films.",
    actions: both([{ href: '/about', label: 'Read the full story' }]),
  },
  {
    number: '01',
    slug: 'watch',
    title: 'Watch',
    what: "Short films of the world's greatest stories. Free. No expiry. Anyone can watch — membership isn't required.",
    happens:
      'Open a film and press play. Nothing to subscribe to, nothing locked behind a trial. Sign in if you want a Voyageur number; skip it if you just came to watch.',
    actions: both([{ href: '/', label: 'Watch a film' }]),
    plate: '/manual/watch.svg',
  },
  {
    number: '02',
    slug: 'ad-free',
    title: 'Ad-free',
    what: 'There are no ads on Fjorr. Not before a film. Not after. Not in the middle.',
    happens:
      'No pre-rolls, no banners, no mid-rolls, no sponsored interruptions. Watching stays clean — the Bureaux funds the work, not advertisers.',
    actions: both([{ href: '/', label: 'Watch a film' }]),
    plate: '/manual/ad-free.svg',
  },
  {
    number: '03',
    slug: 'join',
    title: 'Join',
    what: 'The Bureaux — annual membership. It funds the mission and unlocks the tools that make Fjorr a practice, not just a playlist.',
    happens:
      'Pay once for the year. You get a permanent Bureaux number, Voyages, Nominate, Plus Machine, and a seat you can pass on later. Watching stays free for everyone either way — joining is how you help make the next film possible.',
    actions: {
      guest: [{ href: '/bureaux', label: 'Join the Bureaux' }],
      member: [{ href: '/bureaux', label: 'Your Bureaux' }],
    },
    plate: '/manual/join.svg',
  },
  {
    number: '04',
    slug: 'nominate',
    title: 'Nominate',
    what: 'Members send stories Fjorr should make — or answer an open bounty with a brief and a stake.',
    happens:
      "Write what the story is, why it matters, and why now. Fjorr reviews every brief. Most don't become films; the ones that do credit the nominator, and pay the bounty if one was attached. Guests can browse — nominating is for the Bureaux.",
    actions: {
      guest: [{ href: '/bureaux', label: 'Join the Bureaux' }],
      member: [{ href: '/nominate', label: 'Nominate a story' }],
    },
    plate: '/manual/nominate.svg',
  },
  {
    number: '05',
    slug: 'plus',
    title: 'Plus Machine',
    what: 'Mark a moment in a film. Send a craft note to Fjorr — for members, while watching, from inside the film. No film is version final.',
    happens:
      'Notes reach Fjorr alone, not a public thread. Films ship as v1. If a note lands, the maker can patch it — v2 goes live, v1 stays archived.',
    actions: {
      guest: [{ href: '/bureaux', label: 'Join the Bureaux' }],
      member: [{ href: '/plus', label: 'Read Plus Machine' }],
    },
    plate: '/manual/plus.svg',
  },
  {
    number: '06',
    slug: 'account',
    title: 'Account',
    what: 'Your desk on Fjorr — Voyages, nominations, profile, and Bureaux, in one place.',
    happens:
      "Sign in with a magic link or Google. From account you can review films you've logged, manage nominations, edit your profile, and open Bureaux to handle membership. Guests can still create an account; member tools unlock with the Bureaux.",
    actions: {
      guest: [{ href: '/signin', label: 'Open account' }],
      member: [{ href: '/account/voyages', label: 'Open account' }],
    },
    plate: '/manual/account.svg',
  },
  {
    number: '07',
    slug: 'contact',
    title: 'Contact',
    what: 'Partnership, press, or something worth making.',
    happens:
      'Email reaches a real person. For how stories earn a place on Fjorr, read the Principles of a Myth.',
    actions: both([
      { href: 'clipboard:control@fjorr.com', label: 'Write in' },
    ]),
    plate: '/manual/contact.svg',
  },
  {
    number: '08',
    slug: 'voyages',
    title: 'Voyages',
    what: "Your Voyageur No. — where you land in a film's watch order, first through thousandth.",
    happens:
      "Watch at least half a film while signed in and a number lands — permanent for that film. Your account keeps the trail: what you've watched, in what order, and the chain of who found it before you.",
    actions: {
      guest: [{ href: '/signin?next=/account/voyages', label: 'Open Voyages' }],
      member: [{ href: '/account/voyages', label: 'Open Voyages' }],
    },
    plate: '/manual/voyages.svg',
  },
  {
    number: '09',
    slug: 'bounties',
    title: 'Bounties',
    what: 'Open hunts for stories Fjorr wants made — with a brief, a deadline spirit, and a reward attached.',
    happens:
      "Browse posters on the Bounties wall. Read the brief, then nominate your take. If yours is selected and the film gets made, the reward is paid and you're credited. Anyone can look; answering a bounty is a member move.",
    actions: both([{ href: '/bounties', label: 'Browse Bounties' }]),
    plate: '/manual/bounties.svg',
  },
  {
    number: '10',
    slug: 'cancel',
    title: 'Cancel',
    what: 'Leave the Bureaux without losing the films — membership ends; watching does not.',
    happens:
      "Cancel anytime from the Bureaux page. Access runs through the period you've paid for, then member tools (Nominate, Plus, and the rest) stop. Your Bureaux number and past Voyages stay on record. The library stays free either way.",
    actions: {
      guest: [{ href: '/signin?next=/bureaux', label: 'Manage membership' }],
      member: [{ href: '/bureaux', label: 'Manage membership' }],
    },
    plate: '/manual/cancel.svg',
  },
  {
    number: '11',
    slug: 'terms-privacy',
    title: 'Terms & privacy',
    what: 'The rules, and what happens to your data.',
    happens:
      'Terms Sheet covers the rules of using Fjorr. Privacy Notice covers what we collect and why. Both are short on purpose — read them when you join or when something feels unclear.',
    actions: both([
      { href: '/terms', label: 'Read Terms Sheet' },
      { href: '/privacy', label: 'Read Privacy Notice' },
    ]),
    plate: '/manual/terms-privacy.svg',
  },
];

/** Old category/article slugs → new Manual entry. */
export const MANUAL_LEGACY_REDIRECTS: Record<string, string> = {
  'what-is-fjorr': 'watch',
  'watching-films': 'watch',
  'getting-started': 'join',
  'what-is-the-bureaux': 'join',
  'joining-and-billing': 'join',
  'member-perks': 'join',
  'nominating-stories': 'nominate',
  'plus-machine': 'plus',
  'living-films': 'plus',
  'the-cabinet': 'contact',
  desk: 'contact',
  'sign-in': 'account',
  'voyages-and-profile': 'voyages',
  'privacy-and-data': 'terms-privacy',
  principles: 'contact',
  privacy: 'terms-privacy',
  terms: 'terms-privacy',
};

export function listManualEntries(): ManualEntry[] {
  return MANUAL_ENTRIES;
}

export function getManualEntry(slug: string): ManualEntry | null {
  return MANUAL_ENTRIES.find((e) => e.slug === slug) || null;
}

export function manualEntryHref(slug: string) {
  return `/manual/${slug}` as const;
}

export function getManualEntryNeighbors(slug: string): {
  index: number;
  total: number;
  prev: ManualEntry | null;
  next: ManualEntry | null;
} {
  const total = MANUAL_ENTRIES.length;
  const index = MANUAL_ENTRIES.findIndex((e) => e.slug === slug);
  if (index < 0) {
    return { index: -1, total, prev: null, next: null };
  }
  return {
    index,
    total,
    prev: index > 0 ? MANUAL_ENTRIES[index - 1] : null,
    next: index < total - 1 ? MANUAL_ENTRIES[index + 1] : null,
  };
}
