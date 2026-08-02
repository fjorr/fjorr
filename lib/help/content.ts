/**
 * The Manual — numbered instrument.
 * Fixed entries. State-aware CTAs. One (or two) actions each.
 */

/** Bump when Manual copy or structure ships. Shown in footer. */
export const MANUAL_UPDATED = '1 Aug 2026';

export type ManualAudience = 'guest' | 'member';

export type ManualAction = {
  href: string;
  label: string;
};

export type ManualEntry = {
  /** 01 … 11 */
  number: string;
  slug: string;
  title: string;
  what: string;
  who: Record<ManualAudience, string>;
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

function sameWho(text: string): Record<ManualAudience, string> {
  return { guest: text, member: text };
}

export const MANUAL_ENTRIES: ManualEntry[] = [
  {
    number: '01',
    slug: 'watch',
    title: 'Watch',
    what: 'Short films of the world’s greatest stories. Free. No expiry.',
    who: sameWho('Anyone. Membership is not required to watch.'),
    happens: 'Open a film. Watch. A Voyage record is optional.',
    actions: both([{ href: '/', label: 'Watch a film' }]),
  },
  {
    number: '02',
    slug: 'join',
    title: 'Join',
    what: 'The Bureaux — annual membership. It funds the work. It is how one takes part.',
    who: sameWho('Anyone who elects to join. One price. One year. No tiers.'),
    happens:
      'Pay once. Receive a permanent Bureaux number, the member tools, and a seat that may be passed on.',
    actions: {
      guest: [{ href: '/bureaux', label: 'Join the Bureaux' }],
      member: [{ href: '/bureaux', label: 'Your Bureaux' }],
    },
  },
  {
    number: '03',
    slug: 'nominate',
    title: 'Nominate',
    what: 'Propose a story Fjorr ought to make, or open a bounty upon one.',
    who: {
      guest: 'Members only. Quality over volume. Caps apply.',
      member: 'You. Quality over volume. Caps apply.',
    },
    happens:
      'Write the brief. Fjorr reviews. Most are declined. A few are made — with credit, and a bounty if one is attached.',
    actions: {
      guest: [{ href: '/bureaux', label: 'Join the Bureaux' }],
      member: [{ href: '/nominate', label: 'Nominate a story' }],
    },
  },
  {
    number: '04',
    slug: 'plus',
    title: 'Plus Machine',
    what: 'Mark a moment in a film. Send a craft note to Fjorr.',
    who: {
      guest: 'Members, while watching — from inside the film.',
      member: 'You, while watching — from inside the film.',
    },
    happens:
      'Notes reach Fjorr alone. Not a public thread. Films ship as v1, then sharpen.',
    actions: {
      guest: [{ href: '/bureaux', label: 'Join the Bureaux' }],
      member: [{ href: '/plus', label: 'Open Plus Machine' }],
    },
  },
  {
    number: '05',
    slug: 'account',
    title: 'Account',
    what: 'Where members manage Voyages, nominations, and privacy.',
    who: {
      guest: 'Signed-in members only.',
      member: 'You. Voyages, nominations, and privacy live here.',
    },
    happens:
      'Sign in by magic link or Google. Cancel from the Bureaux page. The Privacy Notice covers the rest.',
    actions: {
      guest: [{ href: '/signin', label: 'Open account' }],
      member: [{ href: '/account/voyages', label: 'Open account' }],
    },
  },
  {
    number: '06',
    slug: 'contact',
    title: 'Contact',
    what: 'Partnership, press, or a matter worth raising. Write in.',
    who: sameWho('Anyone with a clear ask. Members included.'),
    happens:
      'Mail reaches a person. For how stories earn a place, see the Principles of a Myth.',
    actions: both([{ href: 'mailto:control@fjorr.com', label: 'Write in' }]),
  },
  {
    number: '07',
    slug: 'voyages',
    title: 'Voyages',
    what: 'Your Voyageur No. — where you fall in a film’s watch order.',
    who: {
      guest: 'Anyone who watches. Member or guest; both count.',
      member: 'You, and every viewer. Your numbers accumulate here.',
    },
    happens:
      'Watch a film. Receive a number. It is permanent. It traces who came before you, and who came because of you.',
    actions: {
      guest: [{ href: '/signin?next=/account/voyages', label: 'Open Voyages' }],
      member: [{ href: '/account/voyages', label: 'Open Voyages' }],
    },
  },
  {
    number: '08',
    slug: 'bounties',
    title: 'Bounties',
    what: 'Open hunts for stories Fjorr wants made — reward attached.',
    who: sameWho(
      'Anyone with a fitting story. Nominate into an open bounty, or pitch generally.'
    ),
    happens:
      'Read the brief. Nominate. If selected and the film is made, the reward is paid and you are credited.',
    actions: both([{ href: '/bounties', label: 'Browse Bounties' }]),
  },
  {
    number: '09',
    slug: 'living-films',
    title: 'Living films',
    what: 'No film on Fjorr is final. Each may be sharpened. That is Plus Machine.',
    who: sameWho(
      'Members, by Plus note. Only the film’s maker decides what changes.'
    ),
    happens:
      'A film ships as v1. A note may yield a patch. v2 goes live; v1 remains archived.',
    actions: both([{ href: '/plus', label: 'Read Plus Machine' }]),
  },
  {
    number: '10',
    slug: 'cancel',
    title: 'Cancel',
    what: 'What follows when Bureaux payment stops.',
    who: {
      guest: 'Any paying member.',
      member: 'You, while the seat is yours.',
    },
    happens:
      'Cancel at any time from the Bureaux page. Your number is kept. Watching remains free. Member tools alone are removed.',
    actions: {
      guest: [{ href: '/signin?next=/bureaux', label: 'Manage membership' }],
      member: [{ href: '/bureaux', label: 'Manage membership' }],
    },
  },
  {
    number: '11',
    slug: 'terms-privacy',
    title: 'Terms & privacy',
    what: 'The rules. What becomes of your data.',
    who: sameWho('Everyone.'),
    happens:
      'Terms Sheet: the rules of use. Privacy Notice: what is collected, and why.',
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
