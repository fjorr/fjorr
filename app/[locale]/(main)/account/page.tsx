import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import AccountClient from '@/components/AccountClient';
import FilmLogsLedger from '@/components/FilmLogsLedger';
import { createClient } from '@/lib/supabase/server';
import { ensureOwnProfile } from '@/lib/profile-actions';
import { getOwnFilmLogs } from '@/lib/film-record-actions';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');
  return {
    title: t('accountTitle'),
    robots: { index: false, follow: false },
  };
}

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin?next=/account');
  }

  const profile = await ensureOwnProfile();
  if (!profile) {
    redirect('/signin?next=/account');
  }

  const logs = await getOwnFilmLogs();

  return (
    <div className="w-full min-h-[70vh] bg-[#1F1F1F] flex flex-col items-center px-6 py-24 gap-16">
      <AccountClient email={user.email || ''} profile={profile} />
      <FilmLogsLedger logs={logs} />
    </div>
  );
}
