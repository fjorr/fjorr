import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import BureauxCheckout from '@/components/BureauxCheckout';
import BureauxJoinClaim from '@/components/BureauxJoinClaim';
import BureauxJoinedRefresh from '@/components/BureauxJoinedRefresh';
import ManualHelpButton from '@/components/help/ManualHelpButton';
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
  }>;
}) {
  const { locale } = await params;
  const {
    joined,
    email: joinedEmailRaw,
    gift,
    session_id: giftSessionId,
  } = await searchParams;
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

  const perks = [
    t('perkNominate'),
    t('perkBounties'),
    t('perkPlus'),
    t('perkEarly'),
    t('perkBehind'),
    t('perkNumber'),
  ];

  return (
    <div className="w-full min-h-screen bg-[var(--page-bg)] text-page pb-24">
      <div className="w-full max-w-4xl mx-auto px-[10%] pt-14 sm:pt-20 flex flex-col items-center text-center">
        <div className="w-full max-w-xl flex flex-col items-center">
          <header className="flex flex-col items-center w-full">
            <p className="font-sans text-lg sm:text-xl font-semibold normal-case tracking-normal text-page select-none">
              {t('eyebrow')}
            </p>
            <h1 className="mt-2 sm:mt-2.5 mb-5 sm:mb-6 font-futura tracking-tighter text-page select-none text-5xl sm:text-6xl md:text-7xl !leading-[0.95] w-full whitespace-pre-line text-center">
              {t('headline')}
            </h1>
            <p className="m-0 font-sans font-medium text-[16px] leading-[1.55] tracking-normal text-page max-w-xl text-center">
              {t('lead')}
            </p>
          </header>

          <section className="mt-7 w-full flex justify-center">
            <div className="w-full flex flex-col gap-2 text-left">
              <h2 className="m-0 font-sans text-[12px] font-semibold text-page-muted select-none">
                {t('perksTitle')}
              </h2>
              <ul className="m-0 p-0 list-none flex flex-col border-y border-[color-mix(in_srgb,var(--page-fg)_12%,transparent)] divide-y divide-[color-mix(in_srgb,var(--page-fg)_12%,transparent)]">
                {perks.map((line) => (
                  <li
                    key={line}
                    className="py-2 font-sans text-[14px] text-page leading-snug"
                  >
                    {line}
                  </li>
                ))}
              </ul>
              <p className="m-0 pt-0.5 font-sans text-[14px] font-semibold text-page leading-snug">
                {t('perkClosing')}
              </p>
            </div>
          </section>

          {justJoined && user ? (
            <p className="mt-8 font-sans text-[14px] text-page-muted leading-relaxed">
              {ta('bureauxJoining')}
            </p>
          ) : null}
          {justJoined && user && !active ? <BureauxJoinedRefresh /> : null}

          <footer className="mt-8 flex flex-col items-center gap-5 w-full text-center">
            {justJoined && !user && joinedEmail ? (
              <BureauxJoinClaim email={joinedEmail} />
            ) : (
              <BureauxCheckout
                signedIn={Boolean(user)}
                accountEmail={user?.email || null}
                price={price}
              />
            )}
            <p className="m-0 font-sans text-[13px] text-page-faint leading-relaxed max-w-sm">
              {t('footnote')}
            </p>
            <ManualHelpButton slug="join" audience="guest" />
          </footer>
        </div>
      </div>
    </div>
  );
}
