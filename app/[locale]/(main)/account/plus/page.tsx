import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import AccountShell from '@/components/AccountShell';
import PlusLogsLedger from '@/components/PlusLogsLedger';
import { requireOwnAccount } from '@/lib/account-session';
import { getOwnFilmNotes } from '@/lib/film-note-actions';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');
  return {
    title: t('accountPlusTitle'),
    robots: { index: false, follow: false },
  };
}

export default async function AccountPlusPage() {
  const { profile } = await requireOwnAccount('/account/plus');
  const notes = await getOwnFilmNotes();
  const t = await getTranslations('Plus');

  return (
    <AccountShell
      profile={profile}
      title={t('logsTitle')}
      description={t('logsBody')}
    >
      <PlusLogsLedger notes={notes} />
    </AccountShell>
  );
}
