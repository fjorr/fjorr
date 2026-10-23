/** Quiet shell while the auth redirect check resolves. The form rises in after. */
export default function SignInLoading() {
  return (
    <div className="flex min-h-[calc(100dvh-56px)] w-full flex-col bg-white">
      <div className="flex w-full flex-1 items-center justify-center px-6 py-16" />
      <div className="h-[54px] w-full shrink-0" aria-hidden />
    </div>
  );
}
