/** Voyages loading — title, subhead, then a grid of poster cards. */
export default function VoyagesLoading() {
  return (
    <div className="flex min-h-[calc(100dvh-56px)] w-full flex-col bg-[#F5F5F7] text-[#0B0B0C]">
      <main className="mx-auto w-full min-w-0 flex-1 px-5 py-8 sm:px-8 md:px-10 md:py-10">
        <div className="flex w-full flex-col items-center gap-8">
          <header className="flex w-full flex-col items-center gap-3">
            <div className="h-9 w-36 rounded bg-black/[0.06] sm:h-10 sm:w-44" />
            <div className="h-5 w-72 max-w-full rounded bg-black/[0.05]" />
          </header>

          <ul className="m-0 grid w-full list-none grid-cols-2 gap-3 p-0 md:grid-cols-4 md:gap-4 xl:grid-cols-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i} aria-hidden>
                <div className="overflow-hidden rounded-[18px] bg-white shadow-[3px_5px_30px_rgba(0,0,0,0.12)]">
                  <div className="flex flex-col gap-2 px-3.5 pt-3.5 pb-3">
                    <div className="h-5 w-10 rounded bg-black/[0.06]" />
                    <div className="h-8 w-full rounded bg-black/[0.05]" />
                    <div className="h-3 w-16 rounded bg-black/[0.05]" />
                  </div>
                  <div className="aspect-square w-full bg-[#F5F5F7]" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
