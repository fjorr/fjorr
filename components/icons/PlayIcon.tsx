import React from 'react';

/**
 * Play control from design SVG (16×16 artboard), scaled to size.
 */
export default function PlayIcon({
  size = 56,
  tone = 'onDark',
  className = '',
}: {
  size?: number;
  /** onDark: white disc (hero). onLight: black disc (rail). */
  tone?: 'onDark' | 'onLight';
  className?: string;
}) {
  const disc = tone === 'onLight' ? '#0B0B0C' : 'white';
  const glyph = tone === 'onLight' ? 'white' : '#0B0B0C';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <circle cx="7.66357" cy="7.66357" r="7.66357" fill={disc} />
      <path
        d="M10.1138 7.23058C10.4471 7.42303 10.4471 7.90415 10.1138 8.0966L6.81373 10.0019C6.4804 10.1943 6.06373 9.95377 6.06373 9.56887L6.06373 5.75831C6.06373 5.37341 6.4804 5.13285 6.81373 5.3253L10.1138 7.23058Z"
        fill={glyph}
      />
    </svg>
  );
}
