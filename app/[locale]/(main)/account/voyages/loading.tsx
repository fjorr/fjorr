/** Voyages loading — card rail is the default view. */
export default function VoyagesLoading() {
  return (
    <div className="flex min-h-[calc(100dvh-56px)] w-full flex-col bg-white text-[#0B0B0C]">
      <main className="mx-auto flex w-full min-w-0 flex-1 flex-col px-5 py-8 sm:px-8 md:px-10 md:py-10">
        <div className="relative flex min-h-[calc(100dvh-11rem)] w-full flex-col gap-8">
          <header className="flex w-full flex-col items-center gap-3">
            <div className="h-9 w-36 rounded bg-black/[0.06] sm:h-10 sm:w-44" />
            <div className="flex items-center gap-2.5">
              <div className="size-3.5 rounded-[2px] bg-black/[0.06]" />
              <div className="h-[15px] w-3 rounded-[2px] bg-black/[0.08]" />
            </div>
          </header>

          <div className="flex min-h-0 flex-1 items-center pb-16 md:pb-20">
            <div className="-mr-5 flex gap-4 overflow-hidden sm:-mr-8 sm:gap-5 md:-mr-10 md:gap-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="box-border flex h-[17.5rem] w-[16.5rem] shrink-0 flex-col items-center gap-5 rounded-[22px] bg-[#F5F5F7] px-8 py-8 md:h-[19rem] md:w-[18rem] md:gap-6 md:rounded-[28px] md:px-10 md:py-10"
                  aria-hidden
                >
                  <div className="h-4 w-24 rounded bg-black/[0.06]" />
                  <div className="h-14 w-28 rounded bg-black/[0.08] md:h-16 md:w-32" />
                  <div className="mt-auto flex w-full flex-col items-center gap-2">
                    <div className="h-4 w-36 rounded bg-black/[0.06]" />
                    <div className="h-3 w-20 rounded bg-black/[0.05]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3"
        aria-hidden
      >
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-black/[0.06]" />
          <div className="h-3.5 w-6 rounded bg-black/[0.06]" />
          <div className="size-9 rounded-full bg-black/[0.06]" />
        </div>
      </div>
    </div>
  );
}
