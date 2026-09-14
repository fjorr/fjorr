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

const EXPLORE_ROW =
  'flex w-full items-baseline gap-2.5 border-0 bg-transparent px-0 py-1.5 text-left hover:opacity-55 md:gap-3 md:py-2';
const EXPLORE_PRIMARY =
  'font-interTight text-[16px] font-semibold leading-none tracking-tight text-[#0B0B0C] md:text-[18px] lg:text-[20px]';
const EXPLORE_DESC =
  'font-sans text-[13px] font-medium leading-none text-black/40 md:text-[14px]';

/** Join / Sign in / Account / Log out for the hamburger explore list. */
export default function AccountNavLink({
  className,
  mutedClassName,
  onNavigate,
  variant = 'default',
}: {
  className?: string;
  mutedClassName?: string;
  onNavigate?: () => void;
  variant?: 'default' | 'explore';
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
      setProfile(nav.displayName ? { display_name: nav.displayName } : null);
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

  if (variant === 'explore') {
    const row = (primary: string, desc?: string) => (
      <>
        <span className={EXPLORE_PRIMARY}>{primary}</span>
        {desc ? <span className={EXPLORE_DESC}>{desc}</span> : null}
      </>
    );

    if (signedIn === null) {
      return (
        <li>
          <span className={`${EXPLORE_ROW} cursor-default opacity-40`} aria-hidden>
            {row(t('signIn'), t('exploreSignInDesc'))}
          </span>
        </li>
      );
    }

    if (signedIn && bureauxActive) {
      return (
        <>
          <li>
            <Link href="/account/voyages" onClick={onNavigate} className={EXPLORE_ROW}>
              {row(t('account'), t('exploreAccountDesc'))}
            </Link>
          </li>
          <li>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className={`${EXPLORE_ROW} disabled:opacity-40`}
            >
              {row(t('logOut'))}
            </button>
          </li>
        </>
      );
    }

    if (signedIn && !bureauxActive) {
      return (
        <>
          <li>
            <Link href="/bureaux" onClick={onNavigate} className={EXPLORE_ROW}>
              {row(t('exploreBureaux'), t('exploreBureauxDesc'))}
            </Link>
          </li>
          <li>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className={`${EXPLORE_ROW} disabled:opacity-40`}
            >
              {row(t('logOut'))}
            </button>
          </li>
        </>
      );
    }

    return (
      <>
        <li>
          <Link href="/bureaux" onClick={onNavigate} className={EXPLORE_ROW}>
            {row(t('exploreBureaux'), t('exploreBureauxDesc'))}
          </Link>
        </li>
        <li>
          <Link href="/signin" onClick={onNavigate} className={EXPLORE_ROW}>
            {row(t('signIn'), t('exploreSignInDesc'))}
          </Link>
        </li>
      </>
    );
  }

  const linkClass =
    className || 'font-sans text-[15px] font-semibold text-[#0B0B0C] hover:opacity-70';

  if (signedIn === null) {
    return (
      <span className={`${linkClass} opacity-40`} aria-hidden>
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
        <Link href="/account/voyages" onClick={onNavigate} className={linkClass}>
          {t('account')}
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className={`${linkClass} text-left disabled:opacity-40`}
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
          className={`${linkClass} inline-flex items-center gap-1.5`}
        >
          <span>{t('joinBureaux')}</span>
          <Icon name="arrowRight" className="h-3.5 w-3.5 opacity-55" />
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className={`${linkClass} text-left opacity-80 disabled:opacity-40`}
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
        className={`${linkClass} inline-flex items-center gap-1.5`}
      >
        <span>{t('joinBureaux')}</span>
        <Icon name="arrowRight" className="h-3.5 w-3.5 opacity-55" />
      </Link>
      <Link
        href="/signin"
        onClick={onNavigate}
        className={`${linkClass} text-left opacity-80 hover:opacity-100`}
      >
        {t('signIn')}
      </Link>
    </div>
  );
}
