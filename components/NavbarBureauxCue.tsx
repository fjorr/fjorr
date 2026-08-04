'use client';

import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

/**
 * Tiny cyan bolt on the hamburger — signed-in signal (no member number).
 * Positioned by the parent button (`relative`).
 */
export default function NavbarBureauxCue() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    const sync = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!mounted) return;
      setSignedIn(!!session);
    };

    void sync();

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

  if (!signedIn) return null;

  return (
    <span
      aria-hidden
      className="pointer-events-none absolute -top-1.5 -right-1.5 z-10 flex size-[11px] items-center justify-center text-[#22D3EE]"
    >
      <Zap size={11} strokeWidth={2.5} fill="currentColor" className="drop-shadow-[0_0_1px_rgba(0,0,0,0.35)]" />
    </span>
  );
}
