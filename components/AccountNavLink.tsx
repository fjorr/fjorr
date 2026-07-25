'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/ui/Icons';
import { createClient } from '@/lib/supabase/client';

/** Sign in / Account control for the hamburger explore list. */
export default function AccountNavLink({
  className,
  onNavigate,
  onSignIn,
}: {
  className: string;
  onNavigate?: () => void;
  onSignIn?: () => void;
}) {
  const t = useTranslations('Nav');
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSignedIn(!!data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (signedIn === null) {
    return (
      <span className={`${className} opacity-40`} aria-hidden>
        {t('signIn')}
      </span>
    );
  }

  if (signedIn) {
    return (
      <Link href="/account" onClick={onNavigate} className={className}>
        {t('account')}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSignIn?.()}
      className={`${className} inline-flex items-center gap-1.5 text-left`}
    >
      <span>{t('signIn')}</span>
      <Icon name="arrowRight" className="w-3.5 h-3.5 opacity-55" />
    </button>
  );
}
