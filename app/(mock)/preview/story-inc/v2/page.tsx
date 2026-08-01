import type { Metadata } from 'next';
import FollowButton from '../FollowButton';
import RewardPlaceholder from '../RewardPlaceholder';
import TrailerHero from '../TrailerHero';
import VariantSwitch from '../VariantSwitch';
import {
  COMMENTS,
  FAN_COUNT,
  GENRES,
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

function DeadLink({
  children,
  className,
  title,
  ariaLabel,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  ariaLabel?: string;
}) {
  return (
    <a href="#mock" className={className} title={title} aria-label={ariaLabel}>
      {children}
    </a>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-5 text-lg font-bold tracking-tight text-[#171717]">
      {children}
    </h2>
  );
}

function Card({
  children,
  className = '',
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={`rounded-2xl border border-black/[0.08] bg-white ${className}`}
    >
      {children}
    </div>
  );
}

/** Rich Story Inc project fan-page mock — Angry Birds 3. Safe to delete with /preview. */
export default function StoryIncProjectMockPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa] text-[#171717]">
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 pb-20 pt-8">
        <section className="overflow-hidden rounded-3xl border border-black/[0.08] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
          <TrailerHero rounded="rounded-none" />

          <div className="flex flex-col gap-5 p-5 sm:p-6">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                {GENRES.map((g) => (
                  <span
                    key={g}
                    className="rounded-full bg-[#f5f5f7] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#6e6e73]"
                  >
                    {g}
                  </span>
                ))}
              </div>
              <h1 className="font-bold text-3xl tracking-tight text-[#171717] sm:text-4xl md:text-5xl">
                Angry Birds 3
              </h1>
              <p className="mt-2 text-sm text-[#8e8e8e] sm:text-[15px]">
                In theaters December 23 · Paramount × Rovio
              </p>
            </div>
            <div className="flex flex-col gap-5 border-t border-black/[0.06] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <FollowButton initialCount={FAN_COUNT} />
              <div className="flex flex-wrap gap-2">
                <DeadLink className="inline-flex h-10 items-center rounded-full bg-[#171717] px-5 text-sm font-semibold text-white hover:opacity-90">
                  Pre-purchase tickets
                </DeadLink>
                <DeadLink className="inline-flex h-10 items-center rounded-full border border-black/15 px-5 text-sm font-semibold hover:bg-black/[0.03]">
                  Get early access
                </DeadLink>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Tickets', sub: 'Pre-sale open', href: '#tickets' },
            { label: 'Trailers', sub: 'Share invite', href: '#trailers' },
            { label: 'Rewards', sub: '4 live drops', href: '#rewards' },
            { label: 'Notify me', sub: 'From filmmakers', href: '#notify' },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3 transition-colors hover:border-[#00a6ff]/40 hover:bg-[#00a6ff]/[0.03]"
            >
              <div className="text-sm font-bold">{item.label}</div>
              <div className="mt-0.5 text-xs text-[#8e8e8e]">{item.sub}</div>
            </a>
          ))}
        </section>

        <section className="mt-10">
          <SectionLabel>Story Summary</SectionLabel>
          <p className="max-w-3xl text-[15px] leading-relaxed text-[#333]">
            {SUMMARY}
          </p>
        </section>

        <section
          id="rewards"
          className="relative mt-12 overflow-hidden rounded-3xl px-5 py-10 sm:px-8 sm:py-12"
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
                'radial-gradient(circle at 15% 0%, rgba(255,255,255,0.4), transparent 45%)',
            }}
          />
          <div className="relative">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75">
                  Earn from this project
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Rewards
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/85">
                  Predict and unlock drops from this project — premiere seats,
                  merch, BTS access, and grants already given from the desk.
                </p>
              </div>
              <DeadLink className="text-sm font-semibold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white">
                Learn how rewards work →
              </DeadLink>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                    <h3 className="text-[15px] font-bold text-[#171717]">
                      {r.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#666]">
                      {r.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-10 gap-8 lg:grid lg:grid-cols-12">
          <div className="space-y-10 lg:col-span-8">
            <section id="markets">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <SectionLabel>Project Markets</SectionLabel>
                <DeadLink className="mb-5 text-sm font-medium text-[#00a6ff] hover:opacity-80">
                  Learn how markets work →
                </DeadLink>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {MARKETS.map((m) => (
                  <DeadLink
                    key={m.question}
                    className="group/thumb block overflow-hidden rounded-2xl border border-black/[0.08] bg-white text-inherit transition-shadow hover:shadow-md"
                  >
                    <div className="relative aspect-video overflow-hidden bg-[#f0f0f0]">
                      <img
                        src={m.image}
                        alt=""
                        className="h-full w-full object-cover transition-opacity group-hover/thumb:opacity-85"
                      />
                    </div>
                    <div className="p-4">
                      <div className="mb-2 text-xs text-[#8e8e8e]">
                        Angry Birds 3
                      </div>
                      <div className="mb-3 text-sm font-bold leading-snug">
                        {m.question}
                      </div>
                      <div className="flex flex-col gap-2">
                        {m.outcomes.map((o) => (
                          <div key={o.label}>
                            <div className="mb-1 flex justify-between gap-3 text-sm">
                              <span>{o.label}</span>
                              <span className="shrink-0">{o.pct}%</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-[#eee]">
                              <div
                                className="h-full rounded-full bg-[#00a6ff]"
                                style={{ width: `${o.pct}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex justify-between text-xs text-[#8e8e8e]">
                        <span>{m.outcomes.length} Outcomes</span>
                        <span>Closes {m.closes}</span>
                      </div>
                    </div>
                  </DeadLink>
                ))}
              </div>
            </section>

            <section id="trailers">
              <SectionLabel>Trailers</SectionLabel>
              <p className="mb-4 text-sm text-[#666]">
                Filmmakers can invite fans to share trailers early — build heat
                before the public drop.
              </p>
              <div className="grid gap-3">
                {TRAILERS.map((t) => (
                  <Card
                    key={t.title}
                    className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
                  >
                    <button
                      type="button"
                      className="group relative aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-[#171717] sm:w-44"
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
                      <span className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#171717] shadow">
                        {t.locked ? (
                          <svg
                            viewBox="0 0 16 16"
                            className="h-4 w-4"
                            fill="currentColor"
                            aria-hidden
                          >
                            <path d="M8 1a3 3 0 0 0-3 3v2H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-1V4a3 3 0 0 0-3-3Zm1.5 5h-3V4a1.5 1.5 0 1 1 3 0v2Z" />
                          </svg>
                        ) : (
                          <span className="ml-0.5 text-sm leading-none">▶</span>
                        )}
                      </span>
                    </button>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold">{t.title}</h3>
                      <p className="mt-1 text-sm text-[#666]">{t.meta}</p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-black/15 px-4 text-sm font-semibold hover:bg-black/[0.03]"
                    >
                      {t.status}
                    </button>
                  </Card>
                ))}
              </div>
            </section>

            <section id="tickets">
              <SectionLabel>Tickets</SectionLabel>
              <Card className="overflow-hidden">
                <div className="grid gap-0 md:grid-cols-[1.2fr_1fr]">
                  <div className="p-6">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#00a6ff]">
                      Pre-purchase
                    </p>
                    <h3 className="mt-2 text-xl font-bold">
                      Lock seats before the rush
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#666]">
                      Pre-purchase opening-weekend tickets for Angry Birds 3.
                      Fans who Follow + hold a position get first crack when
                      inventory opens.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="inline-flex h-11 items-center rounded-full bg-[#171717] px-5 text-sm font-semibold text-white"
                      >
                        Pre-purchase tickets
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-11 items-center rounded-full border border-black/15 px-5 text-sm font-semibold"
                      >
                        Remind me
                      </button>
                    </div>
                  </div>
                  <div className="border-t border-black/[0.06] bg-[#fff7f0] p-6 md:border-l md:border-t-0">
                    <ul className="space-y-3 text-sm text-[#444]">
                      <li className="flex gap-2">
                        <span className="text-[#00a6ff]">✓</span>
                        Holiday weekend holds
                      </li>
                      <li className="flex gap-2">
                        <span className="text-[#00a6ff]">✓</span>
                        Fan-first windows for Followers
                      </li>
                      <li className="flex gap-2">
                        <span className="text-[#00a6ff]">✓</span>
                        Bundle with premiere rewards
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </section>

            <section id="comments">
              <SectionLabel>Comments</SectionLabel>
              <Card className="p-5">
                <p className="mb-3 text-sm font-semibold">What&apos;s your take?</p>
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
                      placeholder="Share a take, theory, or market call…"
                      className="h-11 w-full flex-1 rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm outline-none ring-[#00a6ff] placeholder:text-[#aaa] focus:ring-2"
                      readOnly
                    />
                    <button
                      type="button"
                      className="inline-flex h-11 items-center justify-center rounded-full bg-[#00a6ff] px-6 text-sm font-semibold text-white"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </Card>

              <div className="mt-4 space-y-3">
                {COMMENTS.map((c) => (
                  <Card key={c.handle + c.time} className="p-5">
                    <div className="flex gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
                        style={{ backgroundColor: c.avatarColor }}
                        aria-hidden
                      >
                        {c.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <span className="text-sm font-bold">{c.handle}</span>
                          <span className="text-sm text-[#8e8e8e]">
                            {c.place} · {c.time}
                          </span>
                          {c.badge ? (
                            <span className="rounded-full bg-[#00a6ff]/10 px-2 py-0.5 text-[11px] font-semibold text-[#00a6ff]">
                              {c.badge}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-[15px] leading-relaxed text-[#333]">
                          {c.body}
                        </p>
                        <div className="mt-3 flex gap-4 text-xs font-semibold text-[#8e8e8e]">
                          <button type="button" className="hover:text-[#171717]">
                            Reply
                          </button>
                          <button type="button" className="hover:text-[#171717]">
                            Like
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          </div>

          <aside className="mt-10 space-y-6 lg:col-span-4 lg:mt-0">
            <Card id="notify" className="sticky top-24 space-y-5 p-5">
              <div>
                <h2 className="text-lg font-bold">Follow the project</h2>
                <p className="mt-1 text-sm text-[#666]">
                  Like a fan page — get drops, trailer invites, and desk notes
                  from the filmmakers.
                </p>
                <div className="mt-4">
                  <FollowButton initialCount={FAN_COUNT} />
                </div>
              </div>

              <div className="border-t border-black/[0.06] pt-5">
                <h3 className="text-sm font-bold">
                  Sign up for notifications & early access
                </h3>
                <p className="mt-1 text-sm text-[#666]">
                  Filmmaker alerts, trailer share invites, ticket windows, reward
                  drops.
                </p>
                <form className="mt-3 flex flex-col gap-2" action="#">
                  <input
                    type="email"
                    placeholder="Email"
                    className="h-11 rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm outline-none focus:ring-2 focus:ring-[#00a6ff]"
                    readOnly
                  />
                  <button
                    type="button"
                    className="inline-flex h-11 items-center justify-center rounded-full bg-[#00a6ff] text-sm font-semibold text-white"
                  >
                    Notify me
                  </button>
                </form>
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="mb-3 text-lg font-semibold">About the filmmakers</h2>
              <p className="text-sm font-bold">Paramount × Rovio</p>
              <p className="mt-2 text-sm leading-relaxed text-[#666]">
                A Paramount Pictures release, produced by Rovio and SEGA.
                Directed by John Rice — co-director of The Angry Birds Movie 2
                and an animation veteran whose work spans The Simpsons Movie and
                Rick and Morty — from a screenplay by Thurop Van Orman.
              </p>
            </Card>

            <Card className="p-5">
              <h2 className="mb-4 text-lg font-semibold">Team</h2>
              <div className="space-y-3">
                {TEAM.map((member) => (
                  <div key={member.name} className="flex items-center gap-3">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="h-10 w-10 shrink-0 rounded-full object-cover object-top"
                    />
                    <span className="text-[15px] font-medium text-gray-900">
                      {member.name}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="mb-2 text-lg font-semibold">Also worth adding</h2>
              <ul className="space-y-2 text-sm text-[#555]">
                <li>
                  <span className="font-semibold text-[#171717]">Drop calendar</span>{' '}
                  — trailer, tickets, rewards on one timeline
                </li>
                <li>
                  <span className="font-semibold text-[#171717]">Fan milestones</span>{' '}
                  — unlock perks at 10k / 100k Followers
                </li>
                <li>
                  <span className="font-semibold text-[#171717]">Watch parties</span>{' '}
                  — official premiere streams for top predictors
                </li>
                <li>
                  <span className="font-semibold text-[#171717]">Official updates</span>{' '}
                  — verified posts from the desk (not just fan comments)
                </li>
              </ul>
            </Card>
          </aside>
        </div>
      </main>

      <VariantSwitch active="v2" />
    </div>
  );
}
