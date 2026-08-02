import type { ProjectPageData } from '../project-types';

/**
 * Rolling Loud assets — mapped to client placement screenshots:
 * hero = Owen close-up · wife market = Owen stage · box office neon ·
 * cameo = Carti · Rife B&W · VMA · merch tee · lineup poster ·
 * shout-outs = Owen stage / Matt / Travis · VIP = concert crowd.
 */
const A = '/preview/story-inc/rolling-loud';
const img = {
  heroTrailer: `${A}/hero-trailer.png`,
  owenStage: `${A}/market-owen-wife.png`,
  owenClose: `${A}/hero-trailer.png`,
  carti: `${A}/market-carti.png`,
  /** Face-cropped for wide market media (source is a tall portrait). */
  cartiFace: `${A}/market-carti-face.jpg`,
  boxOffice: `${A}/market-box-office.png`,
  rife: `${A}/market-rife.png`,
  rifeLive: `${A}/shout-matt-rife.png`,
  vma: `${A}/market-vma.png`,
  merch: `${A}/reward-merch.png`,
  merchLips: `${A}/reward-merch-lips.png`,
  poster: `${A}/reward-poster.png`,
  shoutOwen: `${A}/shout-owen-stage.png`,
  shoutRife: `${A}/shout-matt-rife.png`,
  shoutTravis: `${A}/shout-travis.png`,
  festivalVip: `${A}/reward-festival-vip.png`,
  crowd: `${A}/reward-crowd.png`,
  titleDark: `${A}/title-dark.png`,
} as const;

/** Rolling Loud — Story Inc client comp from partner HTML brief. */
export const ROLLING_LOUD: ProjectPageData = {
  slug: 'rolling-loud',
  title: 'Rolling Loud',
  kick: 'In theaters October 2',
  castLine: [
    'Owen Wilson',
    'Matt Rife',
    'Travis Scott',
    'Sexyy Red',
    'Henry Winkler',
    'Christian Convery',
    'Christine Ko',
  ],
  credits:
    'Written and directed by Jeremy Garelick · Produced by Live Nation Studios and American High · A Ketchup Entertainment release',
  story: [
    "An overprotective dad tries to connect with his 13-year-old by sneaking him into Rolling Loud, the world's biggest hip-hop festival. It sets off a chaotic adventure with his reckless co-worker and an eccentric festival volunteer as they navigate wild crowds, security, and their own family dynamics.",
    'Owen Wilson, Matt Rife, and Travis Scott lead a cast that includes Sexyy Red, Henry Winkler, Christian Convery, and Christine Ko, with Ski Mask the Slump God and Ty Dolla $ign along for the ride. Written and directed by Jeremy Garelick — who took his own teenager to Rolling Loud first — and shot on location during Rolling Loud Miami, with real crowds and artists playing themselves. Inspired by a true story. In theaters October 2.',
  ],
  followLine:
    'Follow this page for VIP access, early notifications, and reward drops from the filmmakers.',
  jumpTiles: [
    { label: 'Rewards', sub: '{rewards} live drops', href: '#rewards' },
    { label: 'Markets', sub: '{markets} live now', href: '#markets' },
    { label: 'Trailers', sub: 'Watch & share', href: '#trailers' },
    { label: 'Follow page', sub: 'VIP + notifications', href: '#notify' },
  ],
  // Official trailer — https://www.youtube.com/watch?v=4lE0FY7a6rA
  youtubeId: '4lE0FY7a6rA',
  heroPoster: img.heroTrailer,
  teaserLabel: 'Official trailer',
  fanCount: 28419,
  rewardGroups: [
    {
      heading: 'Redeem with Story Cash',
      rewards: [
        {
          id: 'bts',
          caption: '',
          status: 'Open now',
          title: 'Behind the scenes',
          body: 'Uncut festival footage, cut scenes, and desk notes from the edit.',
          color: '#000000',
          price: '750 SC',
          priceHint: 'Redeem',
        },
        {
          id: 'soundtrack',
          caption: '',
          status: 'Open now',
          title: 'Soundtrack early listen',
          body: 'Hear it before it drops anywhere else.',
          color: '#000000',
          price: '1,000 SC',
          priceHint: 'Redeem',
        },
        {
          id: 'merch',
          caption: 'Limited merch drop',
          status: 'Open now',
          title: 'Film × festival merch',
          body: 'Limited co-branded gear. New drops unlock as markets resolve.',
          color: '#c43c2c',
          image: img.merch,
          price: '1,500 SC',
          priceHint: 'Redeem',
        },
        {
          id: 'poster',
          caption: 'Signed one-sheet',
          status: 'Open now',
          title: 'Signed lineup poster',
          body: 'The one-sheet, signed by the musicians in the film. Limited run.',
          color: '#2a2118',
          image: img.poster,
          price: '3,000 SC',
          priceHint: 'Redeem',
        },
      ],
    },
    {
      heading: 'Weekly drawings',
      rewards: [
        {
          id: 'shout-owen',
          caption: '',
          status: 'Weekly drawing',
          title: 'Shout-out — Owen Wilson',
          body: 'A personal video message. Yours to keep, yours to post.',
          color: '#000000',
          price: 'Free entry',
          priceHint: 'Drawing',
        },
        {
          id: 'shout-rife',
          caption: 'Personal video message',
          status: 'Weekly drawing',
          title: 'Shout-out — Matt Rife',
          body: 'A personal video message. Roast optional, not guaranteed.',
          color: '#1e2a3a',
          image: img.shoutRife,
          price: 'Free entry',
          priceHint: 'Drawing',
        },
        {
          id: 'shout-travis',
          caption: 'Personal video message',
          status: 'Weekly drawing',
          title: 'Shout-out — Travis Scott',
          body: 'A personal video message from the artist playing himself.',
          color: '#241820',
          image: img.shoutTravis,
          price: 'Free entry',
          priceHint: 'Drawing',
        },
        {
          id: 'campus-vip',
          caption: '',
          status: 'Campus drawing',
          title: 'Local venue tickets',
          body: "Two tickets to a Live Nation show near your school. Students at that week's tour stop only.",
          color: '#000000',
          price: 'Free entry',
          priceHint: 'Campus only',
        },
      ],
    },
    {
      heading: 'Grand drawings',
      rewards: [
        {
          id: 'premiere',
          caption: '',
          status: 'Grand drawing',
          title: 'LA premiere + afterparty',
          body: 'Two tickets to opening night. Red carpet, screening, afterparty.',
          color: '#000000',
          price: 'Free entry',
          priceHint: 'Grand drawing',
        },
        {
          id: 'festival-vip',
          caption: 'Festival passes · 2 VIP',
          status: 'Grand drawing',
          title: 'VIP — next Rolling Loud',
          body: 'Two VIP festival passes. The real thing, not the movie version.',
          color: '#1a2838',
          image: img.festivalVip,
          price: 'Free entry',
          priceHint: 'Grand drawing',
        },
        {
          id: 'travis-show',
          caption: '',
          status: 'Grand drawing',
          title: 'VIP — next Travis Scott show',
          body: 'Two VIP tickets to an upcoming Live Nation date.',
          color: '#000000',
          price: 'Free entry',
          priceHint: 'Grand drawing',
        },
        {
          id: 'rife-live',
          caption: '',
          status: 'Grand drawing',
          title: 'VIP + backstage — Matt Rife',
          body: 'Two VIP seats and a meet-and-greet at an upcoming stand-up date.',
          color: '#000000',
          price: 'Free entry',
          priceHint: 'Grand drawing',
        },
      ],
    },
  ],
  markets: [
    {
      image: img.owenStage,
      question:
        'Does Owen Wilson get caught by his wife for sneaking his son into the festival?',
      outcomes: [
        { label: 'Yes', pct: 63 },
        { label: 'No', pct: 37 },
      ],
      volume: '$88.9k vol',
      traders: '5.4k',
      closes: '10.2.26',
    },
    {
      image: img.cartiFace,
      imagePosition: 'center',
      question: 'Which artists cameo in the film?',
      outcomes: [
        { label: 'Playboi Carti', pct: 71 },
        { label: 'Ski Mask the Slump God', pct: 58 },
        { label: 'Other', pct: 40 },
        { label: 'Other 2', pct: 30 },
      ],
      volume: '$103.2k vol',
      traders: '6.7k',
      closes: '9.29.26',
    },
    {
      image: img.boxOffice,
      question: 'Domestic box office opening weekend?',
      outcomes: [
        { label: 'Under $12M', pct: 14 },
        { label: '$12M–$17.9M', pct: 31 },
        { label: '$18M+', pct: 25 },
      ],
      volume: '$61.4k vol',
      traders: '3.2k',
      closes: '10.1.26',
    },
    {
      image: img.rife,
      question: "Does Rife's character get them thrown out of the festival?",
      outcomes: [
        { label: 'Yes', pct: 68 },
        { label: 'No', pct: 32 },
      ],
      volume: '$71.8k vol',
      traders: '4.6k',
      closes: '10.2.26',
    },
    {
      question: 'Domestic box office 30 days from opening?',
      outcomes: [
        { label: 'Under $35M', pct: 22 },
        { label: '$35M–$49.9M', pct: 28 },
        { label: '$50M+', pct: 20 },
      ],
      volume: '$44.8k vol',
      traders: '2.1k',
      closes: '11.1.26',
    },
    {
      question: 'Will a cast member show up at the Auburn campus stop?',
      outcomes: [
        { label: 'Yes', pct: 44 },
        { label: 'No', pct: 56 },
      ],
      volume: '$39.2k vol',
      traders: '2.7k',
      closes: 'in 3 days',
    },
    {
      question: 'How many artists appear in Trailer 2?',
      outcomes: [
        { label: 'Under 3', pct: 19 },
        { label: '3–4', pct: 38 },
        { label: '5+', pct: 25 },
      ],
      volume: '$47.5k vol',
      traders: '3.9k',
      closes: 'in 6 days',
    },
    {
      question: 'Opening weekend rank against Digger and Verity?',
      outcomes: [
        { label: '1st', pct: 18 },
        { label: '2nd', pct: 41 },
        { label: '3rd+', pct: 22 },
      ],
      volume: '$52.7k vol',
      traders: '2.8k',
      closes: '10.1.26',
    },
    {
      image: img.vma,
      imagePosition: 'center',
      question: 'Will Travis Scott or Sexyy Red perform at the VMAs?',
      outcomes: [
        { label: 'Yes', pct: 61 },
        { label: 'No', pct: 39 },
      ],
      volume: '$41.6k vol',
      traders: '4.1k',
      closes: 'Resolves that night',
    },
    {
      question: 'How many named artists appear on screen?',
      outcomes: [
        { label: 'Under 3', pct: 9 },
        { label: '5–6', pct: 34 },
        { label: '7+', pct: 28 },
      ],
      volume: '$37.5k vol',
      traders: '1.9k',
      closes: '10.2.26',
    },
    {
      question: 'Who has more screen time — Wilson or Rife?',
      outcomes: [
        { label: 'Owen Wilson', pct: 72 },
        { label: 'Matt Rife', pct: 28 },
      ],
      volume: '$33.7k vol',
      traders: '1.7k',
      closes: '10.2.26',
    },
    {
      question: 'Popcornmeter score one week after release?',
      outcomes: [
        { label: 'Under 60%', pct: 16 },
        { label: '70%–79%', pct: 29 },
        { label: '80%+', pct: 24 },
      ],
      volume: '$40.1k vol',
      traders: '2.3k',
      closes: '10.9.26',
    },
    {
      question: 'Is there a post-credits scene?',
      outcomes: [
        { label: 'Yes', pct: 57 },
        { label: 'No', pct: 43 },
      ],
      volume: '$29.3k vol',
      traders: '1.4k',
      closes: '10.2.26',
    },
    {
      question: 'Will a surprise artist be revealed at the LA premiere?',
      outcomes: [
        { label: 'Yes', pct: 49 },
        { label: 'No', pct: 51 },
      ],
      volume: '$25.6k vol',
      traders: '1.1k',
      closes: '9.30.26',
    },
    {
      question: 'Which campus gets announced as the next tour stop?',
      outcomes: [
        { label: 'University of Miami', pct: 36 },
        { label: 'Ole Miss', pct: 24 },
        { label: 'Other', pct: 20 },
      ],
      volume: '$28.4k vol',
      traders: '1.8k',
      closes: 'in 2 days',
    },
    {
      question: 'Will Matt Rife announce new tour dates during the press run?',
      outcomes: [
        { label: 'Yes', pct: 54 },
        { label: 'No', pct: 46 },
      ],
      volume: '$21.4k vol',
      traders: '0.9k',
      closes: '10.5.26',
    },
  ],
  comments: [
    {
      handle: '@taxstub',
      place: 'Atlanta',
      time: '2h ago',
      initials: 'TS',
      avatarColor: '#1a86f0',
      body: 'they shot this during an actual set. if the crowd footage is real crowd footage this is already better than every festival movie ever made',
    },
    {
      handle: '@lowmids',
      place: 'Los Angeles',
      time: '5h ago',
      initials: 'LM',
      avatarColor: '#0c63c4',
      badge: 'Holding YES @ 63¢',
      body: "the wife finds out. it's the trailer beat, it's the poster, it's the whole third act. easiest yes on the board",
    },
    {
      handle: '@rowdybus',
      place: 'Miami',
      time: '9h ago',
      initials: 'RB',
      avatarColor: '#c43c2c',
      body: "cameo market is the only one that matters. if Carti shows up for more than four seconds I'm cashing out and buying the vinyl",
    },
    {
      handle: '@hittheroof',
      place: 'Chicago',
      time: '14h ago',
      initials: 'HT',
      avatarColor: '#2a2118',
      body: "Owen Wilson at Rolling Loud shouldn't work and that's exactly why it's going to. betting the over on opening weekend",
    },
  ],
  trailers: [
    {
      title: 'Official teaser',
      meta: 'Released',
      status: 'Watch',
      thumb: img.heroTrailer,
    },
    {
      title: 'Fan-share invite',
      meta: 'Filmmakers invite trusted fans to share Trailer 2 early',
      status: 'Request access',
      thumb: img.owenClose,
    },
  ],
  hasTickets: true,
  ticketsBody:
    'Opening weekend holds. Followers get first access when inventory opens — Oct 2, 2,000+ screens.',
  studio: 'Live Nation Studios × American High',
  filmmakerBody:
    'Written and directed by Jeremy Garelick, based on his own experience taking his teenager to Rolling Loud. Produced by Live Nation Studios and American High in collaboration with Rolling Loud. Released by Ketchup Entertainment. Shot on location during Rolling Loud Miami.',
  team: [
    {
      name: 'Owen Wilson',
      image: '/preview/story-inc/team/rolling-loud/owen-wilson.jpg',
    },
    {
      name: 'Matt Rife',
      image: '/preview/story-inc/team/rolling-loud/matt-rife.jpg',
    },
    {
      name: 'Travis Scott',
      image: '/preview/story-inc/team/rolling-loud/travis-scott.jpg',
    },
    {
      name: 'Sexyy Red',
      image: '/preview/story-inc/team/rolling-loud/sexyy-red.jpg',
    },
    {
      name: 'Henry Winkler',
      image: '/preview/story-inc/team/rolling-loud/henry-winkler.jpg',
    },
    {
      name: 'Christian Convery',
      image: '/preview/story-inc/team/rolling-loud/christian-convery.jpg',
    },
    {
      name: 'Christine Ko',
      image: '/preview/story-inc/team/rolling-loud/christine-ko.jpg',
    },
  ],
  notifyBody:
    "Trailer invites, ticket windows, reward drops, campus stops. Follow this project and we'll keep you in the loop.",
  updates: [
    {
      from: 'Jeremy Garelick',
      role: 'Director',
      time: 'Yesterday',
      body: 'We shot the third act in a real crowd with no second takes. Followers get the raw cut of that sequence next week — watch your notifications.',
    },
    {
      from: 'Story Inc Desk',
      role: 'Updates',
      time: '3d ago',
      body: "Cast list isn't locked publicly yet. The cameo market closes the moment it is — get your picks in before the announcement.",
    },
    {
      from: 'Story Inc Desk',
      role: 'Updates',
      time: '6d ago',
      body: 'Campus tour kicks off at Auburn. Predict your stop, win front-of-line.',
    },
  ],
  footerNote:
    'Concept comp for partner discussion. Market odds, volumes, and Story Cash prices shown here are illustrative placeholders, not real data. Story Inc. is an independent entity and is not endorsed by or affiliated with any individual or entity depicted, unless expressly indicated.',
};
