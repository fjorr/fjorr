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
import { fetchOwnBureauxNav } from '@/lib/bureaux-client';

type AuthPresence = {
  /** null while first session check is in flight */
  signedIn: boolean | null;
  /**
   * Active Bureaux seat — null while unknown.
   * Cached across navigations so Account/Join don’t flash out of the nav.
   */
  bureauxMember: boolean | null;
  /** Prefetched for the account sheet — avoids a jump on open. */
  displayName: string | null;
  bureauxNumber: number | null;
};

type CachedIdentity = {
  bureauxMember: boolean;
  displayName: string | null;
  bureauxNumber: number | null;
};

/** Survives Navbar remounts (house ↔ main chrome). */
let cachedIdentity: CachedIdentity | null = null;

const AuthPresenceContext = createContext<AuthPresence>({
  signedIn: null,
  bureauxMember: cachedIdentity?.bureauxMember ?? null,
  displayName: cachedIdentity?.displayName ?? null,
  bureauxNumber: cachedIdentity?.bureauxNumber ?? null,
});

/** One Supabase session + membership check for nav chrome. */
export function AuthPresenceProvider({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [bureauxMember, setBureauxMember] = useState<boolean | null>(
    () => cachedIdentity?.bureauxMember ?? null
  );
  const [displayName, setDisplayName] = useState<string | null>(
    () => cachedIdentity?.displayName ?? null
  );
  const [bureauxNumber, setBureauxNumber] = useState<number | null>(
    () => cachedIdentity?.bureauxNumber ?? null
  );

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

  useEffect(() => {
    if (signedIn === false) {
      cachedIdentity = null;
      setBureauxMember(false);
      setDisplayName(null);
      setBureauxNumber(null);
      return;
    }
    if (signedIn !== true) return;

    let cancelled = false;
    fetchOwnBureauxNav().then((nav) => {
      if (cancelled) return;
      const next: CachedIdentity = {
        bureauxMember: nav.active,
        displayName: nav.displayName,
        bureauxNumber: nav.bureauxNumber,
      };
      cachedIdentity = next;
      setBureauxMember(next.bureauxMember);
      setDisplayName(next.displayName);
      setBureauxNumber(next.bureauxNumber);
    });
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  return (
    <AuthPresenceContext.Provider
      value={{ signedIn, bureauxMember, displayName, bureauxNumber }}
    >
      {children}
    </AuthPresenceContext.Provider>
  );
}

export function useAuthPresence() {
  return useContext(AuthPresenceContext);
}
