import React from 'react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export default function MembersGateActions({
  joinLabel,
  signInLabel,
  nextPath,
  className,
  children,
}: {
  joinLabel: string;
  signInLabel: string;
  nextPath: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'w-full max-w-sm flex flex-col items-center gap-5',
        className
      )}
    >
      <Link
        href="/bureaux"
        className="px-10 h-14 inline-flex items-center justify-center bg-[var(--page-fg)] text-[var(--page-bg)] font-sans font-bold text-[15px] tracking-tight rounded-full shadow-2xl hover:opacity-90 active:scale-95 transition-all duration-150"
      >
        {joinLabel}
      </Link>
      <Link
        href={`/signin?next=${encodeURIComponent(nextPath)}`}
        className="font-sans text-[13px] sm:text-[14px] font-semibold text-page-muted hover:text-page transition-colors underline underline-offset-2"
      >
        {signInLabel}
      </Link>
      {children}
    </div>
  );
}
