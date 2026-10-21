/** Voyages loading — title, subhead, then a stack of voyage pills. */
export default function VoyagesLoading() {
  return (
    <div className="flex min-h-[calc(100dvh-56px)] w-full flex-col bg-white text-[#0B0B0C]">
      <main className="mx-auto w-full min-w-0 flex-1 px-5 py-8 sm:px-8 md:px-10 md:py-10">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8">
          <header className="flex w-full flex-col items-center gap-3">
            <div className="h-9 w-36 rounded bg-black/[0.06] sm:h-10 sm:w-44" />
            <div className="h-5 w-72 max-w-full rounded bg-black/[0.05]" />
          </header>

          <ul className="m-0 flex w-full max-w-[36rem] list-none flex-col gap-2.5 p-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i}>
                <div
                  className="flex h-16 w-full items-center gap-4 rounded-full bg-[#F5F5F7] pl-6 pr-2 sm:pl-7 sm:pr-2.5"
                  aria-hidden
                >
                  <div className="h-4 w-28 rounded bg-black/[0.06] sm:w-36" />
                  <div className="h-3.5 w-16 rounded bg-black/[0.05]" />
                  <div className="ml-auto h-11 w-14 shrink-0 rounded-full bg-white" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
