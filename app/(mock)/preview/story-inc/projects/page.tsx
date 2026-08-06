import type { Metadata } from 'next';
import Link from 'next/link';
import { PROJECTS_INDEX, PROJECTS_PAGE_LEAD } from '../content';

export const metadata: Metadata = {
  title: 'Projects',
  description: PROJECTS_PAGE_LEAD,
};

const NAV = [
  { label: 'Markets', href: null as string | null },
  { label: 'Rewards', href: '/preview/story-inc/rewards' },
  { label: 'About', href: null },
  { label: 'Filmmakers', href: null },
  { label: 'Resources', href: null },
] as const;

/**
 * Story Inc Projects index — matches current client grid + homepage-style header.
 * https://app.storyincmedia.com/projects
 */
export default function StoryIncProjectsPage() {
  return (
    <div
      className="min-h-screen bg-white text-[#1d1d1f]"
      style={{ fontFamily: 'Montserrat, Arial, sans-serif' }}
    >
      {/* Story Inc chrome — mirrors live app nav */}
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
                  className="transition-opacity hover:opacity-80"
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
          <div className="flex items-center gap-3 text-[12px] sm:gap-4">
            <span className="hidden text-right sm:block">
              <span className="block text-[11px] text-[#86868b]">Story Cash</span>
              <span className="font-bold tabular-nums">$782.92</span>
            </span>
            <span className="relative text-right">
              <span className="absolute -right-1 -top-0.5 h-1.5 w-1.5 rounded-full bg-[#e11d48]" />
              <span className="block text-[11px] text-[#86868b]">Account</span>
              <span className="font-bold">thor</span>
            </span>
          </div>
        </div>
      </header>

      <main>
        {/* Homepage-style centered header */}
        <section className="mx-auto max-w-[720px] px-5 pb-10 pt-14 text-center sm:pb-12 sm:pt-20">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#00a6ff]">
            Projects
          </p>
          <h1 className="mt-4 text-[32px] font-bold leading-[1.08] tracking-[-0.03em] text-[#1d1d1f] sm:text-[44px] md:text-[52px]">
            Follow the projects that matter to you
          </h1>
          <p className="mx-auto mt-5 max-w-[34rem] text-[15px] leading-relaxed text-[#6e6e73] sm:text-[17px]">
            {PROJECTS_PAGE_LEAD}
          </p>
        </section>

        {/* Project grid — same pattern as live /projects */}
        <section className="mx-auto max-w-[1120px] px-5 pb-20">
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4">
            {PROJECTS_INDEX.map((p) => {
              const card = (
                <>
                  <div className="aspect-[4/3] overflow-hidden rounded-xl bg-[#f0f0f2]">
                    <img
                      src={p.image}
                      alt=""
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#aeaeb2]">
                    Story Inc.
                  </p>
                  <h2 className="mt-1 text-[15px] font-bold leading-snug tracking-[-0.01em] text-[#1d1d1f] sm:text-[16px]">
                    {p.title}
                  </h2>
                </>
              );

              return (
                <li key={p.title}>
                  {p.href ? (
                    <Link
                      href={p.href}
                      className="group block text-left transition-opacity hover:opacity-90"
                    >
                      {card}
                    </Link>
                  ) : (
                    <div className="group block cursor-default text-left opacity-90">
                      {card}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </div>
  );
}
