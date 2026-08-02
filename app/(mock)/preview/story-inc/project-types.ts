/** Shared shape for Story Inc client project comps (Angry Birds template). */

export type ProjectReward = {
  id: string;
  title: string;
  body: string;
  caption: string;
  status: string;
  color: string;
  /** Optional photo — falls back to color placeholder. */
  image?: string;
  /** e.g. "750 SC" or "Free entry" */
  price?: string;
  /** e.g. "Redeem" / "Drawing" */
  priceHint?: string;
};

export type ProjectRewardGroup = {
  heading: string;
  rewards: ProjectReward[];
};

export type ProjectMarket = {
  question: string;
  outcomes: { label: string; pct: number }[];
  closes: string;
  volume: string;
  traders: string;
  /** Omit for a plain black media area (no matched asset yet). */
  image?: string;
  /** Crop anchor for the hero image. Default top (faces). */
  imagePosition?: 'top' | 'center';
};

export type ProjectComment = {
  handle: string;
  place: string;
  time: string;
  body: string;
  initials: string;
  avatarColor: string;
  badge?: string;
};

export type ProjectTrailer = {
  title: string;
  meta: string;
  status: string;
  thumb: string;
  locked?: boolean;
};

export type ProjectTeamMember = {
  name: string;
  image?: string;
};

export type ProjectUpdate = {
  from: string;
  role: string;
  time: string;
  body: string;
};

export type ProjectJumpTile = {
  label: string;
  sub: string;
  href: string;
};

export type ProjectPageData = {
  slug: string;
  title: string;
  kick: string;
  castLine: string[];
  credits: string;
  story: string[];
  followLine: string;
  jumpTiles: ProjectJumpTile[];
  heroPoster?: string;
  teaserLabel?: string;
  /** YouTube video id for hero trailer play. */
  youtubeId?: string;
  fanCount: number;
  rewardGroups: ProjectRewardGroup[];
  markets: ProjectMarket[];
  comments: ProjectComment[];
  trailers: ProjectTrailer[];
  hasTickets: boolean;
  ticketsBody: string;
  studio: string;
  filmmakerBody: string;
  team: ProjectTeamMember[];
  notifyBody: string;
  updates: ProjectUpdate[];
  footerNote?: string;
};
