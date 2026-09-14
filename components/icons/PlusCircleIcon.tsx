import React from 'react';

/** Circled plus — Apple-style: shared stroke weight, optically centered. */
export default function PlusCircleIcon({
  size = 22,
  strokeWidth = 1.75,
  className = '',
}: {
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="9.25"
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />
      <path
        d="M12 9.25v5.5M9.25 12h5.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}
