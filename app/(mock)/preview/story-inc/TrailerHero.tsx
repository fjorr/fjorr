/** Poster + play — mock trailer hero (no real video). */
export default function TrailerHero({
  className = '',
  rounded = 'rounded-[28px]',
}: {
  className?: string;
  rounded?: string;
}) {
  return (
    <a
      href="#mock"
      aria-label="Play trailer"
      className={`group relative block overflow-hidden bg-black ${rounded} ${className}`}
    >
      <img
        src="/preview/story-inc/trailer-poster.png"
        alt="Angry Birds 3 trailer"
        className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
      />
      <span className="absolute inset-0 bg-black/15 transition-colors group-hover:bg-black/25" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-[#1d1d1f] shadow-[0_8px_32px_rgba(0,0,0,0.35)] transition-transform group-hover:scale-105 sm:h-[4.5rem] sm:w-[4.5rem]">
          <svg
            viewBox="0 0 24 24"
            className="ml-1 h-7 w-7 fill-current sm:h-8 sm:w-8"
            aria-hidden
          >
            <path d="M8 5.14v13.72L19 12 8 5.14z" />
          </svg>
        </span>
      </span>
      <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-5 pb-4 pt-12">
        <span className="block text-[12px] font-semibold uppercase tracking-[0.12em] text-white/70">
          Official teaser
        </span>
        <span className="mt-0.5 block text-[15px] font-bold text-white sm:text-[16px]">
          Angry Birds 3
        </span>
      </span>
    </a>
  );
}
