import type { ProjectPageData } from '../project-types';

const A = '/preview/story-inc/angry-birds';
const img = {
  hero: '/preview/story-inc/trailer-poster.png',
  marketBeast: `${A}/market-mrbeast.png`,
  marketVillain: `${A}/market-villain.png`,
  marketBox: `${A}/market-box-office.png`,
  rewardBts: `${A}/reward-bts.png`,
  rewardPremiere: `${A}/reward-premiere.png`,
  rewardMerch: `${A}/reward-merch.png`,
  rewardShoutout: `${A}/reward-shoutout.png`,
} as const;

/** Angry Birds 3 — Story Inc client comp on the shared Rolling Loud template. */
export const ANGRY_BIRDS: ProjectPageData = {
  slug: 'angry-birds',
  title: 'Angry Birds 3',
  kick: 'In theaters December 20',
  castLine: [
    'Jason Sudeikis',
    'Josh Gad',
    'Danny McBride',
    'Rachel Bloom',
    'Mr. Beast',
  ],
  credits:
    'Directed by John Rice · Written for the screen by Thurop Van Orman · Produced by Paramount Pictures, Rovio, and SEGA',
  story: [
    "Red has saved Bird Island more than once — but this holiday season he faces his greatest challenge yet: fatherhood. Now raising a family of three, the world's angriest bird has to survive diaper duty, sugar-fueled chaos, and the particular humiliation of unimpressed kids… all while the world still needs saving.",
    "With Chuck, Bomb, and Silver back in the flock — and proving to be questionable babysitters — Red's biggest adventure is the one happening at home. In theaters December 20.",
  ],
  followLine:
    'Follow this page for VIP access, early notifications, and reward drops from the filmmakers.',
  jumpTiles: [
    { label: 'Rewards', sub: '{rewards} live drops', href: '#rewards' },
    { label: 'Markets', sub: '{markets} live now', href: '#markets' },
    { label: 'Trailers', sub: 'Watch & share', href: '#trailers' },
    { label: 'Follow page', sub: 'VIP + notifications', href: '#notify' },
  ],
  // Official trailer — https://www.youtube.com/watch?v=a9DB_aUMzME
  youtubeId: 'a9DB_aUMzME',
  heroPoster: img.hero,
  teaserLabel: 'Official trailer',
  fanCount: 84200,
  rewardGroups: [
    {
      heading: 'Rewards',
      rewards: [
        {
          id: 'bts',
          caption: '',
          status: 'Open now',
          title: 'Behind-the-scenes digital access',
          body: 'Exclusive looks at how each story comes to life.',
          color: '#12324a',
          image: img.rewardBts,
          imagePosition: 'center',
        },
        {
          id: 'premiere',
          caption: '',
          status: 'Open now',
          title: 'Movie premiere',
          body: 'Two tickets to the opening night movie premiere.',
          color: '#0f1a2e',
          image: img.rewardPremiere,
          imagePosition: 'center',
        },
        {
          id: 'merch',
          caption: '',
          status: 'Open now',
          title: 'Merchandise',
          body: 'Limited-edition gear for true fans.',
          color: '#c43c2c',
          image: img.rewardMerch,
          imagePosition: 'center',
        },
        {
          id: 'shoutout',
          caption: '',
          status: 'Open now',
          title: 'Virtual shout out from Marcello Hernandez',
          body: 'A personal video shout out from Marcello Hernandez.',
          color: '#3d2a5c',
          image: img.rewardShoutout,
          imagePosition: 'center',
        },
      ],
    },
  ],
  markets: [
    {
      image: img.marketBeast,
      question: 'Mr. Beast in the next trailer?',
      outcomes: [
        { label: 'Yes', pct: 55 },
        { label: 'No', pct: 45 },
      ],
      volume: '$48.2k vol',
      traders: '2.4k',
      closes: '12.20.26',
    },
    {
      image: img.marketVillain,
      question: 'Who is the villain?',
      outcomes: [
        { label: 'Returning character', pct: 49 },
        { label: 'New character', pct: 51 },
      ],
      volume: '$31.6k vol',
      traders: '1.8k',
      closes: '12.20.26',
    },
    {
      image: img.marketBox,
      question: 'Global box office opening weekend?',
      outcomes: [
        { label: 'Under $80 million', pct: 15 },
        { label: '$80M–$95M', pct: 23 },
        { label: '$95M–$110M', pct: 28 },
        { label: '$110M+', pct: 34 },
      ],
      volume: '$92.1k vol',
      traders: '4.1k',
      closes: '12.23.26',
    },
  ],
  comments: [
    {
      handle: '@filmwatcher87',
      place: 'Mumbai',
      time: '2h ago',
      initials: 'FW',
      avatarColor: '#00A6FF',
      body: "my kids saw the teaser once and won't stop quoting it, so Paramount already won",
    },
    {
      handle: '@lilmsmith',
      place: 'Los Angeles',
      time: '4h ago',
      initials: 'LS',
      avatarColor: '#e85d04',
      badge: 'Holding VR3 (1.5k)',
      body: 'holiday release, family audience, MrBeast in the cast… this is gonna make SO much money',
    },
    {
      handle: '@nestwatcher',
      place: 'Toronto',
      time: '7h ago',
      initials: 'NW',
      avatarColor: '#2a9d8f',
      body: 'Red as a dad is the joke and the heart. If the villain market tips new character, I’m loading that.',
    },
  ],
  trailers: [
    {
      title: 'Official trailer',
      meta: 'Released · Paramount',
      status: 'Watch',
      thumb: img.hero,
    },
    {
      title: 'Fan-share invite',
      meta: 'Filmmakers invite trusted fans to share Trailer 2 early',
      status: 'Request access',
      thumb: img.marketBeast,
    },
  ],
  hasTickets: true,
  ticketsBody:
    'Opening weekend holds. Followers get first access when inventory opens — Dec 20.',
  studio: 'Paramount × Rovio',
  filmmakerBody:
    'Produced by Paramount Pictures, Rovio, and SEGA. Directed by John Rice — co-director of The Angry Birds Movie 2. Written for the screen by Thurop Van Orman. In theaters December 20.',
  team: [
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
  ],
  notifyBody:
    'Trailer invites, ticket windows, reward drops, holiday spots. Follow this project and we’ll keep you in the loop.',
  updates: [
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
    {
      from: 'Story Inc Desk',
      role: 'Updates',
      time: '6d ago',
      body: 'Mr. Beast trailer market is live. Get your pick in before the next cut drops.',
    },
  ],
  footerNote:
    'Concept comp for partner discussion. Market odds, volumes, and Story Cash prices shown here are illustrative placeholders, not real data. Story Inc. is an independent entity and is not endorsed by or affiliated with any individual or entity depicted, unless expressly indicated.',
};
