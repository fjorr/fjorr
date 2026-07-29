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
  await requireOwnAccount('/account/nominations');
  const nominations = await getOwnNominations();
  const t = await getTranslations('Account');

  return (
    <AccountShell showBack>
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="flex flex-col gap-2 text-left">
          <h1 className="font-sans text-2xl font-bold tracking-tight text-white">
            {t('nominationsTitle')}
          </h1>
          <p className="font-sans text-[15px] text-white/50 leading-relaxed">
            {t('nominationsBody')}
          </p>
        </div>
        <NominationsLedger nominations={nominations} omitHeader />
      </div>
    </AccountShell>
  );
}
