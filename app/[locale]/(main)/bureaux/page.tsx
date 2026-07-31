import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import BureauxCheckout from '@/components/BureauxCheckout';
import BureauxJoinedRefresh from '@/components/BureauxJoinedRefresh';
import BureauxManage from '@/components/BureauxManage';
import {
  ensureBureauxNumber,
  getBureauxAnnualAmountCents,
  getOwnBureauxMembership,
  isBureauxMembershipActive,
} from '@/lib/bureaux';

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

function formatDate(iso: string | null, locale: string) {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return null;
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
  searchParams: Promise<{ joined?: string }>;
}) {
  const { locale } = await params;
  const { joined } = await searchParams;
  const t = await getTranslations('Bureaux');
  const ta = await getTranslations('Account');
  const price = formatAnnualPrice(getBureauxAnnualAmountCents(), locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let membership = user ? await getOwnBureauxMembership(user.id) : null;
  const active = isBureauxMembershipActive(membership);
  if (active && membership && !membership.bureaux_number && user) {
    const n = await ensureBureauxNumber(user.id);
    if (n) membership = { ...membership, bureaux_number: n };
  }

  const renews = formatDate(membership?.current_period_end || null, locale);
  const justJoined = joined === '1';

  const perks = [
    t('perkNumber'),
    t('perkEarlyFilms'),
    t('perkEarlyBounties'),
    t('perkCredits'),
    t('perkBehind'),
    t('perkLetter'),
  ];

  return (
    <div className="w-full min-h-screen bg-page text-page pb-24">
      <div className="w-full max-w-xl mx-auto px-5 sm:px-8 pt-14 sm:pt-20 flex flex-col gap-10 text-left">
        <header className="flex flex-col gap-4">
          <p className="font-sans text-[13px] font-semibold uppercase tracking-[0.08em] text-page-faint">
            {t('eyebrow')}
          </p>
          <h1 className="font-futura text-4xl sm:text-5xl md:text-6xl tracking-tighter text-page select-none !leading-[0.95]">
            {t('headline')}
          </h1>
          <p className="font-sans text-[16px] sm:text-[17px] font-medium text-page leading-relaxed">
            {t('dek')}
          </p>
          <div className="flex flex-col gap-4">
            <p className="font-sans text-[16px] text-page-muted leading-relaxed">
              {t('lead')}
            </p>
            <p className="font-sans text-[16px] text-page-muted leading-relaxed">
              {t('lead2')}
            </p>
          </div>
        </header>

        {justJoined ? (
          <p className="font-sans text-[14px] text-page-muted leading-relaxed">
            {active ? ta('bureauxJoined') : ta('bureauxJoining')}
          </p>
        ) : null}
        {justJoined && !active ? <BureauxJoinedRefresh /> : null}

        <section className="flex flex-col divide-y divide-page-faint border-y border-page-faint">
          {active ? (
            <>
              <div className="py-4 flex items-baseline justify-between gap-4">
                <span className="font-sans text-[14px] text-page-muted">
                  {ta('bureauxStatus')}
                </span>
                <span className="font-sans text-[15px] font-semibold text-page">
                  {ta('bureauxStatusActive')}
                </span>
              </div>
              {membership?.bureaux_number != null ? (
                <div className="py-4 flex items-baseline justify-between gap-4">
                  <span className="font-sans text-[14px] text-page-muted">
                    {ta('bureauxNo')}
                  </span>
                  <span className="font-mono text-[15px] text-page tabular-nums">
                    {membership.bureaux_number}
                  </span>
                </div>
              ) : null}
              {renews ? (
                <div className="py-4 flex items-baseline justify-between gap-4">
                  <span className="font-sans text-[14px] text-page-muted">
                    {membership?.cancel_at_period_end
                      ? ta('bureauxEnds')
                      : ta('bureauxRenews')}
                  </span>
                  <span className="font-mono text-[15px] text-page tabular-nums">
                    {renews}
                  </span>
                </div>
              ) : null}
            </>
          ) : null}
          <div className="py-4 flex items-baseline justify-between gap-4">
            <span className="font-sans text-[14px] text-page-muted">
              {t('priceLabel')}
            </span>
            <span className="font-mono text-[15px] text-page tabular-nums">
              {t('priceValue', { price })}
            </span>
          </div>
          <div className="py-4 flex items-baseline justify-between gap-4">
            <span className="font-sans text-[14px] text-page-muted">
              {t('accessLabel')}
            </span>
            <span className="font-sans text-[15px] text-page">
              {t('accessValue')}
            </span>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-page-faint">
            {t('perksTitle')}
          </h2>
          <ul className="m-0 p-0 list-none flex flex-col divide-y divide-page-faint border-y border-page-faint">
            {perks.map((line) => (
              <li
                key={line}
                className="py-3.5 font-sans text-[14px] text-page leading-snug"
              >
                {line}
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-4">
          {active ? (
            <BureauxManage
              cancelAtPeriodEnd={Boolean(membership?.cancel_at_period_end)}
            />
          ) : user ? (
            <BureauxCheckout />
          ) : (
            <Link
              href={`/signin?next=${encodeURIComponent('/bureaux')}`}
              className="self-start inline-flex items-center h-12 px-7 rounded-full bg-[var(--page-fg)] text-[var(--page-bg)] font-sans text-[14px] font-bold hover:opacity-90 transition-opacity"
            >
              {t('ctaSubscribe')}
            </Link>
          )}
          <p className="font-sans text-[13px] text-page-faint leading-relaxed max-w-sm">
            {t('footnote')}
          </p>
        </section>
      </div>
    </div>
  );
}
