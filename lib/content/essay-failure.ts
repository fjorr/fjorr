/**
 * 100 Years of Failure — founding essay (from The Dossier, FJR-DOS-002).
 * English is the source. Other locales live in essay-failure-locales.ts.
 * Page chrome (title, lead, back) lives in messages (EssayFailure).
 */

import type { AppLocale } from '@/i18n/config';
import { ESSAY_FAILURE_LOCALES } from './essay-failure-locales';

export type EssayBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | {
      type: 'figure';
      src: string;
      alt: string;
      width: number;
      height: number;
      caption?: string;
    }
  | {
      type: 'timeline';
      items: { year: string; title: string; text: string }[];
    };

export const ESSAY_FAILURE_DEK =
  'The story of why short films never found a home.';

export const ESSAY_FAILURE_BODY: EssayBlock[] = [
  {
    type: 'p',
    text: 'Short film hasn’t had a business model that worked in a century.',
  },
  {
    type: 'p',
    text: 'It began as the main event. On December 28, 1895, the Lumière brothers charged admission in the basement of a Paris café and showed ten short films. Georges Méliès was in the audience. He asked to buy the machine and was turned down. Seven years later, he fired a capsule into the eye of the Moon.',
  },
  {
    type: 'figure',
    src: 'https://media.fjorr.com/app-assets/fjorr-le-voyage-dans-la-lune.jpg',
    alt: 'Le Voyage dans la Lune (1902), Georges Méliès. The Man in the Moon with a capsule lodged in his eye.',
    width: 1000,
    height: 1330,
    caption: '*Le Voyage dans la Lune*, 1902. Directed by Georges Méliès.',
  },
  {
    type: 'p',
    text: 'Then features took over. The short became what played while people found their seats: a warm-up act, newsreel filler, a bonus on a DVD menu. That wasn’t an artistic choice. It became the format’s whole identity: free, attached to something else, and never the reason anyone showed up.',
  },
  {
    type: 'p',
    text: 'The problem was never a lack of interest. It was the business around the format.',
  },
  { type: 'h2', text: 'Every attempt to fix it broke the same way' },
  {
    type: 'p',
    text: 'Each one tried to squeeze short film into a ticket, an ad, or a feature.',
  },
  {
    type: 'timeline',
    items: [
      {
        year: '1948',
        title: 'The studios lose their grip.',
        text: 'For years, studios forced theaters to take shorts bundled with their features. In 1948 the Supreme Court ruled against the studios. The settlements that followed ended the practice and broke up their theater chains, and television pulled audiences away. Over the next decade, studios closed their short units. MGM shut its cartoon studio in 1957, and Warner Bros. wound its cartoons down into the late 1960s.',
      },
      {
        year: 'The 1950s',
        title: 'Disney steps back.',
        text: 'In the decade after 1953, Disney wound down its theatrical shorts and moved its weight to features and television.',
      },
      {
        year: 'Today',
        title: 'The Pixar paradox.',
        text: 'Pixar, the best-known champion of shorts, uses them as a talent lab. They play before features and are largely paid for by what the features earn.',
      },
      {
        year: '2020',
        title: 'Quibi.',
        text: 'Quibi raised $1.75 billion to sell episodes in ten-minute bites for people on the go, behind a subscription, up against free apps like TikTok. It shut down six months after launch. It bet on the phone, not on the films.',
      },
    ],
  },
  {
    type: 'p',
    text: 'Streaming didn’t fix this. It made it worse. Feeds tuned for screen time have little reason to show you a nine-minute masterpiece over a ninety-minute outrage video.',
  },
  {
    type: 'p',
    text: 'For a hundred years, the short was a calling card, a tech experiment, or a launchpad to “real” cinema, and rarely the destination. Even the best online curators mostly serve filmmakers on their way to something else.',
  },
  { type: 'h2', text: 'What’s missing' },
  {
    type: 'p',
    text: 'Hollywood spends $200 million or more on comic book sequels. Feeds serve an endless stream built to hold idle attention. Short film has no home built for the stories themselves, the pivotal ones that shaped what it means to be human.',
  },
  {
    type: 'p',
    text: 'Imagine a place built for short cinema alone. Stories with the power of feature films, with no feeds, no algorithms and no disposable noise. The world’s greatest stories as short films, from fallen kings to prizefighters to Prometheus stealing fire, with the scale, standard and permanent home they deserve.',
  },
  {
    type: 'p',
    text: 'Short cinema doesn’t have to compete with TikTok for idle phone time, squeeze into a 1950s ticket model, or become a tech experiment. It needs a home.',
  },
  {
    type: 'p',
    text: 'Fjorr’s thesis is simple: the format didn’t fail. It lost its home.',
  },
  {
    type: 'p',
    text: 'Fjorr treats short films as the main event, not appetizers or gimmicks. There are no paywalls and no ads. Fjorr is funded by its patrons, the Bureaux, and by partners. It’s building a permanent archive of world-class short films, always 20 minutes or less, free for anyone in the world to watch.',
  },
  {
    type: 'p',
    text: 'Short was never a compromise. It just lost its home, and now it has one.',
  },
];

/** Localized essay body. English is the fallback. */
export function essayFailureBody(locale: string): EssayBlock[] {
  const localized = ESSAY_FAILURE_LOCALES[locale as AppLocale];
  return localized ?? ESSAY_FAILURE_BODY;
}
