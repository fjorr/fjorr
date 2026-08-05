/**
 * The Manual — numbered instrument.
 * Fixed entries. State-aware CTAs. One (or two) actions each.
 *
 * Two card kinds, one chrome:
 * - instrument — What / Happens / CTA (tools)
 * - article — eyebrow + headline + body (doctrine)
 */

/** Bump when Manual copy or structure ships. Shown in menu colophon. */
export const MANUAL_VERSION = 'V1';
export const MANUAL_UPDATED = '4 Aug 2026';

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

type ManualEntryShared = {
  /** 00 … 13 */
  number: string;
  slug: string;
  /** Index / menu label; article eyebrow. */
  title: string;
  actions: Record<ManualAudience, ManualAction[]>;
  /**
   * Optional plates — thumb + View after What it is (instrument)
   * or after the lead (article). Tap opens full-bleed; next/prev when multiple.
   */
  plates?: ManualPlate[];
};

/** Spec-sheet tool card. */
export type ManualInstrumentEntry = ManualEntryShared & {
  kind: 'instrument';
  what: string;
  happens: string;
};

/** Doctrine / long-form card. */
export type ManualArticleEntry = ManualEntryShared & {
  kind: 'article';
  headline: string;
  /** e.g. legal “Last updated · 1 Aug 2026” */
  updated?: string;
  lead?: string[];
  sections?: ManualSection[];
  steps?: { title: string; items: string[] };
  closing?: string;
};

export type ManualEntry = ManualInstrumentEntry | ManualArticleEntry;

export function getManualPlates(entry: ManualEntry): ManualPlate[] {
  return entry.plates ?? [];
}

function both(actions: ManualAction[]): Record<ManualAudience, ManualAction[]> {
  return { guest: actions, member: actions };
}

function instrument(
  entry: Omit<ManualInstrumentEntry, 'kind'>
): ManualInstrumentEntry {
  return { kind: 'instrument', ...entry };
}

function article(entry: Omit<ManualArticleEntry, 'kind'>): ManualArticleEntry {
  return { kind: 'article', ...entry };
}

export function manualEntryDescription(entry: ManualEntry): string {
  if (entry.kind === 'article') {
    return entry.lead?.[0] || entry.headline;
  }
  return entry.what;
}

export const MANUAL_ENTRIES: ManualEntry[] = [
  instrument({
    number: '00',
    slug: 'why',
    title: 'Why',
    what: "The algorithm doesn't care who you become. Fjorr does — short films made on purpose, not for the feed.",
    happens:
      "Fjorr is a home for the world's greatest stories, told as short films people can actually finish. The Bureaux funds the work so watching stays free and clean. Membership is how you take part — nominate, mark craft, leave a trail — not a paywall on the films.",
    actions: both([{ href: '/about', label: 'Read the full story' }]),
  }),
  instrument({
    number: '01',
    slug: 'watch',
    title: 'Watch',
    what: "Short films of the world's greatest stories. Free. No expiry. Anyone can watch — membership isn't required.",
    happens:
      'Open a film and press play. Nothing to subscribe to, nothing locked behind a trial. Sign in if you want a Voyageur number; skip it if you just came to watch.',
    actions: both([{ href: '/', label: 'Watch a film' }]),
  }),
  instrument({
    number: '02',
    slug: 'ad-free',
    title: 'Ad-free',
    what: 'There are no ads on Fjorr. Not before a film. Not after. Not in the middle.',
    happens:
      'No pre-rolls, no banners, no mid-rolls, no sponsored interruptions. Watching stays clean — the Bureaux funds the work, not advertisers.',
    actions: both([{ href: '/', label: 'Watch a film' }]),
  }),
  instrument({
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
  }),
  instrument({
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
    plates: [{ src: '/manual/nominate.svg' }],
  }),
  article({
    number: '05',
    slug: 'plus',
    title: 'Plus Machine',
    headline: 'No film is version final.',
    lead: [
      "A feature costs too much to risk. A five-minute film doesn't. That's the opening short form has always had — cheap enough to try the wrong idea and find the right one.",
      "Films on Fjorr ship as v1 — not a rough draft, but not the last word either. When something's worth making better, we make it better. We call that the plus.",
    ],
    sections: [
      {
        title: 'What that means',
        paragraphs: [
          "A film ships when it's ready, not when it's perfect — because perfect doesn't exist on day one. Bureaux members can flag what's not landing. If the Cabinet agrees, they plus it: a sharper edit, a better score, a scene that finally works, an idea nobody was brave enough to try the first time. v2 goes live. v1 doesn't disappear — it stays in the changelog, credited, archived, visible.",
          'Nothing gets overwritten. It gets versioned.',
        ],
      },
      {
        title: 'Who actually ships the patch',
        paragraphs: [
          "Bureaux members don't edit films. They file the report. The Cabinet — the director, the editor, the composer, whoever built it — decides if the report's right, and if so, they're the ones who commit the change.",
          "Your name is on your work. It stays your work. v2 is still yours, made by you, because you agreed v1 could be better.",
        ],
      },
      {
        title: 'Or you can submit the patch yourself',
        paragraphs: [
          "Sometimes the fix isn't a flag — it's already made. Sometimes it's bolder than a fix: a different score entirely, a cut that takes a real swing. If you can prove it's stronger, submit it. If the Cabinet agrees, it ships, and you're credited on it.",
          'This is how new names get pulled into the Cabinet — not by application, by proof.',
        ],
      },
      {
        title: 'Why',
        paragraphs: [
          "A feature can't afford to be wrong. A five-minute film can afford to try. That's not a compromise — it's the one advantage short film has always had over everything else, and almost nobody's used it. Every patch, every resubmission, every wild swing that actually lands is proof the format can hold more risk than anyone's asked of it.",
        ],
      },
    ],
    steps: {
      title: 'How to use',
      items: [
        'Join the Bureaux. Open any film. Tap Plus in the theater.',
        "Pause on the moment. Write what you'd change — or what already works.",
        'Send to the desk. Private. Daily limits apply.',
      ],
    },
    closing: "The best version hasn't shipped yet.",
    actions: {
      guest: [{ href: '/bureaux', label: 'Join the Bureaux' }],
      member: [{ href: '/', label: 'Watch a film' }],
    },
    plates: [
      { src: '/manual/plus.svg', label: 'Plus' },
      { src: '/manual/watch.svg', label: 'Theater' },
    ],
  }),
  instrument({
    number: '06',
    slug: 'cabinet',
    title: 'The Cabinet',
    what: "A collective of craftspeople — directors, editors, composers, and more — who make Fjorr's films.",
    happens:
      'Members can offer their own craft or suggest someone who belongs. Names go to the desk. Watching stays open either way; sending a name is a member move.',
    actions: {
      guest: [{ href: '/bureaux', label: 'Join the Bureaux' }],
      member: [{ href: '/cabinet', label: 'Open The Cabinet' }],
    },
  }),
  instrument({
    number: '07',
    slug: 'account',
    title: 'Account',
    what: 'Your desk on Fjorr — Voyages, nominations, profile, and Bureaux, in one place.',
    happens:
      "Sign in with a magic link or Google. From account you can review films you've logged, manage nominations, edit your profile, and open Bureaux to handle membership. Guests can still create an account; member tools unlock with the Bureaux.",
    actions: {
      guest: [{ href: '/signin', label: 'Open account' }],
      member: [{ href: '/account/voyages', label: 'Open account' }],
    },
  }),
  instrument({
    number: '08',
    slug: 'contact',
    title: 'Contact',
    what: 'Partnership, press, or something worth making.',
    happens:
      'Email reaches a real person. For how stories earn a place on Fjorr, read the Principles of a Myth.',
    actions: both([
      { href: 'clipboard:control@fjorr.com', label: 'Write in' },
    ]),
  }),
  instrument({
    number: '09',
    slug: 'voyages',
    title: 'Voyages',
    what: "Your Voyageur No. — where you land in a film's watch order, first through thousandth.",
    happens:
      "Watch at least half a film while signed in and a number lands — permanent for that film. Your account keeps the trail: what you've watched, in what order, and the chain of who found it before you.",
    actions: {
      guest: [{ href: '/signin?next=/account/voyages', label: 'Open Voyages' }],
      member: [{ href: '/account/voyages', label: 'Open Voyages' }],
    },
    plates: [{ src: '/manual/voyages.svg' }],
  }),
  instrument({
    number: '10',
    slug: 'bounties',
    title: 'Bounties',
    what: 'Open hunts for stories Fjorr wants made — with a brief, a deadline spirit, and a reward attached.',
    happens:
      "Browse posters on the Bounties wall. Read the brief, then nominate your take. If yours is selected and the film gets made, the reward is paid and you're credited. Anyone can look; answering a bounty is a member move.",
    actions: both([{ href: '/bounties', label: 'Browse Bounties' }]),
    plates: [{ src: '/manual/bounties.svg' }],
  }),
  instrument({
    number: '11',
    slug: 'cancel',
    title: 'Cancel',
    what: 'Leave the Bureaux without losing the films — membership ends; watching does not.',
    happens:
      "Cancel anytime from the Bureaux page. Access runs through the period you've paid for, then member tools (Nominate, Plus, and the rest) stop. Your Bureaux number and past Voyages stay on record. The library stays free either way.",
    actions: {
      guest: [{ href: '/signin?next=/bureaux', label: 'Manage membership' }],
      member: [{ href: '/bureaux', label: 'Manage membership' }],
    },
  }),
  article({
    number: '12',
    slug: 'terms',
    title: 'Terms Sheet',
    headline: 'House rules.',
    updated: 'Last updated · 1 Aug 2026',
    lead: [
      'Watching is free. Membership is optional. By using fjorr.com and related services, you agree to this Terms Sheet. If you don’t agree, don’t use the site.',
    ],
    sections: [
      {
        title: 'Agreement',
        paragraphs: [
          'Fjorr is a place for short films and stories. By using fjorr.com and related services, you agree to this Terms Sheet. If you don’t agree, don’t use the site. Watching is free. Membership is optional.',
        ],
      },
      {
        title: 'The service',
        paragraphs: [
          'Fjorr hosts short cinematic films and related pages (Bounties, Cabinet, The Manual, and more). Films are meant to be watched on the site. Features evolve; we may add, change, or remove parts of the service. Temporary access gates (for staging or pre-launch) may apply before the public site is fully open.',
        ],
      },
      {
        title: 'Accounts and the Bureaux',
        paragraphs: [
          'You don’t need an account to watch. Accounts exist for Bureaux members and related paid or complimentary seats. Sign-in is for returning members (magic link or Google). Public self-serve signup is not the path to an account — joining is through Bureaux checkout, a gift seat, or a desk-issued complimentary seat. You’re responsible for activity on your account and for keeping sign-in access under your control.',
        ],
      },
      {
        title: 'Membership, gifts, and payments',
        paragraphs: [
          'The Bureaux is an annual paid membership that unlocks participation (including nominate, Plus Machine, Cabinet tools, and member perks described on the site). Payment is processed by Stripe. Members may gift a limited number of seats under the rules shown at checkout (paid by the giver, claimed by the recipient). Complimentary lifetime seats may be granted by the desk. Fees, renewals, and cancel-at-period-end behavior follow what Stripe and the membership page show at the time you join or manage. Watching films does not require membership.',
        ],
      },
      {
        title: 'Acceptable use',
        paragraphs: [
          'Use Fjorr lawfully and respectfully. Don’t scrape, attack, or overload the service; don’t circumvent access controls; don’t harass people or abuse nomination, Plus, Cabinet, or gift flows; don’t upload unlawful or infringing material; don’t misrepresent who you are to the desk. We may suspend or end access for abuse.',
        ],
      },
      {
        title: 'Your submissions',
        paragraphs: [
          'Nominations, Plus Machine notes, Cabinet suggestions, and similar member submissions are sent to the desk to evaluate stories and craft — they aren’t a public comments board. You grant Fjorr a license to use what you submit for operating those features and producing or considering films. You represent you have the rights to submit what you send. We don’t owe a film, bounty, credit, or reply for every nomination.',
        ],
      },
      {
        title: 'Intellectual property',
        paragraphs: [
          'Films, visuals, words, brands, and logos on Fjorr belong to Fjorr or to the people and partners who made them. Watch and share links for personal, non-commercial enjoyment. Don’t copy, download for redistribution, remix, or commercially exploit the work without permission. Partner and press uses need a written okay from us.',
        ],
      },
      {
        title: 'Third parties',
        paragraphs: [
          'Streaming, auth, payments, and email may rely on third-party providers (including Mux, Supabase, and Stripe). Their terms and privacy practices apply to their processing. Links to other sites are not under our control.',
        ],
      },
      {
        title: 'Disclaimers and liability',
        paragraphs: [
          'Fjorr is provided “as is.” We don’t promise uninterrupted or error-free service. To the fullest extent the law allows, Fjorr and its people aren’t liable for indirect, incidental, or consequential damages arising from your use of the site or membership. Nothing here limits rights that can’t be limited by law.',
        ],
      },
      {
        title: 'Changes and contact',
        paragraphs: [
          'We may update this Terms Sheet; the date at the top will change when we do. Continued use after an update means you accept the revised sheet. Questions: control@fjorr.com. Privacy details are in the Privacy Notice.',
        ],
      },
    ],
    actions: both([
      { href: '/manual/privacy', label: 'Privacy Notice' },
      { href: 'clipboard:control@fjorr.com', label: 'Write in' },
    ]),
  }),
  article({
    number: '13',
    slug: 'privacy',
    title: 'Privacy Notice',
    headline: 'What we collect, and what we don’t.',
    updated: 'Last updated · 1 Aug 2026',
    lead: [
      'Watching stays open. We do not sell personal information, and we do not use advertising trackers or build advertising profiles about you.',
    ],
    sections: [
      {
        title: 'Who we are and what this covers',
        paragraphs: [
          'Fjorr (“Fjorr,” “we,” “us”) operates fjorr.com and related services — a home for short cinematic films about the world’s greatest stories. Watching stays open: you do not need an account to browse or watch. The Bureaux is optional paid annual membership for people who want to take part (nominate, Plus Machine, Cabinet tools, gift seats, and related member features).',
          'This Privacy Notice describes personal information we collect, how we use and share it, how long we keep it, and the choices you have. It applies to the website, member account tools, membership checkout, and emails we send. It does not cover third-party sites we link to.',
          'We do not sell personal information, and we do not use advertising trackers or build advertising profiles about you.',
        ],
      },
      {
        title: 'Watching without an account',
        paragraphs: [
          'Anyone can watch films without signing in. Continue-watching / resume position for guests is stored in your browser (local storage) on your device. It is not uploaded to a Fjorr account profile.',
          'Even without an account, delivering a webpage and a video stream still involves technical data (see below). That is ordinary infrastructure — not a membership dossier.',
        ],
      },
      {
        title: 'Categories of information we collect',
        paragraphs: [
          'Information you provide: newsletter (“Intel”) email if you subscribe; account email when you join the Bureaux or receive a gift or complimentary seat; profile details you save (display name, bio, privacy preferences); nominations (story pitches and related fields); Plus Machine notes; Cabinet suggestions; gift-recipient email when a member pays for someone’s seat; messages you send us (e.g. to control@fjorr.com).',
          'Membership and payment data: when you pay for the Bureaux, Stripe processes the payment. We retain membership status, source (paid, gift, or complimentary), Bureaux number, billing period, cancel-at-period-end flags, and Stripe customer / subscription identifiers. We do not store your full card number on Fjorr servers.',
          'Account activity: for signed-in members — Voyages (film stamps after a meaningful watch), optional referral “via” lineage when you enable it, and records needed to run gated member features.',
          'Authentication data: magic-link sign-in and, for returning members, Google sign-in. Auth is handled by our auth provider (Supabase). Google may share the account email and basic profile fields Google allows for that sign-in.',
          'Technical and usage data: server and edge logs (IP address, browser/user agent, device type, approximate location at city or region level, pages or assets requested, timestamps, error codes); streaming diagnostics from our video provider (Mux) so playback works (buffering, quality, errors). We may also store functional cookies and similar technology described below.',
        ],
      },
      {
        title: 'How we use information',
        paragraphs: [
          'We use personal information to: operate and secure the site; stream films; create and maintain member accounts; provide and manage Bureaux membership (including renewals, cancellations, gifts, and desk-issued complimentary seats); process nominations, Plus notes, and Cabinet requests; send transactional mail (magic links, membership and nomination status); send the newsletter if you opted in; prevent fraud and abuse; diagnose outages and improve reliability; and comply with law.',
          'We do not use personal information to target third-party ads, to sell data brokers access to you, or to build a marketing profile for advertisers.',
        ],
      },
      {
        title: 'Legal bases (where they apply)',
        paragraphs: [
          'If you are in a place that requires a “legal basis” (for example the EEA/UK), we typically rely on: performance of a contract (membership, account, gifts); consent (newsletter where required, certain cookies if we ever ask); legitimate interests (securing the service, understanding aggregate playback health, improving films and the site in a privacy-respecting way); and legal obligation when we must keep or disclose records.',
        ],
      },
      {
        title: 'How we share information',
        paragraphs: [
          'Service providers (processors) who help us run Fjorr, under instructions to use data only for that work, including: Supabase (authentication and database), Stripe (payments), Mux (video streaming and playback diagnostics), hosting/CDN providers, and our email provider (e.g. Postmark) for transactional and newsletter mail.',
          'We may disclose information if required by law, regulation, or legal process; to protect Fjorr, our users, or the integrity of the work; or in connection with a reorganization, financing, or transfer of assets (in which case this notice would continue to apply or you’d be told otherwise).',
          'We do not sell or rent personal information. Member submissions (nominations, Plus notes, Cabinet suggestions) go to the desk for craft and story evaluation — they are not published as a public comments feed.',
        ],
      },
      {
        title: 'Cookies and similar technology',
        paragraphs: [
          'We use cookies and local storage that are needed for the product to work: sign-in / session cookies; display and preference settings; optional pre-launch or staging site-access cookies; referral “via” cookies for member share trails; and browser local storage for guest watch progress and similar client-only state.',
          'We do not use third-party advertising cookies, advertising IDs, or cross-site tracking pixels for ads. If we introduce optional product analytics later, we will update this notice and, where required, ask for consent.',
        ],
      },
      {
        title: 'Retention',
        paragraphs: [
          'We keep personal information only as long as needed for the purposes above, then delete or de-identify it when practicable.',
          'In practice: newsletter emails until you unsubscribe (or the list is retired); account and membership records for the life of the account and a reasonable period afterward for billing disputes, abuse prevention, and legal retention; Stripe billing history per Stripe’s and our accounting needs; nominations and Plus notes while useful for production and desk history (and longer if a film credits or pays out a bounty); Voyages while your account exists; server logs for a shorter operational window unless needed for security investigations; guest watch progress until you clear site data in your browser.',
        ],
      },
      {
        title: 'International transfers',
        paragraphs: [
          'Fjorr and our providers may process data in the United States and other countries. Where required, we rely on appropriate transfer mechanisms used by those providers (such as standard contractual clauses) or your instructions when you use the service from abroad.',
        ],
      },
      {
        title: 'Security',
        paragraphs: [
          'We use industry-standard safeguards appropriate to a small production service (encrypted transport, access controls on production systems, processor security programs). No method of transmission or storage is perfectly secure. If we become aware of a breach that affects your personal information, we will take steps required by applicable law, which may include notifying you.',
        ],
      },
      {
        title: 'Children',
        paragraphs: [
          'Fjorr is not directed at children under 13 (or under 16 where that is the relevant age). We do not knowingly collect personal information from children. If you believe a child has provided us information, contact us and we will delete it.',
        ],
      },
      {
        title: 'Your choices and rights',
        paragraphs: [
          'You can unsubscribe from the newsletter using the link in those emails or by writing us. Signed-in members can update their name and email from The Bureaux in Account. You can clear browser storage to remove guest watch progress. You can cancel Bureaux membership from The Bureaux page (access continues through the paid period when cancel-at-period-end applies) or by contacting us.',
          'Depending on where you live (including California and the EEA/UK), you may have rights to access, correct, delete, or export personal information; to object to or restrict certain processing; and to withdraw consent where processing is based on consent. You may also have the right to appeal a refusal or to complain to a supervisory authority. To exercise rights, email control@fjorr.com. We will ask for enough information to verify the request. We do not discriminate against you for exercising privacy rights.',
          '“Do not sell or share” / targeted advertising: we do not sell personal information and we do not share it for cross-context behavioral advertising as those terms are commonly used under California law. If that ever changes, we will update this notice and provide an opt-out.',
        ],
      },
      {
        title: 'What we do not do',
        bullets: [
          'Sell or rent personal information',
          'Run advertising trackers or build advertising profiles',
          'Require an account to watch films',
          'Make member profiles public unless you choose that',
          'Treat Plus notes or nominations as public comments',
          'Store full payment card numbers on Fjorr (Stripe does)',
          'Use guest local watch progress as a cloud identity file',
          'Share your data with data brokers for their marketing',
        ],
      },
      {
        title: 'Changes to this notice',
        paragraphs: [
          'If what we collect or how Fjorr works changes in a material way, we will update this Privacy Notice and the “Last updated” date. For significant changes, we may also provide an additional notice (for example by email to members or a note on the site).',
        ],
      },
      {
        title: 'Relationship to the Terms Sheet',
        paragraphs: [
          'Use of Fjorr is also governed by our Terms Sheet. If there is a conflict about personal information, this Privacy Notice controls for privacy topics.',
        ],
      },
      {
        title: 'Contact',
        paragraphs: [
          'Privacy questions, rights requests, or concerns: control@fjorr.com.',
        ],
      },
    ],
    actions: both([
      { href: '/manual/terms', label: 'Terms Sheet' },
      { href: 'clipboard:control@fjorr.com', label: 'Write in' },
    ]),
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
  principles: 'contact',
  // Old standalone routes still resolve via redirects; keep slug aliases too.
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
