import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getLocale, getTranslations } from 'next-intl/server';
import AccountDeleteAccount from '@/components/AccountDeleteAccount';
import AccountShell from '@/components/AccountShell';
import BureauxAccountActions from '@/components/BureauxAccountActions';
import BureauxCancelMembership from '@/components/BureauxCancelMembership';
import BureauxGiftSeat from '@/components/BureauxGiftSeat';
import { requireOwnAccount } from '@/lib/account-session';
import {
  ensureBureauxNumber,
  getOwnBureauxLineage,
  getOwnBureauxMembership,
  isBureauxMembershipActive,
} from '@/lib/bureaux';
import { getOwnBureauxCardOnFile } from '@/lib/bureaux-actions';
import {
  getOwnGiftSeatState,
  syncBureauxGiftFromCheckoutSession,
} from '@/lib/bureaux-gift';
import { appUrl } from '@/lib/site';

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

function SpecRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] sm:grid-cols-[8.5rem_1fr] gap-x-3 items-baseline text-sm">
      <span className="text-page-faint font-medium">{label}</span>
      <span className="text-page font-medium">{value}</span>
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
  searchParams: Promise<{ gift?: string; session_id?: string; joined?: string }>;
}) {
  const { user, profile } = await requireOwnAccount('/account/bureaux');
  const { gift, session_id: giftSessionId, joined } = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations('Account');
  const justJoined = joined === '1';

  if (gift === '1' && giftSessionId) {
    try {
      await syncBureauxGiftFromCheckoutSession(giftSessionId, user.id);
    } catch (err) {
      console.error('gift session sync failed:', err);
    }
  }

  let membership = await getOwnBureauxMembership(user.id);
  const active = isBureauxMembershipActive(membership);
  if (active && membership && !membership.bureaux_number) {
    const n = await ensureBureauxNumber(user.id);
    if (n) membership = { ...membership, bureaux_number: n };
  }

  const [lineage, giftSeat, card] = await Promise.all([
    active ? getOwnBureauxLineage(user.id) : Promise.resolve(null),
    active ? getOwnGiftSeatState(user.id) : Promise.resolve(null),
    active && !membership?.comp_lifetime
      ? getOwnBureauxCardOnFile(membership)
      : Promise.resolve(null),
  ]);

  const openGiftUrl =
    giftSeat?.openGift?.status === 'open'
      ? appUrl(`/bureaux/gift/${giftSeat.openGift.token}`)
      : null;
  const renews = formatDate(membership?.current_period_end || null, locale);

  return (
    <AccountShell
      profile={profile}
      title={t('bureauxTitle')}
      description={t('bureauxBody')}
      headerLinks={[{ href: '/manual/join', label: t('viewManual') }]}
      narrow
      introNarrow
    >
      <div className="flex flex-col gap-10">
        {justJoined ? (
          <p className="font-sans text-[14px] text-page-muted leading-relaxed">
            {t('bureauxJoined')}
          </p>
        ) : null}

        <section className="flex flex-col gap-2.5">
          <SpecRow
            label={t('displayName')}
            value={
              <span className="truncate">
                {profile.display_name?.trim() || '—'}
              </span>
            }
          />
          <SpecRow
            label={t('email')}
            value={
              <span className="truncate">{user.email || '—'}</span>
            }
          />
          <SpecRow label={t('bureauxStatus')} value={t('bureauxStatusActive')} />
          {membership?.bureaux_number != null ? (
            <SpecRow
              label={t('bureauxNo')}
              value={
                <span className="font-sans tabular-nums">
                  {membership.bureaux_number}
                </span>
              }
            />
          ) : null}
          {membership?.comp_lifetime ? (
            <SpecRow
              label={t('bureauxLifetime')}
              value={t('bureauxLifetimeYes')}
            />
          ) : renews ? (
            <SpecRow
              label={
                membership?.cancel_at_period_end
                  ? t('bureauxEnds')
                  : t('bureauxRenews')
              }
              value={
                <span className="font-sans tabular-nums">{renews}</span>
              }
            />
          ) : null}
          {card ? (
            <SpecRow
              label={t('bureauxCard')}
              value={
                <span className="font-sans tabular-nums">
                  {t('bureauxCardValue', {
                    brand: card.brand,
                    last4: card.last4,
                  })}
                </span>
              }
            />
          ) : null}
          {lineage?.sponsoredByNumber != null ? (
            <SpecRow
              label={t('bureauxBroughtBy')}
              value={
                <span className="font-sans tabular-nums">
                  № {lineage.sponsoredByNumber}
                </span>
              }
            />
          ) : null}
          {lineage && lineage.broughtInCount > 0 ? (
            <SpecRow
              label={t('bureauxBroughtIn')}
              value={
                <span className="font-sans tabular-nums">
                  {lineage.broughtInCount}
                </span>
              }
            />
          ) : null}
        </section>

        <BureauxAccountActions
          currentName={profile.display_name?.trim() || ''}
          currentEmail={user.email || ''}
          showCardUpdate={!membership?.comp_lifetime}
          returnPath="/account/bureaux"
        />

        {giftSeat ? (
          <BureauxGiftSeat
            canGift={giftSeat.canGift}
            reason={giftSeat.reason}
            openGiftUrl={openGiftUrl}
            openGiftEmail={giftSeat.openGift?.to_email || null}
          />
        ) : null}

        <div className="flex flex-col gap-6">
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
