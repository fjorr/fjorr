import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import AccountShell from '@/components/AccountShell';
import BureauxGiftSeat from '@/components/BureauxGiftSeat';
import BureauxManage from '@/components/BureauxManage';
import { requireOwnAccount } from '@/lib/account-session';
import {
  ensureBureauxNumber,
  getOwnBureauxLineage,
  getOwnBureauxMembership,
  isBureauxMembershipActive,
} from '@/lib/bureaux';
import {
  getOwnGiftSeatState,
  syncBureauxGiftFromCheckoutSession,
} from '@/lib/bureaux-gift';
import { appUrl } from '@/lib/site';
import { Link } from '@/i18n/navigation';

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
  const tb = await getTranslations('Bureaux');
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

  const lineage = active ? await getOwnBureauxLineage(user.id) : null;
  const giftSeat = active ? await getOwnGiftSeatState(user.id) : null;
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
      headerLinks={[{ href: '/manual/join', label: 'Manual · Join' }]}
      narrow
    >
      <div className="flex flex-col gap-10">
        {justJoined ? (
          <p className="font-sans text-[14px] text-page-muted leading-relaxed">
            {t('bureauxJoined')}
          </p>
        ) : null}

        <section className="flex flex-col divide-y divide-page-faint border-y border-page-faint">
          <div className="py-4 flex items-baseline justify-between gap-4">
            <span className="font-sans text-[14px] text-page-muted">
              {t('bureauxStatus')}
            </span>
            <span className="font-sans text-[15px] font-semibold text-page">
              {t('bureauxStatusActive')}
            </span>
          </div>
          {membership?.bureaux_number != null ? (
            <div className="py-4 flex items-baseline justify-between gap-4">
              <span className="font-sans text-[14px] text-page-muted">
                {t('bureauxNo')}
              </span>
              <span className="font-mono text-[15px] text-page tabular-nums">
                {membership.bureaux_number}
              </span>
            </div>
          ) : null}
          {membership?.comp_lifetime ? (
            <div className="py-4 flex items-baseline justify-between gap-4">
              <span className="font-sans text-[14px] text-page-muted">
                {t('bureauxLifetime')}
              </span>
              <span className="font-sans text-[15px] font-semibold text-page">
                {t('bureauxLifetimeYes')}
              </span>
            </div>
          ) : renews ? (
            <div className="py-4 flex items-baseline justify-between gap-4">
              <span className="font-sans text-[14px] text-page-muted">
                {membership?.cancel_at_period_end
                  ? t('bureauxEnds')
                  : t('bureauxRenews')}
              </span>
              <span className="font-mono text-[15px] text-page tabular-nums">
                {renews}
              </span>
            </div>
          ) : null}
          {lineage?.sponsoredByNumber != null ? (
            <div className="py-4 flex items-baseline justify-between gap-4">
              <span className="font-sans text-[14px] text-page-muted">
                {t('bureauxBroughtBy')}
              </span>
              <span className="font-mono text-[15px] text-page tabular-nums">
                № {lineage.sponsoredByNumber}
              </span>
            </div>
          ) : null}
          {lineage && lineage.broughtInCount > 0 ? (
            <div className="py-4 flex items-baseline justify-between gap-4">
              <span className="font-sans text-[14px] text-page-muted">
                {t('bureauxBroughtIn')}
              </span>
              <span className="font-mono text-[15px] text-page tabular-nums">
                {lineage.broughtInCount}
              </span>
            </div>
          ) : null}
        </section>

        {!membership?.comp_lifetime ? (
          <BureauxManage
            cancelAtPeriodEnd={Boolean(membership?.cancel_at_period_end)}
            returnPath="/account/bureaux"
          />
        ) : null}

        {giftSeat ? (
          <BureauxGiftSeat
            canGift={giftSeat.canGift}
            reason={giftSeat.reason}
            openGiftUrl={openGiftUrl}
            openGiftEmail={giftSeat.openGift?.to_email || null}
          />
        ) : null}

        <p className="font-sans text-[13px] text-page-faint leading-relaxed max-w-sm">
          {tb('footnote')}{' '}
          <Link
            href="/manual/join"
            className="font-semibold text-page-muted underline underline-offset-2 hover:text-page transition-colors"
          >
            Manual · Join
          </Link>
          {' · '}
          <Link
            href="/manual/cancel"
            className="font-semibold text-page-muted underline underline-offset-2 hover:text-page transition-colors"
          >
            Cancel
          </Link>
          .
        </p>
      </div>
    </AccountShell>
  );
}
