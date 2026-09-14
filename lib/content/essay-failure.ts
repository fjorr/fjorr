/**
 * 100 Years of Failure — founding essay (from The Dossier, FJR-DOS-002).
 * English source of truth; chrome strings live in messages (EssayFailure).
 */

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
    text: 'Short film has never had a functional business model — just a hundred years of broken ones.',
  },
  {
    type: 'p',
    text: "For a century, the short film was almost never something you bought a ticket to see. It was what played while people found their seats. A warm-up act, a newsreel filler, a bonus feature tacked onto a DVD menu, or a loss-leader to test new animation software. That wasn't an artistic choice; it became the category's entire structural identity: something free, attached to something else, and never the reason anyone showed up.",
  },
  {
    type: 'p',
    text: 'The market problem was never a lack of human interest. It was a failure of the monetization vehicle.',
  },
  {
    type: 'figure',
    src: 'https://media.fjorr.com/app-assets/fjorr-le-voyage-dans-la-lune.jpg',
    alt: 'Le Voyage dans la Lune (1902) — Georges Méliès. The Man in the Moon with a capsule lodged in his eye.',
    width: 1000,
    height: 1330,
    caption: '*Le Voyage dans la Lune*, 1902. Directed by Georges Méliès.',
  },
  {
    type: 'p',
    text: 'Short film is exactly as old as cinema itself. Méliès sent a rocket into the eye of the moon in 1902, in one of the first narrative films ever made. The format has had over a century to find a working business model. It never has.',
  },
  { type: 'h2', text: 'The Broken Mechanics of Cinema History' },
  {
    type: 'p',
    text: 'Every attempt to monetize short cinema, from early Hollywood to Silicon Valley, tried to force the format into a transactional, ad-driven, or feature-centric box — and each one broke the same way.',
  },
  {
    type: 'timeline',
    items: [
      {
        year: '1948',
        title: 'The Studio System Collapse',
        text: 'In the 1930s and 40s, Hollywood forced theaters to buy shorts alongside feature films through "block booking." When the Supreme Court declared the practice illegal in the 1948 Paramount Decrees, theater owners stopped paying for shorts overnight. MGM gutted its short units, and Warner Bros. scaled back its iconic cartoon departments.',
      },
      {
        year: '1953',
        title: 'The Disney Pivot',
        text: 'By 1953, Walt Disney shut down his studio\'s dedicated short cartoon department. Production costs for hand-drawn animation had surged, but theaters paid only a flat, negligible rental fee. Disney realized shorts lost money on every single release, forcing a complete pivot toward feature-length films and advertiser-funded television.',
      },
      {
        year: '1995–',
        title: 'The Pixar Paradox',
        text: 'Even modern animation\'s greatest champion treats short films as an R&D tax write-off and a talent sandbox. Pixar shorts do not generate standalone revenue; they are subsidized entirely by the multi-hundred-million-dollar box office of the feature film that follows them.',
      },
      {
        year: '2020',
        title: 'The Silicon Valley Misfire (Quibi)',
        text: 'When tech finally attempted a short-form platform, it made the ultimate miscalculation. Quibi raised $1.75 billion to sell short, chopped-up television episodes as mobile "quick bites" for commuters. It treated short video as a smartphone tech constraint rather than a high-craft art form, fighting TikTok for idle distraction time behind a hard subscription paywall. It folded in six months.',
      },
    ],
  },
  {
    type: 'p',
    text: "Streaming apps and ad-driven feeds didn't fix this — they exacerbated it. Engagement algorithms favor infinite duration. A recommendation engine tuned to maximize screen time has zero financial incentive to surface a nine-minute masterpiece over a ninety-minute outrage-bait video.",
  },
  {
    type: 'p',
    text: 'For one hundred years, short film was treated as a calling card, a tech gimmick, or a launchpad to "real" cinema. Rarely the destination.',
  },
  {
    type: 'p',
    text: 'That is not a flaw in the format. It is a structural failure of every model built around it.',
  },
  { type: 'h2', text: 'Filling a Cultural Void' },
  {
    type: 'p',
    text: 'The format was never the compromise; it was simply denied a home.',
  },
  {
    type: 'p',
    text: 'Modern media has an obvious void. Hollywood spends $200 million on comic book sequels. Silicon Valley algorithms serve endless, disposable feeds designed to capture idle attention. Nobody is building a gold-standard home for short cinema — making short films of the essential, pivotal stories that shaped what it means to be human.',
  },
  {
    type: 'p',
    text: "Short cinema doesn't need to compete with TikTok for idle phone time, nor does it need to squeeze into a 1950s theatrical ticket model or a Silicon Valley tech gimmick. It needs the right vehicle.",
  },
  {
    type: 'p',
    text: "Fjorr's thesis is simple: the format didn't fail — the vehicle did.",
  },
  {
    type: 'p',
    text: "Instead of treating short films as appetizers or tech gimmicks, Fjorr treats them as the main event. Instead of hiding them behind transactional paywalls or serving them alongside intrusive ads, Fjorr is funded directly by its patrons — the Bureaux. Together, they're building a permanent, ad-free archive of world-class short films under 20 minutes — free for anyone in the world to watch.",
  },
  {
    type: 'p',
    text: 'Short was never a compromise. It just never had anywhere to live — and now it does.',
  },
];
