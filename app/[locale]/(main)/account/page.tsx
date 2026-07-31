import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import AccountIndex from '@/components/AccountIndex';
import AccountShell from '@/components/AccountShell';
import { requireOwnAccount } from '@/lib/account-session';
import { countOwnActiveNominations } from '@/lib/nomination-actions';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');
  return {
    title: t('accountTitle'),
    robots: { index: false, follow: false },
  };
}

export default async function AccountPage() {
  const { profile } = await requireOwnAccount('/account');
  const nominationsActiveCount = await countOwnActiveNominations();
  const t = await getTranslations('Account');

  return (
    <AccountShell
      profile={profile}
      title={t('accountTitle')}
      description={t('accountBody')}
    >
      <AccountIndex
        profile={profile}
        nominationsActiveCount={nominationsActiveCount}
      />
    </AccountShell>
  );
}
