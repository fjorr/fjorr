'use client';

import { useState } from 'react';

/** Mock follow control — client-only for the throwaway preview. */
export default function FollowButton({
  initialFollowing = false,
  initialCount = 128400,
  tone = 'brand',
  size = 'md',
  showCount = true,
  secondary = false,
}: {
  initialFollowing?: boolean;
  initialCount?: number;
  tone?: 'brand' | 'rams';
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  /** Outline style — use when another CTA is primary on the page. */
  secondary?: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(initialCount);

  const buttonClass =
    tone === 'rams'
      ? following
        ? 'border border-black/20 bg-transparent text-black hover:bg-black/[0.03]'
        : 'bg-black text-white hover:bg-black/85'
      : following || secondary
        ? 'border border-black/15 bg-white text-[#171717] hover:bg-black/[0.03]'
        : 'bg-[#00a6ff] text-white hover:bg-[#0095e6]';

  const sizeClass =
    size === 'lg'
      ? 'h-12 px-8 text-[15px] shadow-[0_8px_24px_rgba(0,166,255,0.35)]'
      : size === 'sm'
        ? 'h-8 px-3.5 text-[12px]'
        : 'h-10 px-5 text-sm';

  return (
    <div
      className={`flex items-center gap-2 sm:gap-3 ${
        showCount ? 'flex-col sm:flex-row sm:flex-wrap' : ''
      }`}
    >
      <button
        type="button"
        onClick={() => {
          setFollowing((v) => {
            setCount((c) => (v ? c - 1 : c + 1));
            return !v;
          });
        }}
        className={`inline-flex items-center justify-center rounded-full font-semibold transition-colors ${buttonClass} ${sizeClass}`}
      >
        {following ? 'Following' : size === 'sm' ? 'Follow' : 'Follow project'}
      </button>
      {showCount ? (
        <p className="text-sm text-[#8e8e8e]">
          <span className="font-semibold text-[#171717]">
            {count.toLocaleString()}
          </span>{' '}
          fans
        </p>
      ) : null}
    </div>
  );
}
