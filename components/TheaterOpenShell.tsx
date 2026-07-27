'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useColorScheme } from '@/components/ColorSchemeProvider';
import { LIGHT_PAGE_BG } from '@/lib/color-scheme';

/** Fullscreen shell used as dynamic() loading UI for CinemaTheater. */
export default function TheaterOpenShell() {
  const [mounted, setMounted] = useState(false);
  const { isLight } = useColorScheme();
  useEffect(() => setMounted(true), []);

  const shell = (
    <div
      id="fjorr-theater-shell"
      className="fixed inset-0 z-[99999]"
      style={{ backgroundColor: isLight ? LIGHT_PAGE_BG : '#000000' }}
      aria-hidden
    />
  );

  if (!mounted) return null;
  return createPortal(shell, document.body);
}
