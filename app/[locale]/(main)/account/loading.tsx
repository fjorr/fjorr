/** Quiet account chrome skeleton — matches centered AccountShell (no sidebar). */
export default function AccountLoading() {
  return (
    <div className="flex min-h-[calc(100dvh-56px)] w-full flex-col bg-white text-[#0B0B0C]">
      <main className="mx-auto w-full min-w-0 flex-1 px-5 py-8 sm:px-8 md:px-10 md:py-10">
        <div className="mx-auto flex w-full max-w-[560px] flex-col items-center gap-8">
          <header className="flex w-full max-w-[22rem] flex-col items-center gap-3">
            <div className="h-9 w-40 rounded bg-black/[0.06] sm:h-10 sm:w-48" />
            <div className="h-4 w-full max-w-[18rem] rounded bg-black/[0.06]" />
            <div className="h-4 w-28 rounded bg-black/[0.06]" />
          </header>

          <div className="mx-auto flex w-fit max-w-full flex-col gap-2.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[7.5rem_1fr] items-center gap-x-3 sm:grid-cols-[8.5rem_1fr]"
              >
                <div className="h-3.5 w-16 rounded bg-black/[0.06]" />
                <div
                  className={`h-3.5 rounded bg-black/[0.06] ${
                    i % 3 === 0 ? 'w-28' : i % 3 === 1 ? 'w-36' : 'w-24'
                  }`}
                />
              </div>
            ))}
          </div>

          <div className="h-8 w-52 rounded-full bg-black/[0.06]" />

          <div className="flex flex-col items-center gap-3 pt-2">
            <div className="h-3.5 w-36 rounded bg-black/[0.06]" />
            <div className="h-3.5 w-28 rounded bg-black/[0.06]" />
            <div className="mt-1 h-3 w-48 rounded bg-black/[0.06]" />
          </div>
        </div>
      </main>
    </div>
  );
}
