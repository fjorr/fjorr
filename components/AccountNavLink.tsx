'use client';

import React, { useEffect, useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/ui/Icons';
import { createClient } from '@/lib/supabase/client';

type MenuProfile = {
  display_name: string;
  member_number: number;
};

/** Sign in / Account / Log out for the hamburger explore list. */
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
  const [profile, setProfile] = useState<MenuProfile | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    const loadProfile = async () => {
      const { data: rpc, error } = await supabase.rpc('ensure_own_profile');
      if (!mounted) return;
      if (!error && rpc) {
        setProfile({
          display_name: String(rpc.display_name || '').trim(),
          member_number: Number(rpc.member_number),
        });
        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!mounted || !user) return;
      const { data: row } = await supabase
        .from('profiles')
        .select('display_name, member_number')
        .eq('id', user.id)
        .maybeSingle();
      if (!mounted || !row) return;
      setProfile({
        display_name: String(row.display_name || '').trim(),
        member_number: Number(row.member_number),
      });
    };

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const next = !!data.session;
      setSignedIn(next);
      if (next) void loadProfile();
      else setProfile(null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const next = !!session;
      setSignedIn(next);
      if (next) void loadProfile();
      else setProfile(null);
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

  if (signedIn) {
    const name = profile?.display_name || null;
    const number =
      profile?.member_number && Number.isFinite(profile.member_number)
        ? profile.member_number
        : null;

    return (
      <div className="flex flex-col gap-1.5">
        {(name || number != null) && (
          <p
            className={
              mutedClassName ||
              'font-sans text-[13px] font-medium leading-snug text-white/35'
            }
          >
            {number != null && name
              ? t('memberLine', { number, name })
              : number != null
                ? t('memberNumberOnly', { number })
                : name}
          </p>
        )}
        <Link href="/account" onClick={onNavigate} className={className}>
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
