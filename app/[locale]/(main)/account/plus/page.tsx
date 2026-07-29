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
  await requireOwnAccount('/account/plus');
  const notes = await getOwnFilmNotes();
  const t = await getTranslations('Plus');

  return (
    <AccountShell showBack>
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="flex flex-col gap-2 text-left">
          <h1 className="font-sans text-2xl font-bold tracking-tight text-white">
            {t('logsTitle')}
          </h1>
          <p className="font-sans text-[15px] text-white/50 leading-relaxed">
            {t('logsBody')}
          </p>
        </div>
        <PlusLogsLedger notes={notes} />
      </div>
    </AccountShell>
  );
}
