'use client';

import React, { useEffect, useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/ui/Icons';
import { fetchOwnBureauxNav } from '@/lib/bureaux-client';
import { createClient } from '@/lib/supabase/client';
import { useAuthPresence } from '@/components/AuthPresenceProvider';

type MenuProfile = {
  display_name: string;
};

/** Join / Sign in / Account / Log out for the hamburger explore list. */
export default function AccountNavLink({
  className,
  mutedClassName,
  onNavigate,
}: {
  className: string;
  mutedClassName?: string;
  onNavigate?: () => void;
}) {
  const t = useTranslations('Nav');
  const router = useRouter();
  const { signedIn } = useAuthPresence();
  const [bureauxActive, setBureauxActive] = useState(false);
  const [bureauxNumber, setBureauxNumber] = useState<number | null>(null);
  const [profile, setProfile] = useState<MenuProfile | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let mounted = true;

    if (!signedIn) {
      setProfile(null);
      setBureauxActive(false);
      setBureauxNumber(null);
      return () => {
        mounted = false;
      };
    }

    const loadProfile = async () => {
      const nav = await fetchOwnBureauxNav();
      if (!mounted) return;
      setBureauxActive(nav.active);
      setBureauxNumber(nav.bureauxNumber);
      setProfile(
        nav.displayName ? { display_name: nav.displayName } : null
      );
    };

    void loadProfile();
    return () => {
      mounted = false;
    };
  }, [signedIn]);

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
      <Link
        href="/signin"
        onClick={onNavigate}
        className={`${className} text-left opacity-80 hover:opacity-100`}
      >
        {t('signIn')}
      </Link>
    </div>
  );
}
