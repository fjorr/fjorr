/** Shared mock content — Angry Birds 3 project page. */

export const GENRES = ['Adventure', 'Family', 'Comedy', 'Feature'] as const;

export const MARKETS = [
  {
    image: '/preview/story-inc/market-1.jpg',
    question: 'Mr. Beast in the next trailer?',
    outcomes: [
      { label: 'Yes', pct: 55 },
      { label: 'No', pct: 45 },
    ],
    closes: '12.23.26',
    volume: '$48.2k vol',
    traders: '2.4k',
  },
  {
    image: '/preview/story-inc/market-2.jpg',
    question: 'Who is the villain?',
    outcomes: [
      { label: 'Returning character', pct: 49 },
      { label: 'New character', pct: 51 },
    ],
    closes: '12.23.26',
    volume: '$31.6k vol',
    traders: '1.8k',
  },
  {
    image: '/preview/story-inc/market-3.jpg',
    question: 'Global box office opening weekend?',
    outcomes: [
      { label: 'Under $80 million', pct: 15 },
      { label: '$80M–$95M', pct: 23 },
      { label: '$95M–$110M', pct: 28 },
      { label: '$110M+', pct: 34 },
    ],
    closes: '12.26.26',
    volume: '$92.1k vol',
    traders: '4.1k',
  },
] as const;

export const REWARDS = [
  {
    id: 'premiere',
    title: 'Movie premiere',
    body: 'Two tickets to the opening-night premiere for top predictors — red carpet energy, credited as a Story Inc win.',
    status: 'Open' as const,
    hero: true,
    color: '#0f1a2e',
    caption: 'Premiere night · 2 tickets',
    cta: 'Unlock with a win',
  },
  {
    id: 'bts',
    title: 'Behind-the-scenes digital access',
    body: 'Animation breakdowns, voice-booth clips, and desk notes from the cut.',
    status: 'Open' as const,
    hero: false,
    color: '#12324a',
    caption: 'BTS digital access',
    cta: 'View reward',
  },
  {
    id: 'merch',
    title: 'Merchandise',
    body: 'Limited-edition gear for true fans — drops unlocked as markets resolve.',
    status: 'Open' as const,
    hero: false,
    color: '#c43c2c',
    caption: 'Limited merch drop',
    cta: 'View reward',
  },
  {
    id: 'set-visit',
    title: 'Set visit — Hello Darkness',
    body: 'A day on set for a winning fan cohort — already granted from a filmmaker desk.',
    status: 'Granted' as const,
    hero: false,
    color: '#2a2118',
    caption: 'Set visit · Hello Darkness',
    cta: 'See story',
  },
] as const;

export const TRAILERS = [
  {
    title: 'Official Teaser',
    meta: 'Released · Paramount',
    status: 'Watch',
    thumb: '/preview/story-inc/trailer-poster.png',
    locked: false,
  },
  {
    title: 'Fan-share invite',
    meta: 'Filmmakers invite trusted fans to share Trailer 2 early',
    status: 'Request access',
    thumb: '/preview/story-inc/market-1.jpg',
    locked: false,
  },
  {
    title: 'Holiday spot',
    meta: 'Unlock with Follow + one correct prediction',
    status: 'Locked',
    thumb: '/preview/story-inc/hero.jpg',
    locked: true,
  },
] as const;

export const COMMENTS = [
  {
    place: 'Mumbai',
    handle: '@filmwatcher87',
    initials: 'FW',
    avatarColor: '#00a6ff',
    time: '2h ago',
    badge: null as string | null,
    body: "my kids saw the teaser once and won't stop quoting it, so Paramount already won",
  },
  {
    place: 'Los Angeles',
    handle: '@falexsmith',
    initials: 'FS',
    avatarColor: '#e85d04',
    time: '4h ago',
    badge: 'Holding YES @ 58¢',
    body: 'holiday release, family audience, MrBeast in the cast… this is gonna make SO much money',
  },
  {
    place: 'Toronto',
    handle: '@nestwatcher',
    initials: 'NW',
    avatarColor: '#2a9d8f',
    time: '7h ago',
    badge: null,
    body: 'Red as a dad is the joke and the heart. If the villain market tips new character, I’m loading that.',
  },
] as const;

export const TEAM = [
  {
    name: 'Jason Sudeikis',
    image: '/preview/story-inc/team/sudeikis.jpg',
  },
  {
    name: 'Josh Gad',
    image: '/preview/story-inc/team/gad.jpg',
  },
  {
    name: 'Danny McBride',
    image: '/preview/story-inc/team/mcbride.jpg',
  },
  {
    name: 'Rachel Bloom',
    image: '/preview/story-inc/team/bloom.jpg',
  },
  {
    name: 'Mr. Beast',
    image: '/preview/story-inc/team/mrbeast.png',
  },
] as const;

export const NAV = ['Markets', 'How it works', 'Mission', 'Rewards'] as const;

export const SUMMARY =
  "Red has saved Bird Island more than once — but this holiday season he faces his greatest challenge yet: fatherhood. Now raising a family of three, the world's angriest bird has to survive diaper duty, sugar-fueled chaos, and the particular humiliation of unimpressed kids… all while the world still needs saving. With Chuck, Bomb, and Silver back in the flock — and proving to be questionable babysitters — Red's biggest adventure is the one happening at home. In theaters December 23.";

export const FAN_COUNT = 84200;

/** Filmmaker updates — visible when Following the project. */
export const CREW_UPDATES = [
  {
    from: 'John Rice',
    role: 'Director',
    time: 'Yesterday',
    body: 'Just locked a new cut of the holiday spot. Followers get first look next week — keep an eye on your notifications.',
  },
  {
    from: 'Story Inc Desk',
    role: 'Updates',
    time: '3d ago',
    body: 'Voice booth day with the hatchlings. Clips dropping for Followers only before they hit social.',
  },
] as const;

/** Platform-level Projects index copy (not project-page specific). */
export const PROJECTS_PAGE_LEAD =
  'Follow your favorite projects, unlock special perks, discuss with your friends, get early notifications and updates from the filmmaker.';

/** Mock grid — layout matches app.storyincmedia.com/projects. */
export const PROJECTS_INDEX = [
  {
    href: '/preview/story-inc/v1',
    title: 'Angry Birds 3',
    image: '/preview/story-inc/hero.jpg',
  },
  {
    href: '/preview/story-inc/rolling-loud',
    title: 'Rolling Loud',
    image: '/preview/story-inc/rolling-loud/title-dark.jpg',
  },
  {
    href: null,
    title: 'A Knight of Seven Kingdoms',
    image: '/preview/story-inc/market-2.jpg',
  },
  {
    href: null,
    title: 'American Hostage',
    image: '/preview/story-inc/team/mcbride.jpg',
  },
  {
    href: null,
    title: 'Avatar: Fire and Ash',
    image: '/preview/story-inc/market-3.jpg',
  },
  {
    href: null,
    title: 'Avengers: Doomsday',
    image: '/preview/story-inc/market-1.jpg',
  },
  {
    href: null,
    title: 'Cliffhanger',
    image: '/preview/story-inc/hero-banner.jpg',
  },
  {
    href: null,
    title: "Conan O'Brien Must Go: Season 3",
    image: '/preview/story-inc/trailer-poster.png',
  },
  {
    href: null,
    title: 'Dune: Part Three',
    image: '/preview/story-inc/market-2.jpg',
  },
] as const;
