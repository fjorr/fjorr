import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getLocale, getTranslations } from 'next-intl/server';
import AccountDeleteAccount from '@/components/AccountDeleteAccount';
import AccountShell from '@/components/AccountShell';
import BureauxAccountActions from '@/components/BureauxAccountActions';
import BureauxCancelMembership from '@/components/BureauxCancelMembership';
import BureauxCardPill from '@/components/BureauxCardPill';
import { requireOwnAccount } from '@/lib/account-session';
import {
  ensureBureauxNumber,
  getOwnBureauxLineage,
  getOwnBureauxMembership,
  isBureauxMembershipActive,
} from '@/lib/bureaux';
import { getOwnBureauxCardOnFile } from '@/lib/bureaux-actions';

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

function InfoPill({
  label,
  value,
  numeric = false,
}: {
  label: string;
  value: ReactNode;
  numeric?: boolean;
}) {
  return (
    <div className="flex h-12 w-full items-center justify-between gap-3 rounded-full bg-[#F5F5F7] pl-8 pr-8">
      <span className="shrink-0 font-sans text-[16px] font-medium text-black/35">
        {label}
      </span>
      <span
        className={`min-w-0 truncate text-right font-sans text-[16px] font-medium text-[#0B0B0C] ${
          numeric ? 'tabular-nums' : ''
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');
  return {
    title: t('accountBureauxTitle'),
    robots: { index: false, follow: false },
  };
}

export default async function AccountBureauxPage({
  searchParams,
}: {
  searchParams: Promise<{ joined?: string }>;
}) {
  const { user, profile } = await requireOwnAccount('/account/bureaux');
  const { joined } = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations('Account');
  const justJoined = joined === '1';

  let membership = await getOwnBureauxMembership(user.id);
  const active = isBureauxMembershipActive(membership);
  if (active && membership && !membership.bureaux_number) {
    const n = await ensureBureauxNumber(user.id);
    if (n) membership = { ...membership, bureaux_number: n };
  }

  const [lineage, card] = await Promise.all([
    active ? getOwnBureauxLineage(user.id) : Promise.resolve(null),
    active && !membership?.comp_lifetime
      ? getOwnBureauxCardOnFile(membership)
      : Promise.resolve(null),
  ]);

  const renews = formatDate(membership?.current_period_end || null, locale);

  return (
    <AccountShell profile={profile} narrow centered>
      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-10 text-center">
        {justJoined ? (
          <p className="font-sans text-[14px] text-page-muted leading-relaxed">
            {t('bureauxJoined')}
          </p>
        ) : null}

        <h1 className="m-0 select-none font-[family-name:var(--font-circular-black)] text-3xl font-[900] leading-[1.05] tracking-[-0.03em] text-[#0B0B0C] sm:text-4xl">
          {t('bureauxTitle')}
        </h1>

        <div className="flex w-full flex-col gap-3">
          <BureauxAccountActions
            currentName={profile.display_name?.trim() || ''}
            currentEmail={user.email || ''}
          />
          <InfoPill label={t('bureauxStatus')} value={t('bureauxStatusActive')} />
          {membership?.bureaux_number != null ? (
            <InfoPill
              label={t('bureauxNo')}
              value={membership.bureaux_number}
              numeric
            />
          ) : null}
          {membership?.comp_lifetime ? (
            <InfoPill
              label={t('bureauxLifetime')}
              value={t('bureauxLifetimeYes')}
            />
          ) : renews ? (
            <InfoPill
              label={
                membership?.cancel_at_period_end
                  ? t('bureauxEnds')
                  : t('bureauxRenews')
              }
              value={renews}
              numeric
            />
          ) : null}
          {!membership?.comp_lifetime ? (
            <BureauxCardPill
              label={t('bureauxCard')}
              value={
                card
                  ? t('bureauxCardValue', {
                      brand: card.brand,
                      last4: card.last4,
                    })
                  : '—'
              }
              returnPath="/account/bureaux"
            />
          ) : null}
          {lineage?.sponsoredByNumber != null ? (
            <InfoPill
              label={t('bureauxBroughtBy')}
              value={`№ ${lineage.sponsoredByNumber}`}
              numeric
            />
          ) : null}
          {lineage && lineage.broughtInCount > 0 ? (
            <InfoPill
              label={t('bureauxBroughtIn')}
              value={lineage.broughtInCount}
              numeric
            />
          ) : null}
        </div>

        <div className="flex w-full flex-col items-center gap-2">
          {!membership?.comp_lifetime ? (
            <BureauxCancelMembership
              cancelAtPeriodEnd={Boolean(membership?.cancel_at_period_end)}
            />
          ) : null}
          <AccountDeleteAccount />
        </div>
      </div>
    </AccountShell>
  );
}
