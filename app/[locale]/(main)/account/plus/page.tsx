import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import AccountShell from '@/components/AccountShell';
import PlusLogsLedger from '@/components/PlusLogsLedger';
import { requireOwnAccount } from '@/lib/account-session';
import { getOwnFilmNotes } from '@/lib/film-notes';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');
  return {
    title: t('accountPlusTitle'),
    robots: { index: false, follow: false },
  };
}

export default async function AccountPlusPage() {
  const { user, profile } = await requireOwnAccount('/account/plus');
  const notes = await getOwnFilmNotes(user.id);
  const t = await getTranslations('Plus');
  const hasRecords = notes.length > 0;

  return (
    <AccountShell
      profile={profile}
      title={t('logsTitle')}
      description={hasRecords ? t('logsBody') : t('logsBodyEmpty')}
      headerLinks={
        hasRecords
          ? [
              { href: '/plus#how', label: t('logsLinkHow') },
              { href: '/manual/plus', label: 'Manual · Plus Machine' },
            ]
          : [
              { href: '/plus#how', label: t('logsLinkHow') },
              { href: '/', label: t('logsLinkExplore') },
              { href: '/manual/plus', label: 'Manual · Plus Machine' },
            ]
      }
      wide
    >
      <PlusLogsLedger notes={notes} />
    </AccountShell>
  );
}
