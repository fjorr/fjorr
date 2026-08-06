/** Curated Hall of Wins — aspirational redemptions for Rewards + Home rails. */

export type HallOfWin = {
  id: string;
  /** Cool hero line — project name lives in the Project label, not here. */
  reward: string;
  winner: string;
  place: string;
  project: string;
  /** Project page path when available. */
  projectHref?: string;
  image: string;
  /** CSS object-position — focus faces / subjects in wide stills. */
  imagePosition?: string;
  /** Zoom on desktop so vertical crops have room (landscape in landscape). */
  imageScale?: number;
};

/** Two desk picks — set visit + festival VIP. */
export const HALL_OF_WINS: HallOfWin[] = [
  {
    id: 'hello-darkness-set',
    reward: 'Sent two fans to the set of Hello Darkness.',
    winner: 'Maya & Jordan',
    place: 'Los Angeles',
    project: 'Hello Darkness',
    projectHref: '/preview/story-inc/hello-darkness',
    image: '/preview/story-inc/hello-darkness/set-visit-win.jpg',
    imagePosition: '55% 35%',
  },
  {
    id: 'rolling-loud-vip',
    reward: 'Flew two predictors to Rolling Loud — VIP.',
    winner: 'Sam & Riley',
    place: 'Miami',
    project: 'Rolling Loud',
    projectHref: '/preview/story-inc/rolling-loud',
    image: '/preview/story-inc/rolling-loud/market-owen-wife.png',
    imagePosition: '50% 18%',
  },
];
