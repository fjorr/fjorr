import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import AccountShell from '@/components/AccountShell';
import FilmLogsLedger from '@/components/FilmLogsLedger';
import { requireOwnAccount } from '@/lib/account-session';
import { getOwnFilmLogs } from '@/lib/film-record-actions';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');
  return {
    title: t('accountLogsTitle'),
    robots: { index: false, follow: false },
  };
}

export default async function AccountVoyagesPage() {
  const { profile } = await requireOwnAccount('/account/voyages');
  const logs = await getOwnFilmLogs();
  const t = await getTranslations('Account');

  return (
    <AccountShell
      profile={profile}
      title={t('filmLogsTitle')}
      description={t('filmLogsBody')}
      descriptionNote={t('filmLogsNote')}
      wide
    >
      <FilmLogsLedger
        logs={logs}
        omitHeader
        memberNumber={
          profile.voyage_lineage_enabled !== false
            ? profile.member_number
            : null
        }
      />
    </AccountShell>
  );
}
