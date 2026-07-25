'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  type DisplayMode,
  readDisplayModeCookie,
  writeDisplayModeCookie,
} from '@/lib/display-mode';

type DisplayModeContextValue = {
  mode: DisplayMode;
  setMode: (mode: DisplayMode) => void;
  isMinimal: boolean;
  isTimeline: boolean;
  isListMode: boolean;
};

const DisplayModeContext = createContext<DisplayModeContextValue | null>(null);

export function DisplayModeProvider({
  children,
  initialMode = 'cinematic',
}: {
  children: React.ReactNode;
  initialMode?: DisplayMode;
}) {
  const [mode, setModeState] = useState<DisplayMode>(initialMode);

  useEffect(() => {
    setModeState(readDisplayModeCookie());
  }, []);

  const setMode = useCallback((next: DisplayMode) => {
    setModeState(next);
    writeDisplayModeCookie(next);
    // No router.refresh — home keeps all browse modes mounted for instant switch.
  }, []);

  return (
    <DisplayModeContext.Provider
      value={{
        mode,
        setMode,
        isMinimal: mode === 'minimal',
        isTimeline: mode === 'timeline',
        isListMode: mode === 'minimal' || mode === 'timeline',
      }}
    >
      {children}
    </DisplayModeContext.Provider>
  );
}

export function useDisplayMode() {
  const ctx = useContext(DisplayModeContext);
  if (!ctx) {
    throw new Error('useDisplayMode must be used within DisplayModeProvider');
  }
  return ctx;
}
