import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import FilmLogsLedger from '@/components/FilmLogsLedger';
import { getPublicProfileByMemberNumber } from '@/lib/profile-actions';
import { profilePath } from '@/lib/profile';
import { getPublicFilmLogs } from '@/lib/film-record-actions';

type Props = {
  params: Promise<{ memberNumber: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { memberNumber: raw, slug } = await params;
  const memberNumber = Number.parseInt(raw, 10);
  if (!Number.isFinite(memberNumber)) {
    return { title: 'Profile' };
  }

  const profile = await getPublicProfileByMemberNumber(memberNumber);
  if (!profile || !profile.is_public) {
    return { robots: { index: false, follow: false } };
  }

  const t = await getTranslations('Account');
  const title =
    profile.display_name?.trim() ||
    t('memberFallback', { number: profile.member_number });

  return {
    title,
    description: profile.bio?.trim() || undefined,
    robots:
      profile.slug === slug
        ? { index: true, follow: true }
        : { index: false, follow: false },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { memberNumber: raw, slug } = await params;
  const memberNumber = Number.parseInt(raw, 10);
  if (!Number.isFinite(memberNumber) || String(memberNumber) !== raw) {
    notFound();
  }

  const profile = await getPublicProfileByMemberNumber(memberNumber);
  if (!profile || !profile.is_public) {
    notFound();
  }

  if (profile.slug !== slug) {
    permanentRedirect(profilePath(profile.member_number, profile.slug));
  }

  const t = await getTranslations('Account');
  const name =
    profile.display_name?.trim() ||
    t('memberFallback', { number: profile.member_number });
  const logs = await getPublicFilmLogs(profile.id);

  return (
    <div className="w-full min-h-[70vh] bg-[#1F1F1F] flex flex-col items-center px-5 sm:px-8 py-24 gap-16">
      <div className="w-full max-w-md flex flex-col gap-4 text-center">
        <p className="font-mono text-[13px] text-white/35">
          {t('memberNumberLabel', { number: profile.member_number })}
        </p>
        <h1 className="font-sans text-3xl font-bold tracking-tight text-white">
          {name}
        </h1>
        {profile.bio?.trim() ? (
          <p className="font-sans text-[15px] text-white/55 leading-relaxed">
            {profile.bio.trim()}
          </p>
        ) : null}
      </div>
      <div className="w-full max-w-5xl px-0">
        <FilmLogsLedger
          logs={logs}
          emptyHint={t('filmLogsPublicEmpty')}
          memberNumber={profile.member_number}
          showShare={false}
        />
      </div>
    </div>
  );
}
