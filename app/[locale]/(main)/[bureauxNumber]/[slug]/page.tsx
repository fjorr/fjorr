import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import FilmLogsLedger from '@/components/FilmLogsLedger';
import { getPublicProfileByAccountNumber } from '@/lib/profile-actions';
import { profilePath } from '@/lib/profile';
import { getPublicFilmLogs } from '@/lib/film-record-actions';

type Props = {
  params: Promise<{ bureauxNumber: string; slug: string }>;
};

function parseBureauxNumber(raw: string): number | null {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1 || String(n) !== raw) return null;
  return n;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { bureauxNumber: raw, slug } = await params;
  const accountNumber = parseBureauxNumber(raw);
  if (accountNumber == null) {
    return { title: 'Profile' };
  }

  const result = await getPublicProfileByAccountNumber(accountNumber);
  if (!result || !result.profile.is_public) {
    return { robots: { index: false, follow: false } };
  }

  const { profile, bureauxNumber } = result;
  const t = await getTranslations('Account');
  const title =
    profile.display_name?.trim() ||
    t('memberFallback', { number: bureauxNumber });

  return {
    title,
    description: profile.bio?.trim() || undefined,
    robots:
      profile.slug === slug && accountNumber === bureauxNumber
        ? { index: true, follow: true }
        : { index: false, follow: false },
  };
}

/** Public profile — /{bureauxNumber}/{slug} */
export default async function PublicProfilePage({ params }: Props) {
  const { bureauxNumber: raw, slug } = await params;
  const accountNumber = parseBureauxNumber(raw);
  if (accountNumber == null) notFound();

  const result = await getPublicProfileByAccountNumber(accountNumber);
  if (!result || !result.profile.is_public) {
    notFound();
  }

  const { profile, bureauxNumber } = result;

  if (accountNumber !== bureauxNumber || profile.slug !== slug) {
    permanentRedirect(profilePath(bureauxNumber, profile.slug));
  }

  const t = await getTranslations('Account');
  const name =
    profile.display_name?.trim() ||
    t('memberFallback', { number: bureauxNumber });
  const logs = await getPublicFilmLogs(profile.id);

  return (
    <div className="w-full min-h-[70vh] bg-page flex flex-col items-center px-5 sm:px-8 py-24 gap-16">
      <div className="w-full max-w-md flex flex-col gap-4 text-center">
        <p className="font-sans text-[13px] text-page-faint tabular-nums">
          {t('memberNumberLabel', { number: bureauxNumber })}
        </p>
        <h1 className="font-sans text-3xl font-bold tracking-tight text-page">
          {name}
        </h1>
        {profile.bio?.trim() ? (
          <p className="font-sans text-[15px] text-page-muted leading-relaxed">
            {profile.bio.trim()}
          </p>
        ) : null}
      </div>
      <div className="w-full max-w-5xl px-0">
        <FilmLogsLedger
          logs={logs}
          emptyHint={t('filmLogsPublicEmpty')}
        />
      </div>
    </div>
  );
}
