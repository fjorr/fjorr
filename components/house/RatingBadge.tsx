import React from 'react';

type RatingBadgeProps = {
  rating: string;
  /** `onDark` = white stroke on cinema; `onLight` = black stroke on paper. */
  tone?: 'onDark' | 'onLight';
  className?: string;
};

const TONE = {
  onDark: 'border-white/70 text-white/85',
  onLight: 'border-black/45 text-black/70',
} as const;

/**
 * Film rating chip — stroked border, site-wide.
 * House hero uses onDark; Info / paper sheets use onLight.
 */
export default function RatingBadge({
  rating,
  tone = 'onDark',
  className = '',
}: RatingBadgeProps) {
  const value = rating.trim();
  if (!value) return null;

  return (
    <span
      className={`inline-flex items-center rounded-[3px] border px-1 py-[2px] font-sans text-[11px] font-semibold uppercase leading-none tracking-wide ${TONE[tone]} ${className}`}
    >
      {value}
    </span>
  );
}
