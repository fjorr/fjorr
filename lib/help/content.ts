/**
 * The Manual IA — mirrors the product surface.
 * Placeholder copy until real docs land.
 */

export type HelpArticle = {
  slug: string;
  title: string;
  description: string;
  /** Sidebar group id */
  categoryId: string;
  /** Short lead under the title */
  lead: string;
  sections: HelpSection[];
};

export type HelpSection =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul'; items: string[] };

export type HelpCategory = {
  id: string;
  label: string;
  articleSlugs: string[];
};

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: 'start',
    label: 'Start here',
    articleSlugs: ['what-is-fjorr', 'watching-films', 'getting-started'],
  },
  {
    id: 'bureaux',
    label: 'The Bureaux',
    articleSlugs: ['what-is-the-bureaux', 'joining-and-billing', 'member-perks'],
  },
  {
    id: 'participate',
    label: 'Take part',
    articleSlugs: [
      'nominating-stories',
      'bounties',
      'plus-machine',
      'the-cabinet',
    ],
  },
  {
    id: 'account',
    label: 'Your account',
    articleSlugs: ['sign-in', 'voyages-and-profile', 'privacy-and-data'],
  },
  {
    id: 'desk',
    label: 'The desk',
    articleSlugs: ['contact', 'principles'],
  },
];

const ARTICLES: HelpArticle[] = [
  {
    slug: 'what-is-fjorr',
    title: 'What is Fjorr?',
    description: 'Short films of the world’s greatest stories.',
    categoryId: 'start',
    lead: 'Fjorr is home to short cinematic films about the stories that shaped people — free to watch, forever.',
    sections: [
      {
        type: 'p',
        text: 'Placeholder. Fjorr exists so great stories stay easy to find and hard to forget. Films are free. Membership is how the desk stays funded and how members take part.',
      },
      {
        type: 'h2',
        text: 'What you’ll find',
      },
      {
        type: 'ul',
        items: [
          'Films you can watch without an account',
          'The Bureaux — annual membership',
          'Ways to nominate, Plus, and suggest people for the Cabinet',
        ],
      },
      {
        type: 'p',
        text: 'This article is placeholder copy for The Manual template. Replace with the real orientation piece when you’re ready.',
      },
    ],
  },
  {
    slug: 'watching-films',
    title: 'Watching films',
    description: 'How to watch on Fjorr — no account required.',
    categoryId: 'start',
    lead: 'Anyone can watch. Open a film, press play, and stay as long as you like.',
    sections: [
      {
        type: 'p',
        text: 'Placeholder. Watching never requires a subscription. Sign-in and Bureaux membership unlock participation — not access to the catalog.',
      },
      {
        type: 'h2',
        text: 'Tips',
      },
      {
        type: 'ul',
        items: [
          'Browse from the home page or search',
          'Use the theater controls for fullscreen and captions when available',
          'Share a film link — watching stays open for whoever receives it',
        ],
      },
    ],
  },
  {
    slug: 'getting-started',
    title: 'Getting started',
    description: 'First steps on Fjorr.',
    categoryId: 'start',
    lead: 'Watch freely. Join the Bureaux when you want an account and a seat at the desk.',
    sections: [
      {
        type: 'p',
        text: 'Placeholder. There is no free membership tier. An account is a paid Bureaux membership. Until then, explore films without signing in.',
      },
      {
        type: 'ul',
        items: [
          'Watch anything on the site',
          'Join the Bureaux with email and card when you’re ready',
          'Sign in later with the same email to open your account',
        ],
      },
    ],
  },
  {
    slug: 'what-is-the-bureaux',
    title: 'What is the Bureaux?',
    description: 'Annual membership — how Fjorr stays free to watch.',
    categoryId: 'bureaux',
    lead: 'The Bureaux is Fjorr’s annual membership. It’s how films stay free, and how members take part.',
    sections: [
      {
        type: 'p',
        text: 'Placeholder. Members get a permanent Bureaux number, early access, and the ability to nominate, Plus, and send names to the Cabinet.',
      },
      {
        type: 'p',
        text: 'Watching remains free for everyone — membership is for people who want to help make the next films possible.',
      },
    ],
  },
  {
    slug: 'joining-and-billing',
    title: 'Joining & billing',
    description: 'How to join the Bureaux and manage your subscription.',
    categoryId: 'bureaux',
    lead: 'Join with your email and card on the Bureaux page. Manage renewal from the same place once you’re in.',
    sections: [
      {
        type: 'h2',
        text: 'Join',
      },
      {
        type: 'ul',
        items: [
          'Go to The Bureaux',
          'Enter your email and continue to payment',
          'Check your email for a sign-in link after you pay',
        ],
      },
      {
        type: 'h2',
        text: 'Billing',
      },
      {
        type: 'p',
        text: 'Placeholder. Membership is billed annually. You can update your card or cancel at period end from the Bureaux page while signed in.',
      },
    ],
  },
  {
    slug: 'member-perks',
    title: 'Member perks',
    description: 'What Bureaux membership includes.',
    categoryId: 'bureaux',
    lead: 'A short list of what membership unlocks — placeholder until the live perk sheet is finalized.',
    sections: [
      {
        type: 'ul',
        items: [
          'A Bureaux number, permanent, yours',
          'Nominate stories for Bounties',
          'Plus Machine — mark moments for the desk',
          'Early access to films and bounties',
          'Credit on films you help make possible',
        ],
      },
    ],
  },
  {
    slug: 'nominating-stories',
    title: 'Nominating stories',
    description: 'How Bureaux members nominate stories.',
    categoryId: 'participate',
    lead: 'Nominations are for Bureaux members — quality over volume.',
    sections: [
      {
        type: 'p',
        text: 'Placeholder. From Nominate, pick a kind of story, write a clear brief, and send it to the desk. Limits keep the queue readable.',
      },
      {
        type: 'p',
        text: 'Open bounties can attach to a nomination when they fit.',
      },
    ],
  },
  {
    slug: 'bounties',
    title: 'Bounties',
    description: 'Open story bounties on Fjorr.',
    categoryId: 'participate',
    lead: 'Bounties are open calls for specific stories the desk wants made.',
    sections: [
      {
        type: 'p',
        text: 'Placeholder. Browse active bounties, read the brief, and nominate toward one if you’re a Bureaux member. Rewards and credit rules live on each bounty page.',
      },
    ],
  },
  {
    slug: 'plus-machine',
    title: 'Plus Machine',
    description: 'Mark moments in a film for the desk.',
    categoryId: 'participate',
    lead: 'Plus is how members leave precise notes on a cut — timestamped, useful, not a comment thread.',
    sections: [
      {
        type: 'p',
        text: 'Placeholder. Open Plus while watching, mark a moment, and say what you noticed. Bureaux membership is required.',
      },
    ],
  },
  {
    slug: 'the-cabinet',
    title: 'The Cabinet',
    description: 'Suggest people who belong in the craft network.',
    categoryId: 'participate',
    lead: 'The Cabinet is a desk list of craft people — members can offer themselves or suggest someone else.',
    sections: [
      {
        type: 'p',
        text: 'Placeholder. Sending a name requires an active Bureaux membership. Keep the note short and specific.',
      },
    ],
  },
  {
    slug: 'sign-in',
    title: 'Sign in',
    description: 'How returning members sign in.',
    categoryId: 'account',
    lead: 'Sign in is for people who already joined the Bureaux. New accounts are created through membership, not a free signup form.',
    sections: [
      {
        type: 'ul',
        items: [
          'Use Sign in with the email you joined with',
          'Open the magic link we send',
          'Google works for returning members who already linked it',
        ],
      },
      {
        type: 'p',
        text: 'Placeholder. If you don’t have an account yet, join the Bureaux first.',
      },
    ],
  },
  {
    slug: 'voyages-and-profile',
    title: 'Voyages & profile',
    description: 'Your member home — watches, notes, and profile.',
    categoryId: 'account',
    lead: 'Once you’re in the Bureaux, Account holds Voyages, nominations, Plus logs, and your profile.',
    sections: [
      {
        type: 'p',
        text: 'Placeholder. Voyages tracks films you’ve stamped as a member. Profile holds the name and details you want on the desk.',
      },
    ],
  },
  {
    slug: 'privacy-and-data',
    title: 'Privacy & data',
    description: 'What we collect and how to manage it.',
    categoryId: 'account',
    lead: 'Watching stays open. Accounts are optional and tied to membership.',
    sections: [
      {
        type: 'p',
        text: 'Placeholder. See the Privacy Notice for the full picture. From Account → Privacy you can review member-facing controls when those ship.',
      },
    ],
  },
  {
    slug: 'contact',
    title: 'Contact the desk',
    description: 'How to reach Fjorr.',
    categoryId: 'desk',
    lead: 'For partnership, press, or general questions — write the desk.',
    sections: [
      {
        type: 'p',
        text: 'Placeholder. Email control@fjorr.com. For The Manual article feedback, say which page you were on.',
      },
    ],
  },
  {
    slug: 'principles',
    title: 'Principles',
    description: 'How Fjorr thinks about stories and the work.',
    categoryId: 'desk',
    lead: 'A short pointer to the public Principles page — placeholder bridge article.',
    sections: [
      {
        type: 'p',
        text: 'Placeholder. The living principles live on the site under Principles. This Help entry exists so the sidebar can point people there from the docs chrome.',
      },
    ],
  },
];

const bySlug = new Map(ARTICLES.map((a) => [a.slug, a]));

export function listHelpArticles(): HelpArticle[] {
  return ARTICLES;
}

export function getHelpArticle(slug: string): HelpArticle | null {
  return bySlug.get(slug) || null;
}

export function getHelpCategory(id: string): HelpCategory | null {
  return HELP_CATEGORIES.find((c) => c.id === id) || null;
}

export function helpArticleHref(slug: string) {
  return `/manual/${slug}` as const;
}
