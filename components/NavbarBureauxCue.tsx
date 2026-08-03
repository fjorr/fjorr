'use client';

import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { fetchOwnBureauxNav } from '@/lib/bureaux-client';
import { createClient } from '@/lib/supabase/client';

/** Quiet signed-in mark in the main navbar — Bureaux No. → account. */
export default function NavbarBureauxCue({
  className,
}: {
  className?: string;
}) {
  const t = useTranslations('Nav');
  const [number, setNumber] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    const load = async () => {
      const nav = await fetchOwnBureauxNav();
      if (!mounted) return;
      setNumber(nav.active ? nav.bureauxNumber : null);
    };

    void load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      if (!mounted) return;
      if (!session) {
        setNumber(null);
        return;
      }
      void load();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (number == null) return null;

  return (
    <Link
      href="/account/bureaux"
      aria-label={t('bureauxMarkAria', { number })}
      className={`shrink-0 font-sans text-[12px] font-semibold tabular-nums tracking-tight transition-opacity hover:opacity-80 ${className || ''}`}
    >
      {t('bureauxMark', { number })}
    </Link>
  );
}
