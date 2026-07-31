import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import AccountShell from '@/components/AccountShell';
import BureauxEmbeddedCheckout from '@/components/BureauxEmbeddedCheckout';
import BureauxPortalButton from '@/components/BureauxPortalButton';
import { requireOwnAccount } from '@/lib/account-session';
import {
  getBureauxAnnualAmountCents,
  getOwnBureauxMembership,
  isBureauxMembershipActive,
} from '@/lib/bureaux';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');
  return {
    title: t('accountBureauxTitle'),
    robots: { index: false, follow: false },
  };
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

export default async function AccountBureauxPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ joined?: string }>;
}) {
  const { locale } = await params;
  const { joined } = await searchParams;
  const { user, profile } = await requireOwnAccount('/account/bureaux');
  const t = await getTranslations('Account');
  const tb = await getTranslations('Bureaux');
  const membership = await getOwnBureauxMembership(user.id);
  const active = isBureauxMembershipActive(membership);
  const renews = formatDate(membership?.current_period_end || null, locale);
  const price = formatAnnualPrice(getBureauxAnnualAmountCents(), locale);
  const justJoined = joined === '1';

  return (
    <AccountShell
      profile={profile}
      title={t('bureauxTitle')}
      description={t('bureauxBody')}
      narrow
    >
      <div className="flex flex-col gap-8">
        {justJoined ? (
          <p className="font-sans text-[14px] text-page-muted leading-relaxed">
            {active ? t('bureauxJoined') : t('bureauxJoining')}
          </p>
        ) : null}

        <section className="flex flex-col divide-y divide-page-faint border-y border-page-faint">
          <div className="py-4 flex items-baseline justify-between gap-4">
            <span className="font-sans text-[14px] text-page-muted">
              {t('bureauxStatus')}
            </span>
            <span className="font-sans text-[15px] font-semibold text-page">
              {active ? t('bureauxStatusActive') : t('bureauxStatusNone')}
            </span>
          </div>
          {active && renews ? (
            <div className="py-4 flex items-baseline justify-between gap-4">
              <span className="font-sans text-[14px] text-page-muted">
                {membership?.cancel_at_period_end
                  ? t('bureauxEnds')
                  : t('bureauxRenews')}
              </span>
              <span className="font-mono text-[14px] text-page tabular-nums">
                {renews}
              </span>
            </div>
          ) : null}
          <div className="py-4 flex items-baseline justify-between gap-4">
            <span className="font-sans text-[14px] text-page-muted">
              {tb('priceLabel')}
            </span>
            <span className="font-mono text-[14px] text-page tabular-nums">
              {tb('priceValue', { price })}
            </span>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-page-faint">
            {tb('perksTitle')}
          </h2>
          <ul className="m-0 p-0 list-none flex flex-col gap-2">
            <li className="font-sans text-[14px] text-page-muted leading-snug">
              {tb('perkNumber')}
            </li>
            <li className="font-sans text-[14px] text-page-muted leading-snug">
              {tb('perkEarlyFilms')}
            </li>
            <li className="font-sans text-[14px] text-page-muted leading-snug">
              {tb('perkEarlyBounties')}
            </li>
            <li className="font-sans text-[14px] text-page-muted leading-snug">
              {tb('perkCredits')}
            </li>
            <li className="font-sans text-[14px] text-page-muted leading-snug">
              {tb('perkBehind')}
            </li>
            <li className="font-sans text-[14px] text-page-muted leading-snug">
              {tb('perkLetter')}
            </li>
          </ul>
        </section>

        <div className="flex flex-col gap-4 items-start w-full">
          {active ? (
            <BureauxPortalButton
              label={t('bureauxManage')}
              pendingLabel={t('bureauxPending')}
            />
          ) : (
            <div className="w-full flex flex-col gap-3">
              <h2 className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-page-faint">
                {tb('checkoutTitle')}
              </h2>
              <BureauxEmbeddedCheckout />
            </div>
          )}
          <Link
            href="/bureaux"
            className="font-sans text-[13px] font-semibold text-page-faint hover:text-page-muted transition-colors"
          >
            {t('bureauxAbout')}
          </Link>
        </div>
      </div>
    </AccountShell>
  );
}
