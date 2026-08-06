import type { Metadata } from 'next';
import Link from 'next/link';
import HallOfWinsRail from '../HallOfWinsRail';

export const metadata: Metadata = {
  title: 'Hall of Wins',
  description:
    'Story Inc Hall of Wins — Bureaux-style poster carousel of top wins.',
};

/** Strip comp — Hall of Wins poster carousel only. */
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
          <p className="text-[12px] font-medium text-[#86868b]">
            Comp · Hall of Wins
          </p>
        </div>
      </header>

      <main className="py-12 sm:py-16">
        <HallOfWinsRail />
      </main>

      <footer className="border-t border-black/[0.06] py-8">
        <p className="mx-auto max-w-[1120px] px-5 text-center text-[11px] leading-relaxed text-[#aeaeb2]">
          Concept comp. Wins shown are illustrative placeholders. Story Inc. is
          an independent entity and is not endorsed by or affiliated with any
          individual or entity depicted, unless expressly indicated.
        </p>
      </footer>
    </div>
  );
}
