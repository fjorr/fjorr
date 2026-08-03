/** Quiet account chrome skeleton while shell + page data resolve. */
export default function AccountLoading() {
  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-page text-page flex flex-col md:flex-row">
      <aside className="hidden md:flex w-[15.5rem] shrink-0 flex-col gap-8 border-r border-page-faint px-5 py-10">
        <div className="flex flex-col gap-2 px-2">
          <div className="h-6 w-28 rounded bg-page-chip" />
          <div className="h-4 w-20 rounded bg-page-chip" />
        </div>
        <div className="flex flex-col gap-2 px-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 rounded-[8px] bg-page-chip" />
          ))}
        </div>
      </aside>

      <main className="flex-1 min-w-0 px-5 sm:px-8 md:px-10 py-8 md:py-10">
        <div className="w-full max-w-[560px] flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <div className="h-9 w-48 rounded bg-page-chip" />
            <div className="h-4 w-full max-w-sm rounded bg-page-chip" />
            <div className="h-4 w-40 rounded bg-page-chip" />
          </div>
          <div className="flex flex-col gap-4">
            <div className="h-16 w-full rounded-[6px] bg-page-chip" />
            <div className="h-16 w-full rounded-[6px] bg-page-chip" />
            <div className="h-16 w-full max-w-md rounded-[6px] bg-page-chip" />
          </div>
        </div>
      </main>
    </div>
  );
}
