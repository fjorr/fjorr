import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import AccountShell from '@/components/AccountShell';
import CabinetOffersLedger from '@/components/CabinetOffersLedger';
import { requireOwnAccount } from '@/lib/account-session';
import { getOwnCabinetOffers } from '@/lib/cabinet-offer-actions';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');
  return {
    title: t('accountCabinetTitle'),
    robots: { index: false, follow: false },
  };
}

export default async function AccountCabinetPage() {
  const { user, profile } = await requireOwnAccount('/account/cabinet');
  const offers = await getOwnCabinetOffers(user.id);
  const t = await getTranslations('Account');

  return (
    <AccountShell
      profile={profile}
      title={t('cabinetTitle')}
      description={t('cabinetBody')}
      headerLinks={[{ href: '/cabinet', label: t('cabinetLinkPublic') }]}
      manualSlug="cabinet"
      wide
      introNarrow
    >
      <CabinetOffersLedger offers={offers} omitHeader />
    </AccountShell>
  );
}
