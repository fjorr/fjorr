'use client';

import { useEffect, useState } from 'react';

const NAV = [
  { href: '#rewards', label: 'Rewards' },
  { href: '#markets', label: 'Markets' },
  { href: '#comments', label: 'Comments' },
] as const;

/** Sticky Story Inc chrome — Rewards CTA appears after the hero scrolls away. */
export default function AppleChrome() {
  const [showRewards, setShowRewards] = useState(false);

  useEffect(() => {
    const el = document.getElementById('hero-cta');
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setShowRewards(!entry.isIntersecting),
      { rootMargin: '-52px 0px 0px 0px', threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[52px] max-w-[980px] items-center justify-between gap-3 px-5">
        <a href="#top" className="flex shrink-0 items-center">
          <img
            src="/preview/story-inc/logo.png"
            alt="Story Inc"
            className="h-8 w-auto"
          />
        </a>
        <nav className="hidden items-center gap-6 text-[12px] font-medium text-[#1d1d1f]/80 sm:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="hover:text-[#1d1d1f]"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="#rewards"
            className={`inline-flex h-8 items-center rounded-full bg-[#00a6ff] px-3.5 text-[12px] font-semibold text-white transition-all duration-200 hover:bg-[#0095e6] ${
              showRewards
                ? 'pointer-events-auto scale-100 opacity-100'
                : 'pointer-events-none scale-95 opacity-0'
            }`}
          >
            Rewards
          </a>
          <button
            type="button"
            className="hidden text-[12px] font-semibold text-[#1d1d1f]/80 hover:text-[#1d1d1f] md:inline"
          >
            Sign in
          </button>
          <button
            type="button"
            className={`inline-flex h-8 items-center rounded-full px-3.5 text-[12px] font-semibold transition-colors ${
              showRewards
                ? 'bg-transparent text-[#1d1d1f]/80 hover:text-[#1d1d1f]'
                : 'bg-[#00a6ff] text-white hover:bg-[#0095e6]'
            }`}
          >
            Sign up
          </button>
        </div>
      </div>
    </header>
  );
}
