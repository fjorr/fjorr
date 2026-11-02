import React from 'react';

/** "▶ 3m" — runtime for a film you can watch now. Inherits the caption color. */
export default function RuntimeTag({ runtime }: { runtime: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-[3px]">
      <svg
        viewBox="0 0 8 8"
        className="h-[7px] w-[7px]"
        fill="currentColor"
        aria-hidden
      >
        <path d="M1.2 0.6v6.8L7.2 4z" />
      </svg>
      {runtime}
    </span>
  );
}
