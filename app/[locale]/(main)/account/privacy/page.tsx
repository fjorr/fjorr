import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import AccountPrivacyClient from '@/components/AccountPrivacyClient';
import AccountShell from '@/components/AccountShell';
import { requireOwnAccount } from '@/lib/account-session';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');
  return {
    title: t('accountPrivacyTitle'),
    robots: { index: false, follow: false },
  };
}

export default async function AccountPrivacyPage() {
  const { profile } = await requireOwnAccount('/account/privacy');
  const t = await getTranslations('Account');

  return (
    <AccountShell
      profile={profile}
      title={t('privacyTitle')}
      description={t('privacyBody')}
      narrow
    >
      <AccountPrivacyClient profile={profile} />
    </AccountShell>
  );
}
