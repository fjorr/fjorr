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
  const { user, profile } = await requireOwnAccount('/account/voyages');
  const logs = await getOwnFilmLogs(user.id);
  const t = await getTranslations('Account');
  const hasVoyages = logs.length > 0;
  const lineageOn = profile.voyage_lineage_enabled !== false;

  return (
    <AccountShell
      profile={profile}
      title={t('filmLogsTitle')}
      description={t('filmLogsBody')}
      descriptionNote={t('filmLogsNote')}
      headerLinks={
        hasVoyages
          ? [{ href: '/manual/voyages', label: 'Manual · Voyages' }]
          : [
              { href: '/', label: t('filmLogsEmptyCta') },
              { href: '/manual/voyages', label: 'Manual · Voyages' },
            ]
      }
      wide
    >
      <FilmLogsLedger
        logs={logs}
        omitHeader
        memberNumber={lineageOn ? profile.member_number : null}
        showTrailHint={lineageOn && hasVoyages}
      />
    </AccountShell>
  );
}
