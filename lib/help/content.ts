/**
 * The Manual — numbered entries.
 * Fixed list. State-aware CTAs. One (or two) actions each.
 * Article chassis: eyebrow + headline + body (+ optional plates).
 */

/** Bump when Manual copy or structure ships. Shown in menu colophon. */
export const MANUAL_VERSION = 'V1';
export const MANUAL_UPDATED = '5 Aug 2026';

export type ManualAudience = 'guest' | 'member';

export type ManualAction = {
  href: string;
  label: string;
};

export type ManualSection = {
  title: string;
  paragraphs?: string[];
  /** Optional bullet list (e.g. Privacy “What we do not do”). */
  bullets?: string[];
};

export type ManualPlate = {
  /** Path under public/, e.g. `/manual/watch.svg` */
  src: string;
  /** Optional label for a11y / overlay. */
  label?: string;
};

/** Doctrine / tool card. */
export type ManualEntry = {
  kind: 'article';
  /** 00 … n */
  number: string;
  slug: string;
  /** Index / menu label; article eyebrow. */
  title: string;
  headline: string;
  actions: Record<ManualAudience, ManualAction[]>;
  /** e.g. legal “Last updated · 1 Aug 2026” */
  updated?: string;
  lead?: string[];
  sections?: ManualSection[];
  steps?: { title: string; items: string[] };
  closing?: string;
  /** Optional plates after the lead. Tap opens full-bleed. */
  plates?: ManualPlate[];
};

export function getManualPlates(entry: ManualEntry): ManualPlate[] {
  return entry.plates ?? [];
}

function both(actions: ManualAction[]): Record<ManualAudience, ManualAction[]> {
  return { guest: actions, member: actions };
}

function article(entry: Omit<ManualEntry, 'kind'>): ManualEntry {
  return { kind: 'article', ...entry };
}

/** Strip `[label](href)` markers for plain-text descriptions. */
export function stripManualInline(text: string): string {
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}

export function manualEntryDescription(entry: ManualEntry): string {
  const raw = entry.lead?.[0] || entry.headline;
  return stripManualInline(raw);
}

/** `/manual/:slug` → slug, or null if not an in-Manual path. */
export function parseManualEntryHref(href: string): string | null {
  const path = href.split('?')[0]?.split('#')[0] || '';
  const match = path.match(/^\/manual\/([a-z0-9-]+)\/?$/i);
  return match?.[1] ?? null;
}

export const MANUAL_ENTRIES: ManualEntry[] = [
article({
    number: '00',
    slug: 'why',
    title: 'Why',
    headline: "Matter fades. Myth doesn't.",
    lead: [
      "So we're chronicling the human story, one myth at a time. Not designed to hijack attention. No ads, no algorithm, no noise. We believe the Internet can be so much better.",
      "Just short, cinematic films of the world's greatest stories, made to raise people with wonder and hope — free, forever, for anyone in the world. A few minutes. Done right. Not to keep you glued to glass. To send you back into the world with something to carry.",
    ],
    closing: 'Fjorr. The myth engine.',
    actions: both([
      { href: '/manual/join', label: 'Join the Bureaux' },
    ]),
  }),
article({
    number: '01',
    slug: 'watch',
    title: 'Watch',
    headline: 'Anyone can watch, anywhere in the world.',
    lead: [
      'Free. No expiry. Open a film and press play.',
      'Membership unlocks Voyageur numbers, nominating, and Plus — start with [the Bureaux](/manual/join).',
    ],
    actions: both([{ href: '/', label: 'Watch a film' }]),
  }),
article({
    number: '02',
    slug: 'ad-free',
    title: 'Ad-free',
    headline: 'There are no ads on Fjorr.',
    lead: [
      'Not before a film, not after, not in the middle — no pre-rolls, no banners.',
      'Watching stays clean because [the Bureaux](/manual/join) funds the work.',
    ],
    actions: both([{ href: '/', label: 'Watch a film' }]),
  }),
article({
    number: '03',
    slug: 'join',
    title: 'Join',
    headline: 'The Bureaux.',
    lead: [
      'Annual membership that funds the films so watching stays ad-free. Pay once a year — the library stays free either way.',
      'With a seat you nominate, plus films, chase bounties, and earn Voyageur numbers. Start by [nominating a story](/manual/nominate).',
    ],
    actions: {
      guest: [{ href: '/bureaux', label: 'Join the Bureaux' }],
      member: [{ href: '/bureaux', label: 'Your Bureaux' }],
    },
  }),
article({
    number: '04',
    slug: 'voyages',
    title: 'Voyageur No.',
    headline: "Your place in a film's history.",
    lead: [
      "Where you land in a film's watch order, first through thousandth. Watch at least half a film while signed in, and a number lands — permanent, yours alone, never reassigned.",
      'This is your trail — who found it before you, who found it because of you. Open yours from [your account](/manual/account).',
    ],
    actions: {
      guest: [{ href: '/signin?next=/account/voyages', label: 'Open Voyages' }],
      member: [{ href: '/account/voyages', label: 'Open Voyages' }],
    },
    plates: [{ src: '/manual/voyages.svg', label: 'Voyageur No.' }],
  }),
article({
    number: '05',
    slug: 'nominate',
    title: 'Nominate',
    headline: 'Scout stories.',
    lead: [
      'Members send stories Fjorr should make — or answer an [open bounty](/manual/bounties) with a brief and a stake.',
      'Write what the story is and why it matters. Fjorr reviews every brief; made films credit the nominator. Guests can browse — nominating needs a Bureaux seat.',
    ],
    actions: {
      guest: [{ href: '/bureaux', label: 'Join to nominate' }],
      member: [{ href: '/nominate', label: 'Nominate' }],
    },
    plates: [{ src: '/manual/nominate.svg', label: 'Nominate' }],
  }),
article({
    number: '06',
    slug: 'bounties',
    title: 'Bounties',
    headline: 'Find it. Get paid.',
    lead: [
      'Open hunts for stories Fjorr wants made — brief and reward attached. Browse posters on the [Bounties wall](/bounties).',
      "Read the brief, then nominate your take. If yours is selected and the film gets made, the reward is paid and you're credited. Answering a bounty is a member move.",
    ],
    actions: both([{ href: '/bounties', label: 'Browse Bounties' }]),
    plates: [{ src: '/manual/bounties.svg', label: 'Bounties' }],
  }),
article({
    number: '07',
    slug: 'plus',
    title: 'Plus Machine',
    headline: 'No film is version final.',
    lead: [
      "Bureaux members flag what's not working; the Cabinet decides. If they're right, they plus it — sharper edit, better score, a braver idea. v2 goes live; v1 stays archived, credited, visible.",
      'Every film has a Plus button. Leave a note on the exact timecode, submit a patch if you have one, and track it from [your account](/account/plus).',
    ],
    actions: {
      guest: [{ href: '/bureaux', label: 'Join the Bureaux' }],
      member: [{ href: '/account/plus', label: 'Your Plus notes' }],
    },
    plates: [{ src: '/manual/plus.svg', label: 'Plus' }],
  }),
article({
    number: '08',
    slug: 'cabinet',
    title: 'The Cabinet',
    headline: 'A collective of world-class talent.',
    lead: [
      "Directors, editors, composers, and more — the people who make Fjorr's films.",
      'Apply to join, or suggest someone who belongs, at [the Cabinet](/cabinet). Not everyone is accepted.',
    ],
    actions: {
      guest: [{ href: '/cabinet', label: 'Apply to join' }],
      member: [{ href: '/cabinet', label: 'Open The Cabinet' }],
    },
  }),
article({
    number: '09',
    slug: 'account',
    title: 'Account',
    headline: 'Your record on Fjorr.',
    lead: [
      'Voyages, nominations, your profile, and your Bureaux seat — all in one place. Sign in with a magic link or Google.',
      "Review films you've logged, manage nominations, edit your profile, and handle membership. Member tools unlock with [the Bureaux](/manual/join).",
    ],
    actions: {
      guest: [{ href: '/signin', label: 'Open account' }],
      member: [{ href: '/account/voyages', label: 'Open account' }],
    },
  }),
article({
    number: '10',
    slug: 'cancel',
    title: 'Cancel',
    headline: "You can leave. What you've built stays.",
    lead: [
      'Cancel anytime from the [Bureaux page](/bureaux). Access runs through the period you\'ve paid for, then member tools stop.',
      'Your Bureaux number and past Voyages stay on record. The library stays free either way.',
    ],
    actions: {
      guest: [{ href: '/signin?next=/bureaux', label: 'Manage membership' }],
      member: [{ href: '/bureaux', label: 'Manage membership' }],
    },
  }),
article({
    number: '11',
    slug: 'contact',
    title: 'Contact',
    headline: "Let's talk.",
    lead: [
      "Partnership, press, or something worth making — we're here for it. Email reaches a real person. For how stories earn a place on Fjorr, read the [Principles of a Myth](/principles).",
    ],
    actions: both([
      { href: 'clipboard:control@fjorr.com', label: 'Write in' },
    ]),
  }),
article({
    number: '12',
    slug: 'terms',
    title: 'Terms Sheet',
    headline: 'House rules.',
    lead: [
      'Watching is free. Membership is optional. How you’re welcome to use Fjorr — the service, accounts, the Bureaux, and the work.',
    ],
    actions: both([{ href: '/terms', label: 'Read the Terms Sheet' }]),
  }),
article({
    number: '13',
    slug: 'privacy',
    title: 'Privacy Notice',
    headline: 'What we collect, and what we don’t.',
    lead: [
      'Watching stays open. We do not sell personal information, and we do not use advertising trackers or build advertising profiles about you.',
    ],
    actions: both([{ href: '/privacy', label: 'Read the Privacy Notice' }]),
  }),
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
  'the-cabinet': 'cabinet',
  desk: 'contact',
  'sign-in': 'account',
  'voyages-and-profile': 'voyages',
  'privacy-and-data': 'privacy',
  'terms-privacy': 'terms',
  // Old standalone routes still resolve via redirects; keep slug aliases too.
};

/** Index menu — Understand / Participate / Membership / Fine print. */
export const MANUAL_MENU_GROUPS: {
  id: 'understand' | 'participate' | 'membership' | 'finePrint';
  slugs: string[];
}[] = [
  { id: 'understand', slugs: ['why', 'ad-free'] },
  {
    id: 'participate',
    slugs: [
      'watch',
      'nominate',
      'bounties',
      'plus',
      'voyages',
      'cabinet',
      'contact',
    ],
  },
  { id: 'membership', slugs: ['join', 'cancel', 'account'] },
  { id: 'finePrint', slugs: ['terms', 'privacy'] },
];

export function listManualEntries(): ManualEntry[] {
  return MANUAL_ENTRIES;
}

/** Flat slug order matching the grouped index (for prev / next). */
export function listManualMenuOrder(): string[] {
  return MANUAL_MENU_GROUPS.flatMap((g) => g.slugs);
}

export function getManualEntry(slug: string): ManualEntry | null {
  return MANUAL_ENTRIES.find((e) => e.slug === slug) || null;
}

export function getManualMenuNeighbors(slug: string): {
  prev: ManualEntry | null;
  next: ManualEntry | null;
} {
  const order = listManualMenuOrder();
  const index = order.indexOf(slug);
  if (index < 0) return { prev: null, next: null };
  return {
    prev: index > 0 ? getManualEntry(order[index - 1]) : null,
    next: index < order.length - 1 ? getManualEntry(order[index + 1]) : null,
  };
}

export function manualEntryHref(slug: string) {
  return `/manual/${slug}` as const;
}
