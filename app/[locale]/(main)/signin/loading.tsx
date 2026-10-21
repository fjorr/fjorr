/** Immediate sign-in shell while the auth redirect check resolves. */
export default function SignInLoading() {
  return (
    <div className="flex min-h-[calc(100dvh-56px)] w-full flex-col bg-white">
      <div className="flex w-full flex-1 items-center justify-center px-6 py-16">
        <div
          className="flex w-full max-w-[22rem] flex-col items-center"
          aria-hidden
        >
          <div className="h-12 w-44 rounded bg-black/[0.06]" />
          <div className="mt-4 h-5 w-64 max-w-full rounded bg-black/[0.05]" />
          <div className="mt-6 h-12 w-full rounded-full bg-[#F5F5F7]" />
        </div>
      </div>
      <div className="h-[54px] w-full shrink-0" aria-hidden />
    </div>
  );
}
