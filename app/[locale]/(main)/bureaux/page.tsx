import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { getTranslations } from 'next-intl/server';
import { Link, redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import BureauxCheckoutLazy from '@/components/BureauxCheckoutLazy';
import BureauxHero from '@/components/BureauxHero';
import BureauxHouseFooter from '@/components/HouseScrollFooter';
import BureauxIncludedList from '@/components/BureauxIncludedList';
import BureauxJoinClaim from '@/components/BureauxJoinClaim';
import BureauxJoinedRefresh from '@/components/BureauxJoinedRefresh';
import {
  getBureauxAnnualAmountCents,
  getOwnBureauxMembership,
  isBureauxMembershipActive,
} from '@/lib/bureaux';
import { syncBureauxGiftFromCheckoutSession } from '@/lib/bureaux-gift';

function formatAnnualPrice(cents: number, locale: string) {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(cents / 100);
  } catch {
    return `$${Math.round(cents / 100)}`;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');
  const title = t('bureauxTitle');
  const description = t('bureauxDescription');
  return {
    title,
    description,
    alternates: { canonical: '/bureaux' },
    openGraph: {
      title: `${title} | Fjorr`,
      description,
      url: 'https://www.fjorr.com/bureaux',
      type: 'website',
    },
    twitter: {
      title: `${title} | Fjorr`,
      description,
    },
  };
}

function safeNextPath(raw?: string) {
  if (typeof raw === 'string' && raw.startsWith('/') && !raw.startsWith('//')) {
    return raw;
  }
  return '/account/bureaux';
}

export default async function BureauxPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    joined?: string;
    email?: string;
    gift?: string;
    session_id?: string;
    next?: string;
  }>;
}) {
  const { locale } = await params;
  const {
    joined,
    email: joinedEmailRaw,
    gift,
    session_id: giftSessionId,
    next: nextRaw,
  } = await searchParams;
  const nextPath = safeNextPath(nextRaw);
  const joinedEmail =
    typeof joinedEmailRaw === 'string' && joinedEmailRaw.includes('@')
      ? joinedEmailRaw.trim().toLowerCase()
      : null;
  const t = await getTranslations('Bureaux');
  const ta = await getTranslations('Account');
  const price = formatAnnualPrice(getBureauxAnnualAmountCents(), locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && gift === '1' && giftSessionId) {
    try {
      await syncBureauxGiftFromCheckoutSession(giftSessionId, user.id);
    } catch (err) {
      console.error('gift session sync failed:', err);
    }
    redirect({ href: '/account/bureaux?gift=1', locale });
  }

  const membership = user ? await getOwnBureauxMembership(user.id) : null;
  const active = isBureauxMembershipActive(membership);
  const justJoined = joined === '1';

  // Members manage billing / gift seat under Account → The Bureaux.
  if (user && active) {
    redirect({
      href: justJoined ? '/account/bureaux?joined=1' : '/account/bureaux',
      locale,
    });
  }

  const joinBlock = (
    <div className="mx-auto flex w-full flex-col items-center">
      {justJoined && user ? (
        <p className="mb-4 text-center font-sans text-[14px] leading-relaxed text-page-muted">
          {ta('bureauxJoining')}
        </p>
      ) : null}
      {justJoined && user && !active ? <BureauxJoinedRefresh /> : null}
      {justJoined && !user && joinedEmail ? (
        <BureauxJoinClaim email={joinedEmail} nextPath={nextPath} />
      ) : (
        <BureauxCheckoutLazy
          signedIn={Boolean(user)}
          accountEmail={user?.email || null}
          price={price}
          nextPath={nextPath}
        />
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen w-full flex-col bg-white text-[#0B0B0C]">
      <BureauxHero title={t('headline')} />

      <div
        className="flex w-full flex-1 flex-col pb-24 md:pb-28 lg:pb-32"
        style={
          {
            ['--page-bg' as string]: '#ffffff',
            ['--page-bg-color' as string]: '#ffffff',
            ['--page-fg' as string]: '#0B0B0C',
            ['--page-muted' as string]: 'rgba(11, 11, 12, 0.55)',
          } as CSSProperties
        }
      >
        <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-5 pt-14 text-center md:max-w-4xl md:px-[60px] md:pt-16 lg:px-[100px] lg:pt-20">
          <h2 className="m-0 max-w-[22ch] font-interTight text-[clamp(2rem,5.5vw,3.25rem)] font-bold leading-[1.05] tracking-tight text-[#0B0B0C] select-none">
            {t('subhead')}
          </h2>
          <p className="mt-5 max-w-xl font-interTight text-[21px] font-semibold leading-normal tracking-tight text-[#0B0B0C]/75 text-pretty select-none sm:mt-6">
            {t('lead')}
          </p>
          <p className="mt-4 m-0">
            <Link
              href="/about"
              className="font-sans text-[14px] font-semibold tracking-tight text-[#0B0B0C]/55 underline underline-offset-[3px] transition-colors hover:text-[#0B0B0C]"
            >
              {t('learnMore')}
            </Link>
          </p>

          <div className="mt-10 w-full sm:mt-12">
            <BureauxIncludedList align="center" />
          </div>

          <div className="mt-10 w-full sm:mt-12">{joinBlock}</div>
        </section>
      </div>

      <BureauxHouseFooter />
    </div>
  );
}
