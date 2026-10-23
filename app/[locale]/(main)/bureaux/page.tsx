import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import type { AppLocale } from '@/i18n/config';
import { buildAlternates } from '@/lib/seo/alternates';
import { marketingShareImages } from '@/lib/seo/og';
import { redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import BureauxCheckoutLazy from '@/components/BureauxCheckoutLazy';
import BureauxJoinClaim from '@/components/BureauxJoinClaim';
import BureauxJoinedRefresh from '@/components/BureauxJoinedRefresh';
import HouseScrollFooter from '@/components/HouseScrollFooter';
import {
  getBureauxMonthlyAmountCents,
  getBureauxNumberForEmail,
  getOwnBureauxMembership,
  isBureauxMembershipActive,
} from '@/lib/bureaux';
import { syncBureauxGiftFromCheckoutSession } from '@/lib/bureaux-gift';

function formatPrice(cents: number, locale: string) {
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
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations('Meta');
  const title = t('bureauxTitle');
  const description = t('bureauxDescription');
  const { openGraphImages, twitterImages } = marketingShareImages(title);
  return {
    title,
    description,
    alternates: buildAlternates('/bureaux', locale),
    openGraph: {
      title: `${title} | Fjorr`,
      description,
      url: 'https://www.fjorr.com/bureaux',
      type: 'website',
      images: openGraphImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Fjorr`,
      description,
      images: twitterImages,
    },
  };
}

const HEAD =
  "m-0 text-balance font-[family-name:var(--font-circular-black)] text-[clamp(2.25rem,5.5vw,3rem)] font-[900] leading-[1.05] tracking-[-0.03em] text-[#0B0B0C]";
const LEAD =
  'm-0 mt-4 max-w-[26rem] text-center font-sans text-[16px] font-medium leading-relaxed text-black/55 md:text-[17px]';

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
  const tb = await getTranslations('Bureaux');
  const price = formatPrice(getBureauxMonthlyAmountCents(), locale);

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

  const checkout = (
    <BureauxCheckoutLazy
      signedIn={Boolean(user)}
      accountEmail={user?.email || null}
      price={price}
      nextPath={nextPath}
      autoStart
    />
  );

  const waitingOnWebhook = Boolean(justJoined && user && !active);

  return (
    <div className="flex min-h-[calc(100dvh-56px)] w-full flex-col bg-white text-[#0B0B0C]">
      <div className="flex w-full flex-1 items-center justify-center px-6 py-16">
        {claimMode ? (
          <BureauxJoinClaim
            email={claimEmail || 'you@fjorr.com'}
            nextPath={nextPath}
            autoSend={preview !== 'claim'}
            bureauxNumber={claimNumber}
          />
        ) : waitingOnWebhook ? (
          <div className="flex w-full max-w-[22rem] flex-col items-center text-center">
            <h1 className={HEAD}>{tb('alreadyIn')}</h1>
            <p className={LEAD}>{ta('bureauxJoining')}</p>
            <BureauxJoinedRefresh />
          </div>
        ) : (
          checkout
        )}
      </div>
      <HouseScrollFooter />
    </div>
  );
}
