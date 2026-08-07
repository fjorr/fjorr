/** Immediate sign-in shell while the auth redirect check resolves. */
export default function SignInLoading() {
  return (
    <div className="w-full min-h-[calc(100dvh-4.5rem)] bg-[var(--page-bg)] text-page flex items-center justify-center px-[10%] py-16 sm:py-20">
      <div className="w-full max-w-sm flex flex-col gap-5 text-center" aria-hidden>
        <div className="flex flex-col items-center gap-2">
          <div className="h-12 w-48 rounded bg-page-chip" />
          <div className="h-4 w-64 max-w-full rounded bg-page-chip" />
        </div>
        <div className="h-14 w-full rounded-xl bg-page-chip" />
        <div className="h-14 w-full rounded-full bg-page-chip" />
        <div className="h-12 w-full rounded-full bg-page-chip" />
      </div>
    </div>
  );
}
