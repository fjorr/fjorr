/**
 * The Manual — numbered instrument.
 * Fixed entries. State-aware CTAs. One (or two) actions each.
 */

/** Bump when Manual copy or structure ships. Shown in footer. */
export const MANUAL_UPDATED = '3 Aug 2026';

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
   * Optional inline reference image under public/
   * e.g. `/manual/watch.jpg`. Omit for empty crosshatched frame.
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
    what: "The reason Fjorr exists. The algorithm doesn't care who you become. Fjorr does.",
    happens:
      'Short films, made on purpose, for people who still want to become something.',
    actions: both([{ href: '/about', label: 'Read the full story' }]),
  },
  {
    number: '01',
    slug: 'watch',
    title: 'Watch',
    what: "Short films of the world's greatest stories. Free. No expiry. Anyone can watch — membership isn't required.",
    happens: 'Open a film. Watch. A Voyage record is optional.',
    actions: both([{ href: '/', label: 'Watch a film' }]),
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
    what: "The Bureaux — annual membership. It funds the mission and it's how you take part.",
    happens:
      'Pay once. Get a permanent Bureaux number, full member tools, and a seat you can pass on later.',
    actions: {
      guest: [{ href: '/bureaux', label: 'Join the Bureaux' }],
      member: [{ href: '/bureaux', label: 'Your Bureaux' }],
    },
  },
  {
    number: '04',
    slug: 'nominate',
    title: 'Nominate',
    what: 'Send a story Fjorr should make, or open a bounty on one.',
    happens:
      "Write the brief. Fjorr reviews. Some become films, most don't. Selected ones earn credit, and a bounty if one's attached.",
    actions: {
      guest: [{ href: '/bureaux', label: 'Join the Bureaux' }],
      member: [{ href: '/nominate', label: 'Nominate a story' }],
    },
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
    what: 'Where members manage Voyages, nominations, and Bureaux.',
    happens:
      'Sign in by magic link or Google. Cancel membership from the Bureaux page. Privacy Notice covers the rest.',
    actions: {
      guest: [{ href: '/signin', label: 'Open account' }],
      member: [{ href: '/account/voyages', label: 'Open account' }],
    },
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
  },
  {
    number: '08',
    slug: 'voyages',
    title: 'Voyages',
    what: "Your Voyageur No. — where you land in a film's watch order, first through thousandth.",
    happens:
      "Watch at least half a film, get a number. It's permanent, and it traces your trail — who found it before you, who found it because of you.",
    actions: {
      guest: [{ href: '/signin?next=/account/voyages', label: 'Open Voyages' }],
      member: [{ href: '/account/voyages', label: 'Open Voyages' }],
    },
  },
  {
    number: '09',
    slug: 'bounties',
    title: 'Bounties',
    what: 'Open hunts for stories Fjorr wants made, with a reward attached.',
    happens:
      "Open a poster, read the brief, nominate. If yours is selected and the film gets made, the reward is paid and you're credited.",
    actions: both([{ href: '/bounties', label: 'Browse Bounties' }]),
  },
  {
    number: '10',
    slug: 'cancel',
    title: 'Cancel',
    what: 'What happens when you stop paying for the Bureaux.',
    happens:
      'Cancel anytime from the Bureaux page. Watching stays free either way — cancelling only removes member tools.',
    actions: {
      guest: [{ href: '/signin?next=/bureaux', label: 'Manage membership' }],
      member: [{ href: '/bureaux', label: 'Manage membership' }],
    },
  },
  {
    number: '11',
    slug: 'terms-privacy',
    title: 'Terms & privacy',
    what: 'The rules, and what happens to your data.',
    happens:
      'Terms Sheet covers the rules of using Fjorr. Privacy Notice covers what we collect and why.',
    actions: both([
      { href: '/terms', label: 'Read Terms Sheet' },
      { href: '/privacy', label: 'Read Privacy Notice' },
    ]),
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
