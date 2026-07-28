'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter } from '@/i18n/navigation';
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
  const router = useRouter();
  const [mode, setModeState] = useState<DisplayMode>(initialMode);

  useEffect(() => {
    setModeState(readDisplayModeCookie());
  }, []);

  const setMode = useCallback(
    (next: DisplayMode) => {
      setModeState(next);
      writeDisplayModeCookie(next);
      // Re-stream home RSC for the active mode only (cookie-gated loaders).
      router.refresh();
    },
    [router]
  );

  const value = useMemo(
    () => ({
      mode,
      setMode,
      isMinimal: mode === 'minimal',
      isTimeline: mode === 'timeline',
      isListMode: mode === 'minimal' || mode === 'timeline',
    }),
    [mode, setMode]
  );

  return (
    <DisplayModeContext.Provider value={value}>
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
