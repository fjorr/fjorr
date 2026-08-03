'use client';

import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/ui/Icons';
import { fetchOwnBureauxNav } from '@/lib/bureaux-client';
import { createClient } from '@/lib/supabase/client';

type MenuProfile = {
  display_name: string;
};

/** Join / Sign in / Account / Log out for the hamburger explore list. */
export default function AccountNavLink({
  className,
  mutedClassName,
  onNavigate,
  onSignIn,
}: {
  className: string;
  mutedClassName?: string;
  onNavigate?: () => void;
  onSignIn?: () => void;
}) {
  const t = useTranslations('Nav');
  const router = useRouter();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [bureauxActive, setBureauxActive] = useState(false);
  const [bureauxNumber, setBureauxNumber] = useState<number | null>(null);
  const [profile, setProfile] = useState<MenuProfile | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    const loadProfile = async () => {
      const nav = await fetchOwnBureauxNav();
      if (!mounted) return;
      setBureauxActive(nav.active);
      setBureauxNumber(nav.bureauxNumber);
      setProfile(
        nav.displayName ? { display_name: nav.displayName } : null
      );
    };

    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      if (!mounted) return;
      const next = !!data.session;
      setSignedIn(next);
      if (next) void loadProfile();
      else {
        setProfile(null);
        setBureauxActive(false);
        setBureauxNumber(null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      if (!mounted) return;
      const next = !!session;
      setSignedIn(next);
      if (next) void loadProfile();
      else {
        setProfile(null);
        setBureauxActive(false);
        setBureauxNumber(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setProfile(null);
      setBureauxActive(false);
      setBureauxNumber(null);
      onNavigate?.();
      router.push('/');
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  };

  if (signedIn === null) {
    return (
      <span className={`${className} opacity-40`} aria-hidden>
        {t('signIn')}
      </span>
    );
  }

  if (signedIn && bureauxActive) {
    const name = profile?.display_name || null;

    return (
      <div className="flex flex-col gap-1.5">
        {(name || bureauxNumber != null) && (
          <p
            className={
              mutedClassName ||
              'font-sans text-[13px] font-medium leading-snug text-page-faint'
            }
          >
            {name
              ? name
              : bureauxNumber != null
                ? t('bureauxMark', { number: bureauxNumber })
                : null}
          </p>
        )}
        <Link href="/account/voyages" onClick={onNavigate} className={className}>
          {t('account')}
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className={`${className} text-left disabled:opacity-40`}
        >
          {t('logOut')}
        </button>
      </div>
    );
  }

  if (signedIn && !bureauxActive) {
    return (
      <div className="flex flex-col gap-1.5">
        <Link
          href="/bureaux"
          onClick={onNavigate}
          className={`${className} inline-flex items-center gap-1.5`}
        >
          <span>{t('joinBureaux')}</span>
          <Icon name="arrowRight" className="w-3.5 h-3.5 opacity-55" />
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className={`${className} text-left disabled:opacity-40 opacity-80`}
        >
          {t('logOut')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Link
        href="/bureaux"
        onClick={onNavigate}
        className={`${className} inline-flex items-center gap-1.5`}
      >
        <span>{t('joinBureaux')}</span>
        <Icon name="arrowRight" className="w-3.5 h-3.5 opacity-55" />
      </Link>
      <button
        type="button"
        onClick={() => onSignIn?.()}
        className={`${className} text-left opacity-80 hover:opacity-100`}
      >
        {t('signIn')}
      </button>
    </div>
  );
}
