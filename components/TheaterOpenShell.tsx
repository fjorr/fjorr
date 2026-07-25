'use client';

import React from 'react';

/** Fullscreen black shell used as dynamic() loading UI for CinemaTheater. */
export default function TheaterOpenShell() {
  return <div className="fixed inset-0 z-[99999] bg-black" aria-hidden />;
}
