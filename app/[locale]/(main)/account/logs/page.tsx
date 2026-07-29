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

export default async function AccountLogsPage() {
  const { profile } = await requireOwnAccount('/account/logs');
  const logs = await getOwnFilmLogs();
  const t = await getTranslations('Account');

  return (
    <AccountShell showBack>
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="flex flex-col gap-2 text-left">
          <h1 className="font-sans text-2xl font-bold tracking-tight text-white">
            {t('filmLogsTitle')}
          </h1>
          <p className="font-sans text-[15px] text-white/50 leading-relaxed">
            {t('filmLogsBody')}
          </p>
        </div>
        <FilmLogsLedger
          logs={logs}
          omitHeader
          memberNumber={profile.member_number}
        />
      </div>
    </AccountShell>
  );
}
