import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import BureauxCheckoutLazy from '@/components/BureauxCheckoutLazy';
import BureauxJoinStage from '@/components/BureauxJoinStage';
import BureauxJoinClaim from '@/components/BureauxJoinClaim';
import BureauxJoinedRefresh from '@/components/BureauxJoinedRefresh';
import HouseScrollFooter from '@/components/HouseScrollFooter';
import {
  getBureauxAnnualAmountCents,
  getBureauxNumberForEmail,
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
    /** Design preview — claim confirmation without sending OTP. */
    preview?: string;
  }>;
}) {
  const { locale } = await params;
  const {
    joined,
    email: joinedEmailRaw,
    gift,
    session_id: giftSessionId,
    next: nextRaw,
    preview,
  } = await searchParams;
  const nextPath = safeNextPath(nextRaw);
  const joinedEmail =
    typeof joinedEmailRaw === 'string' && joinedEmailRaw.includes('@')
      ? joinedEmailRaw.trim().toLowerCase()
      : null;
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
  if (user && active && preview !== 'claim') {
    redirect({
      href: justJoined ? '/account/bureaux?joined=1' : '/account/bureaux',
      locale,
    });
  }

  const claimMode = Boolean(
    preview === 'claim' || (justJoined && !user && joinedEmail)
  );
  const startInCheckout = Boolean(
    claimMode || justJoined || (joinedEmail && !user)
  );

  const claimEmail =
    preview === 'claim'
      ? joinedEmail || 'you@fjorr.com'
      : justJoined && !user && joinedEmail
        ? joinedEmail
        : null;
  const claimNumber =
    preview === 'claim'
      ? 10482
      : claimEmail
        ? await getBureauxNumberForEmail(claimEmail)
        : null;

  const checkout = claimMode ? (
    <BureauxJoinClaim
      email={claimEmail || 'you@fjorr.com'}
      nextPath={nextPath}
      autoSend={preview !== 'claim'}
      bureauxNumber={claimNumber}
    />
  ) : (
    <div className="flex w-full flex-col items-stretch">
      {justJoined && user ? (
        <p className="mb-4 text-left font-sans text-[14px] leading-relaxed text-page-muted">
          {ta('bureauxJoining')}
        </p>
      ) : null}
      {justJoined && user && !active ? <BureauxJoinedRefresh /> : null}
      <BureauxCheckoutLazy
        signedIn={Boolean(user)}
        accountEmail={user?.email || null}
        price={price}
        nextPath={nextPath}
        autoStart
      />
    </div>
  );

  return (
    <div
      className={`flex min-h-dvh w-full flex-col ${
        claimMode ? 'text-white' : 'text-[#0B0B0C]'
      }`}
      style={{ backgroundColor: claimMode ? '#0B0B0C' : '#F5F5F7' }}
    >
      <BureauxJoinStage
        price={price}
        checkout={checkout}
        startInCheckout={startInCheckout}
        claimMode={claimMode}
      />
      <HouseScrollFooter
        variant={claimMode ? 'light' : 'dark'}
        surfaceClassName={claimMode ? 'bg-[#0B0B0C]' : 'bg-[#F5F5F7]'}
      />
    </div>
  );
}
