import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import AccountClient from '@/components/AccountClient';
import AccountShell from '@/components/AccountShell';
import { requireOwnAccount } from '@/lib/account-session';
import {
  ensureBureauxNumber,
  getOwnBureauxMembership,
  isBureauxMembershipActive,
} from '@/lib/bureaux';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');
  return {
    title: t('accountProfileTitle'),
    robots: { index: false, follow: false },
  };
}

export default async function AccountProfilePage() {
  const { user, profile } = await requireOwnAccount('/account/profile');
  const t = await getTranslations('Account');
  let membership = await getOwnBureauxMembership(user.id);
  if (
    isBureauxMembershipActive(membership) &&
    membership &&
    !membership.bureaux_number
  ) {
    const n = await ensureBureauxNumber(user.id);
    if (n) membership = { ...membership, bureaux_number: n };
  }

  return (
    <AccountShell
      profile={profile}
      title={t('profileTitle')}
      description={t('profileBody')}
      narrow
    >
      <AccountClient
        email={user.email || ''}
        profile={profile}
        bureauxNumber={membership?.bureaux_number ?? null}
      />
    </AccountShell>
  );
}
