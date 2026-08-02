import type { Metadata } from 'next';
import FollowButton from '../FollowButton';
import MarketCard from '../MarketCard';
import RewardPlaceholder from '../RewardPlaceholder';
import TrailerHero from '../TrailerHero';
import VariantSwitch from '../VariantSwitch';
import {
  COMMENTS,
  CREW_UPDATES,
  FAN_COUNT,
  MARKETS,
  REWARDS,
  SUMMARY,
  TEAM,
  TRAILERS,
} from '../content';

export const metadata: Metadata = {
  title: 'Angry Birds 3',
  description:
    'Follow Angry Birds 3 on Story Inc — rewards, markets, and the project page.',
};

/**
 * v1 — client-revised Angry Birds project page.
 * Trailers+tickets bundled; markets card style; rewards compact (v2 size).
 *
 * Stage flags: hide trailers/tickets blocks when a project has no content yet.
 */
const HAS_TRAILERS = TRAILERS.length > 0;
const HAS_TICKETS = true; // flip false for in-development projects

export default function StoryIncApplePage() {
  return (
    <div
      id="top"
      className="min-h-screen scroll-smooth bg-white text-[#1d1d1f]"
      style={{ fontFamily: 'Montserrat, Arial, sans-serif' }}
    >
      <main>
        {/* Hero — title, then media + story before CTAs */}
        <section className="relative overflow-hidden bg-[#fbfbfd]">
          <div className="mx-auto max-w-[980px] px-5 pb-6 pt-12 text-center sm:pb-8 sm:pt-16">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#00a6ff]">
              In theaters December 23
            </p>
            <h1 className="mt-3 text-[40px] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[56px] md:text-[64px]">
              Angry Birds 3
            </h1>
          </div>

          <div className="mx-auto max-w-[980px] px-5">
            <div className="shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
              <TrailerHero />
            </div>
          </div>

          <div className="mx-auto max-w-[680px] px-5 pb-6 pt-12 text-center sm:pt-14">
            <h2 className="text-[28px] font-bold tracking-[-0.02em] sm:text-[32px]">
              The story
            </h2>
            <p className="mt-5 text-[17px] leading-[1.7] text-[#6e6e73] sm:text-[19px]">
              {SUMMARY}
            </p>
          </div>

          {/* CTAs after picture + story — horizontal, Follow = notifications */}
          <div
            id="hero-cta"
            className="mx-auto flex max-w-[980px] flex-col items-center gap-4 px-5 pb-16 pt-2"
          >
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="#rewards"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[#00a6ff] px-8 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(0,166,255,0.35)] hover:bg-[#0095e6]"
              >
                Explore rewards
              </a>
              <FollowButton
                initialCount={FAN_COUNT}
                size="md"
                secondary
              />
            </div>
            {HAS_TICKETS ? (
              <a
                href="#tickets"
                className="text-[14px] font-semibold text-[#00a6ff] hover:underline"
              >
                Pre-purchase tickets
              </a>
            ) : null}
          </div>
        </section>

        {/* Rewards — VIP framing; compact v2-style cards */}
        <section
          id="rewards"
          className="relative scroll-mt-[52px] overflow-hidden py-16 sm:py-20"
          style={{
            background:
              'linear-gradient(165deg, #0090e0 0%, #00a6ff 42%, #006bb3 100%)',
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 0%, rgba(255,255,255,0.45), transparent 45%), radial-gradient(circle at 90% 80%, rgba(0,0,0,0.18), transparent 40%)',
            }}
          />
          <div className="relative mx-auto max-w-[980px] px-5">
            <div className="text-center sm:text-left">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/80">
                VIP access you can only get here
              </p>
              <h2 className="mt-3 text-[28px] font-bold tracking-[-0.03em] text-white sm:text-[34px]">
                Rewards
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-[15px] text-white/80 sm:mx-0">
                Premiere seats, merch, and drops fans don&apos;t usually get —
                unlocked through markets on this project.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {REWARDS.map((r) => (
                <div
                  key={r.id}
                  className="overflow-hidden rounded-2xl bg-white shadow-[0_12px_40px_rgba(0,40,80,0.2)]"
                >
                  <RewardPlaceholder
                    color={r.color}
                    caption={r.caption}
                    className="aspect-[16/10] w-full"
                  />
                  <div className="p-4">
                    <div
                      className={`mb-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                        r.status === 'Granted'
                          ? 'bg-black/[0.06] text-[#666]'
                          : 'bg-[#00a6ff]/12 text-[#0077c8]'
                      }`}
                    >
                      {r.status === 'Granted' ? 'Granted' : 'Open now'}
                    </div>
                    <h3 className="text-[15px] font-bold tracking-[-0.02em] text-[#1d1d1f]">
                      {r.title}
                    </h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-[#6e6e73]">
                      {r.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Markets */}
        <section id="markets" className="scroll-mt-[52px] py-16 sm:py-20">
          <div className="mx-auto max-w-[980px] px-5">
            <div className="text-center sm:text-left">
              <div className="mb-2 inline-flex items-center gap-2 text-[12px] font-semibold text-[#00a6ff]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00a6ff] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00a6ff]" />
                </span>
                Markets are live
              </div>
              <h2 className="text-[28px] font-bold tracking-[-0.02em] sm:text-[32px]">
                Project Markets
              </h2>
              <p className="mt-2 text-[15px] text-[#6e6e73]">
                Predict what happens next. Earn Story Cash toward rewards.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MARKETS.map((m) => (
                <MarketCard
                  key={m.question}
                  image={m.image}
                  question={m.question}
                  outcomes={m.outcomes}
                  closes={m.closes}
                  volume={m.volume}
                  traders={m.traders}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Ideas — same name as markets page */}
        <section
          id="ideas"
          className="scroll-mt-[52px] bg-[#fbfbfd] py-16 sm:py-20"
        >
          <div className="mx-auto max-w-[680px] px-5">
            <h2 className="text-center text-[28px] font-bold tracking-[-0.02em] sm:text-[32px]">
              Ideas
            </h2>
            <p className="mt-2 text-center text-[15px] text-[#6e6e73]">
              What&apos;s your take on the markets?
            </p>

            <div className="mt-8 rounded-3xl bg-white p-5 sm:p-6">
              <div className="flex gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d2d2d7] text-[11px] font-bold text-white"
                  aria-hidden
                >
                  You
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    placeholder="Share an idea or market call…"
                    readOnly
                    className="h-12 w-full flex-1 rounded-2xl border-0 bg-[#fbfbfd] px-4 text-[15px] outline-none ring-1 ring-black/5 placeholder:text-[#aeaeb2] focus:ring-2 focus:ring-[#00a6ff]/40"
                  />
                  <button
                    type="button"
                    className="inline-flex h-12 items-center justify-center rounded-full bg-[#00a6ff] px-6 text-[14px] font-semibold text-white"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>

            <ul className="mt-4 space-y-3">
              {COMMENTS.map((c) => (
                <li
                  key={c.handle + c.time}
                  className="rounded-3xl bg-white px-5 py-5 sm:px-6"
                >
                  <div className="flex gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
                      style={{ backgroundColor: c.avatarColor }}
                      aria-hidden
                    >
                      {c.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="text-[13px] font-semibold text-[#1d1d1f]">
                          {c.handle}
                        </p>
                        <span className="text-[12px] text-[#86868b]">
                          {c.place} · {c.time}
                        </span>
                        {c.badge ? (
                          <span className="rounded-full bg-[#00a6ff]/10 px-2 py-0.5 text-[11px] font-semibold text-[#00a6ff]">
                            {c.badge}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1.5 text-[15px] leading-relaxed text-[#1d1d1f]">
                        {c.body}
                      </p>
                      <div className="mt-3 flex gap-4 text-[12px] font-semibold text-[#86868b]">
                        <button type="button" className="hover:text-[#1d1d1f]">
                          Reply
                        </button>
                        <button type="button" className="hover:text-[#1d1d1f]">
                          Like
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Trailers + tickets — bundled; hide empty stages */}
        {HAS_TRAILERS || HAS_TICKETS ? (
          <section id="tickets" className="scroll-mt-[52px] py-16 sm:py-20">
            <div className="mx-auto max-w-[980px] px-5">
              <h2 className="text-center text-[28px] font-bold tracking-[-0.02em] sm:text-[32px]">
                {HAS_TRAILERS && HAS_TICKETS
                  ? 'Trailers & tickets'
                  : HAS_TRAILERS
                    ? 'Trailers'
                    : 'Tickets'}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-center text-[15px] text-[#6e6e73]">
                Early shares and opening-weekend access for fans who Follow.
              </p>

              <div
                className={`mt-10 grid gap-4 ${
                  HAS_TRAILERS && HAS_TICKETS ? 'md:grid-cols-2' : ''
                }`}
              >
                {HAS_TRAILERS ? (
                  <div className="rounded-3xl bg-[#fbfbfd] p-6 sm:p-8">
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-[#00a6ff]">
                      Trailers
                    </p>
                    <h3 className="mt-2 text-[22px] font-bold tracking-[-0.02em]">
                      Watch & share
                    </h3>
                    <ul className="mt-6 space-y-4">
                      {TRAILERS.map((t) => (
                        <li
                          key={t.title}
                          className="flex items-center gap-3.5 border-b border-black/[0.06] pb-4 last:border-0 last:pb-0"
                        >
                          <button
                            type="button"
                            className="group relative aspect-video w-[88px] shrink-0 overflow-hidden rounded-xl bg-[#1d1d1f] sm:w-[104px]"
                            aria-label={`${t.status}: ${t.title}`}
                          >
                            <img
                              src={t.thumb}
                              alt=""
                              className={`h-full w-full object-cover transition duration-300 group-hover:scale-[1.03] ${
                                t.locked ? 'opacity-50 grayscale' : ''
                              }`}
                            />
                            <span className="absolute inset-0 bg-black/25" />
                            <span className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#1d1d1f] shadow-md">
                              {t.locked ? (
                                <svg
                                  viewBox="0 0 16 16"
                                  className="h-3.5 w-3.5"
                                  fill="currentColor"
                                  aria-hidden
                                >
                                  <path d="M8 1a3 3 0 0 0-3 3v2H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-1V4a3 3 0 0 0-3-3Zm1.5 5h-3V4a1.5 1.5 0 1 1 3 0v2Z" />
                                </svg>
                              ) : (
                                <span className="ml-0.5 text-[10px] leading-none">
                                  ▶
                                </span>
                              )}
                            </span>
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className="text-[15px] font-semibold">
                              {t.title}
                            </p>
                            <p className="mt-0.5 text-[13px] leading-snug text-[#6e6e73]">
                              {t.meta}
                            </p>
                            <p className="mt-1.5 text-[12px] font-semibold text-[#00a6ff]">
                              {t.status}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {HAS_TICKETS ? (
                  <div className="flex flex-col rounded-3xl bg-[#e8f4fc] p-6 ring-1 ring-[#00a6ff]/15 sm:p-8">
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-[#00a6ff]">
                      Tickets
                    </p>
                    <h3 className="mt-2 text-[22px] font-bold tracking-[-0.02em] text-[#1d1d1f]">
                      Pre-purchase
                    </h3>
                    <p className="mt-3 flex-1 text-[15px] leading-relaxed text-[#4a6578]">
                      Opening weekend holds. Followers get first access when
                      inventory opens.
                    </p>
                    <button
                      type="button"
                      className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[#00a6ff] text-[14px] font-semibold text-white hover:bg-[#0095e6]"
                    >
                      Pre-purchase tickets
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {/* Filmmakers left · Keep me posted right · Updates */}
        <section className="mx-auto max-w-[980px] px-5 pb-10">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="rounded-3xl bg-[#fbfbfd] p-7 sm:p-8 md:col-span-3">
              <h2 className="text-[22px] font-bold tracking-[-0.02em]">
                About the Filmmakers
              </h2>
              <p className="mt-1 text-[15px] font-semibold">Paramount × Rovio</p>
              <p className="mt-2 text-[14px] leading-relaxed text-[#6e6e73]">
                Directed by John Rice from a screenplay by Thurop Van Orman.
                Produced by Rovio and SEGA. A Paramount Pictures release.
              </p>
              <h3 className="mt-6 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#86868b]">
                Team
              </h3>
              <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
                {TEAM.map((member) => (
                  <li key={member.name} className="flex items-center gap-3">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="h-10 w-10 shrink-0 rounded-full object-cover object-top ring-1 ring-black/5"
                    />
                    <span className="text-[13px] font-semibold text-[#1d1d1f]">
                      {member.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div
              id="notify"
              className="scroll-mt-[52px] flex flex-col rounded-3xl bg-[#fbfbfd] p-7 sm:p-8 md:col-span-2"
            >
              <h2 className="text-[22px] font-bold tracking-[-0.02em]">
                Keep me posted
              </h2>
              <p className="mt-2 flex-1 text-[14px] leading-relaxed text-[#6e6e73]">
                Trailer invites, ticket windows, reward drops — Follow this
                project and we&apos;ll keep you in the loop.
              </p>
              <div className="mt-5">
                <FollowButton initialCount={FAN_COUNT} size="md" />
              </div>
            </div>
          </div>
        </section>

        {/* Updates from the crew — Followers */}
        <section
          id="updates"
          className="scroll-mt-[52px] border-t border-black/[0.06] py-14 sm:py-16"
        >
          <div className="mx-auto max-w-[680px] px-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#00a6ff]">
                  Followers only
                </p>
                <h2 className="mt-2 text-[28px] font-bold tracking-[-0.02em] sm:text-[32px]">
                  Updates from the crew
                </h2>
                <p className="mt-2 text-[15px] text-[#6e6e73]">
                  Messages and drops from the filmmakers — only if you Follow.
                </p>
              </div>
            </div>

            <ul className="mt-8 space-y-3">
              {CREW_UPDATES.map((u) => (
                <li
                  key={u.from + u.time}
                  className="rounded-3xl bg-[#fbfbfd] px-5 py-5 sm:px-6"
                >
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <p className="text-[14px] font-semibold text-[#1d1d1f]">
                      {u.from}
                    </p>
                    <span className="text-[12px] text-[#86868b]">
                      {u.role} · {u.time}
                    </span>
                  </div>
                  <p className="mt-2 text-[15px] leading-relaxed text-[#1d1d1f]">
                    {u.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <VariantSwitch active="v1" />
    </div>
  );
}
