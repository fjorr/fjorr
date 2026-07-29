import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import AccountClient from '@/components/AccountClient';
import AccountShell from '@/components/AccountShell';
import { requireOwnAccount } from '@/lib/account-session';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');
  return {
    title: t('accountProfileTitle'),
    robots: { index: false, follow: false },
  };
}

export default async function AccountProfilePage() {
  const { user, profile } = await requireOwnAccount('/account/profile');

  return (
    <AccountShell showBack>
      <AccountClient email={user.email || ''} profile={profile} />
    </AccountShell>
  );
}
