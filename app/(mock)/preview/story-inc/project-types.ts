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
  /** Crop anchor for the photo. Default center (faces). */
  imagePosition?: 'top' | 'center';
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
  /** Crop anchor for the hero image. Default center (faces). */
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
  /** Optional hero h1 lines (line break between). Falls back to `title`. */
  titleLines?: string[];
  /** Optional line under the hero title (e.g. film question / tagline). */
  tagline?: string;
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
  /** External trailer URL (e.g. Frame.io) — opens on play when set. */
  trailerUrl?: string;
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
