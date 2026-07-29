import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import AccountIndex from '@/components/AccountIndex';
import AccountShell from '@/components/AccountShell';
import { requireOwnAccount } from '@/lib/account-session';
import { getOwnNominations } from '@/lib/nomination-actions';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');
  return {
    title: t('accountTitle'),
    robots: { index: false, follow: false },
  };
}

export default async function AccountPage() {
  const { profile } = await requireOwnAccount('/account');
  const nominations = await getOwnNominations();
  const nominationsActiveCount = nominations.filter((n) =>
    ['received', 'in_review', 'shortlisted', 'in_production'].includes(n.status)
  ).length;

  return (
    <AccountShell>
      <AccountIndex
        profile={profile}
        nominationsActiveCount={nominationsActiveCount}
      />
    </AccountShell>
  );
}
