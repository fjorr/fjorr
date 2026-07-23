'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  type DisplayMode,
  readDisplayModeCookie,
  writeDisplayModeCookie,
} from '@/lib/display-mode';

type DisplayModeContextValue = {
  mode: DisplayMode;
  setMode: (mode: DisplayMode) => void;
  isMinimal: boolean;
};

const DisplayModeContext = createContext<DisplayModeContextValue | null>(null);

export function DisplayModeProvider({
  children,
  initialMode = 'cinematic',
}: {
  children: React.ReactNode;
  initialMode?: DisplayMode;
}) {
  const router = useRouter();
  const [mode, setModeState] = useState<DisplayMode>(initialMode);

  useEffect(() => {
    setModeState(readDisplayModeCookie());
  }, []);

  const setMode = useCallback(
    (next: DisplayMode) => {
      setModeState(next);
      writeDisplayModeCookie(next);
      router.refresh();
    },
    [router]
  );

  return (
    <DisplayModeContext.Provider
      value={{ mode, setMode, isMinimal: mode === 'minimal' }}
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
