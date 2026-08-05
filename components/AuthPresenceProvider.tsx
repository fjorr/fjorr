'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

type AuthPresence = {
  /** null while first session check is in flight */
  signedIn: boolean | null;
};

const AuthPresenceContext = createContext<AuthPresence>({ signedIn: null });

/** One Supabase session subscription for nav chrome (cue + account link). */
export function AuthPresenceProvider({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      if (!mounted) return;
      setSignedIn(!!data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      if (!mounted) return;
      setSignedIn(!!session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthPresenceContext.Provider value={{ signedIn }}>
      {children}
    </AuthPresenceContext.Provider>
  );
}

export function useAuthPresence() {
  return useContext(AuthPresenceContext);
}
