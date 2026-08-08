import type { Metadata } from 'next';
import Link from 'next/link';
import HallOfWinsRail from '../HallOfWinsRail';

export const metadata: Metadata = {
  title: 'Rewards — Hall of Wins placement',
  description:
    'Client comp: rebuild of app.storyincmedia.com/rewards with Hall of Wins replacing the gold-coin hero.',
};

const NAV = [
  { label: 'Markets', href: null as string | null },
  { label: 'Rewards', href: '/preview/story-inc/rewards', active: true },
  { label: 'About', href: null },
  { label: 'Filmmakers', href: null },
  { label: 'Resources', href: null },
] as const;

/** Catalog samples — enough to feel like the live redeem grid. */
const REWARDS = [
  {
    title: 'Movie Theater Concessions',
    body: 'Large popcorn and two large sodas—enjoyed the way they’re meant to be: at the movies.',
    price: '$25',
    image: '/preview/story-inc/market-1.jpg',
  },
  {
    title: '2 Tickets to the Big Screen',
    body: 'A night out with friends. Fandango gift card valid at theaters nationwide.',
    price: '$40',
    image: '/preview/story-inc/rolling-loud/reward-poster.png',
  },
  {
    title: 'Netflix for 3 Months',
    body: 'From prestige dramas to guilty-pleasure binges—queue up your next obsession.',
    price: '$50',
    image: '/preview/story-inc/angry-birds/reward-bts.png',
  },
  {
    title: 'Uber Eats Watch Party For 2',
    body: 'Dinner for two to watch your favorite flick at home.',
    price: '$60',
    image: '/preview/story-inc/market-2.jpg',
  },
  {
    title: 'Apple TV for a Year',
    body: 'One year of award-winning originals that stay with you after the credits.',
    price: '$120',
    image: '/preview/story-inc/rolling-loud/reward-merch.png',
  },
  {
    title: '2 Tickets to Universal Studios',
    body: 'Big-screen worlds, iconic rides, and behind-the-scenes magic in Los Angeles.',
    price: '$250',
    image: '/preview/story-inc/rolling-loud/reward-festival-vip.png',
  },
] as const;

const COMING_SOON = [
  {
    title: 'Visit the Set',
    body: 'Get up close — a behind-the-scenes visit to the set.',
    image: '/preview/story-inc/hello-darkness/set-visit.jpg',
  },
  {
    title: 'Join the Movie Premiere',
    body: 'Join the cast and crew for opening night.',
    image: '/preview/story-inc/hello-darkness/screening.jpg',
  },
  {
    title: 'Signed Movie Posters & Scripts',
    body: 'A true keepsake for the project you’ve helped support.',
    image: '/preview/story-inc/rolling-loud/reward-poster.png',
  },
] as const;

/**
 * Client placement comp — rebuild of live /rewards with Hall of Wins in the
 * hero slot (replacing the oversized Story Cash coin).
 * Live reference: https://app.storyincmedia.com/rewards
 */
export default function StoryIncRewardsPage() {
  return (
    <div
      className="min-h-screen bg-white text-[#1d1d1f]"
      style={{ fontFamily: 'Montserrat, Arial, sans-serif' }}
    >
      <header className="border-b border-black/[0.06]">
        <div className="mx-auto flex h-[56px] max-w-[1120px] items-center justify-between gap-4 px-5">
          <Link href="/preview/story-inc/projects" className="shrink-0">
            <img
              src="/preview/story-inc/logo.png"
              alt="Story Inc"
              className="h-7 w-auto sm:h-8"
            />
          </Link>
          <nav className="hidden items-center gap-5 text-[13px] font-medium text-[#1d1d1f]/75 md:flex">
            {NAV.map((item) =>
              item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  className={
                    'active' in item && item.active
                      ? 'border-b-2 border-[#1d1d1f] pb-0.5 text-[#1d1d1f]'
                      : 'transition-opacity hover:opacity-80'
                  }
                >
                  {item.label}
                </Link>
              ) : (
                <span key={item.label} className="cursor-default">
                  {item.label}
                </span>
              ),
            )}
          </nav>
          <div className="flex items-center gap-2 text-[12px] sm:gap-3">
            <span className="hidden rounded-full border border-[#00A6FF]/25 px-3 py-1.5 font-semibold text-[#00A6FF] sm:inline">
              Log in
            </span>
            <span className="rounded-full bg-[#00A6FF] px-3 py-1.5 font-semibold text-white">
              Join
            </span>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-[1120px] px-5 pb-4 pt-6 sm:pb-5 sm:pt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="min-w-0">
              <h1 className="m-0 text-[30px] font-bold leading-tight tracking-[-0.025em] text-[#1d1d1f] sm:text-[36px]">
                Redeem Rewards
              </h1>
              <p className="m-0 mt-1.5 max-w-[28rem] text-[13px] leading-snug text-[#6e6e73] sm:text-[14px]">
                This is where Story Cash becomes something real.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex shrink-0 items-center justify-center self-start rounded-full bg-[#00A6FF] px-4 py-2 text-[12px] font-semibold text-white sm:self-auto"
            >
              How to Earn Story Cash
            </button>
          </div>
        </section>

        <section className="pb-3 sm:pb-4">
          <HallOfWinsRail
            secondaryHref={undefined}
            secondaryLabel={undefined}
            ctaHref="/preview/story-inc/projects"
            ctaLabel="Predict to win"
          />
        </section>

        <section className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-4 px-5 pb-5 pt-5 sm:pb-6 sm:pt-6">
          <div className="flex items-center gap-3 rounded-xl bg-[#f5f5f7] px-3.5 py-2.5">
            <CoinMark size={32} />
            <div>
              <p className="m-0 text-[11px] font-medium text-[#86868b]">
                Story Cash balance
              </p>
              <p className="m-0 text-[20px] font-bold tabular-nums tracking-tight leading-none">
                $0.00
              </p>
            </div>
          </div>
          <p className="m-0 text-[13px] font-medium text-[#1d1d1f]/70">
            Story Cash Range:{' '}
            <button
              type="button"
              className="font-semibold text-[#00A6FF] underline-offset-2 hover:underline"
            >
              All
            </button>
          </p>
        </section>

        {/* Redeem grid */}
        <section className="mx-auto max-w-[1120px] px-5 pb-16">
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {REWARDS.map((r) => (
              <li
                key={r.title}
                className="flex flex-col overflow-hidden rounded-2xl bg-[#f5f5f7]"
              >
                <div className="aspect-[16/10] overflow-hidden bg-[#e8e8ed]">
                  <img
                    src={r.image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <h2 className="m-0 text-[17px] font-bold leading-snug tracking-[-0.01em]">
                    {r.title}
                  </h2>
                  <p className="m-0 flex-1 text-[13px] leading-relaxed text-[#6e6e73]">
                    {r.body}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-[14px] font-bold tabular-nums text-[#1d1d1f]">
                      {r.price}
                    </span>
                    <button
                      type="button"
                      disabled
                      className="rounded-full bg-[#d2d2d7] px-4 py-2 text-[12px] font-semibold text-[#6e6e73]"
                    >
                      Locked
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Coming soon — kept so the page still reads as the full rewards surface */}
        <section className="border-t border-black/[0.06] bg-[#fafafa] py-14 sm:py-16">
          <div className="mx-auto max-w-[1120px] px-5">
            <h2 className="m-0 text-center text-[28px] font-bold tracking-[-0.02em] sm:text-[32px]">
              Coming Soon
            </h2>
            <p className="mx-auto mt-2 max-w-md text-center text-[14px] text-[#6e6e73]">
              These rewards are being finalized. Stay tuned!
            </p>
            <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
              {COMING_SOON.map((r) => (
                <li
                  key={r.title}
                  className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-[#e8e8ed]">
                    <img
                      src={r.image}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="m-0 text-[16px] font-bold leading-snug">
                      {r.title}
                    </h3>
                    <p className="m-0 mt-2 text-[13px] leading-relaxed text-[#6e6e73]">
                      {r.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/[0.06] py-8">
        <p className="mx-auto max-w-[1120px] px-5 text-center text-[11px] leading-relaxed text-[#aeaeb2]">
          Concept comp for partner discussion. Layout mirrors{' '}
          <a
            href="https://app.storyincmedia.com/rewards"
            className="underline underline-offset-2 hover:text-[#6e6e73]"
          >
            app.storyincmedia.com/rewards
          </a>
          . Wins and prices shown are illustrative placeholders.
        </p>
      </footer>
    </div>
  );
}

/** Story Cash mark — size in px; keep ~32 next to balance, ~18 on CTAs. */
function CoinMark({ size = 20 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#e4b84a] font-black text-[#7a5410]"
      style={{
        width: size,
        height: size,
        fontSize: Math.max(9, Math.round(size * 0.38)),
      }}
    >
      S
    </span>
  );
}
