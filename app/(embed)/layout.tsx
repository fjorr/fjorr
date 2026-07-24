import React, { type ReactNode } from 'react';

/** Bare shell for iframe embeds — no site chrome. */
export default function EmbedLayout({ children }: { children: ReactNode }) {
  return children;
}
