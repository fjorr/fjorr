import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import AccountShell from '@/components/AccountShell';
import NominationsLedger from '@/components/NominationsLedger';
import { requireOwnAccount } from '@/lib/account-session';
import { getOwnNominations } from '@/lib/nomination-actions';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');
  return {
    title: t('accountNominationsTitle'),
    robots: { index: false, follow: false },
  };
}

export default async function AccountNominationsPage() {
  const { profile } = await requireOwnAccount('/account/nominations');
  const nominations = await getOwnNominations();
  const t = await getTranslations('Account');

  return (
    <AccountShell
      profile={profile}
      title={t('nominationsTitle')}
      description={t('nominationsBody')}
      wide
    >
      <NominationsLedger nominations={nominations} omitHeader />
    </AccountShell>
  );
}
