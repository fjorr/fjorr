import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import AccountShell from '@/components/AccountShell';
import VoyagesBoard from '@/components/VoyagesBoard';
import { requireOwnAccount } from '@/lib/account-session';
import {
  getOwnFilmLogs,
  type FilmLogEntry,
} from '@/lib/film-record-actions';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');
  return {
    title: t('accountLogsTitle'),
    robots: { index: false, follow: false },
  };
}

const PREVIEW_TITLES = [
  'A Trip to the Moon',
  'The Cabinet of Dr. Caligari',
  'Nosferatu',
  'Metropolis',
  'Battleship Potemkin',
  'Un Chien Andalou',
  'L’Atalante',
  'The Passion of Joan of Arc',
  'Sunrise',
  'City Lights',
  'Modern Times',
  'The Rules of the Game',
  'Citizen Kane',
  'Casablanca',
  'Bicycle Thieves',
  'Rashomon',
  'Tokyo Story',
  'The Seventh Seal',
  'Vertigo',
  '8½',
];

const PREVIEW_THEMES = [
  'Science',
  'Horror',
  'Horror',
  'City',
  'Revolution',
  'Dream',
  'River',
  'Faith',
  'Love',
  'Comedy',
  'Industry',
  'Society',
  'Power',
  'War',
  'Poverty',
  'Truth',
  'Family',
  'Death',
  'Obsession',
  'Art',
];

/** Local-only sample rail — `/account/voyages?preview=rail` */
function previewVoyageLogs(): FilmLogEntry[] {
  const now = Date.now();
  return PREVIEW_TITLES.map((name, i) => ({
    film_id: `preview-film-${i + 1}`,
    viewer_number: [1, 2, 7, 12, 28, 44, 91, 128, 256, 512, 777, 1001, 2048, 4096, 8192, 10000, 12001, 15000, 22000, 50000][i],
    recorded_at: new Date(now - i * 86_400_000 * 3).toISOString(),
    film_version: 1,
    film_version_id: null,
    film_version_changelog: null,
    referred_by_member_number: null,
    passed_on_count: 0,
    film_name: name,
    film_slug: name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, ''),
    film_poster: null,
    film_runtime: 3600 + i * 240,
    film_release_date: null,
    film_theme: PREVIEW_THEMES[i] ?? null,
  }));
}

export default async function AccountVoyagesPage({
  searchParams,
}: {
  searchParams?: Promise<{ preview?: string }>;
}) {
  const { user, profile } = await requireOwnAccount('/account/voyages');
  const params = (await searchParams) || {};
  const logs =
    params.preview === 'rail'
      ? previewVoyageLogs()
      : await getOwnFilmLogs(user.id);
  const t = await getTranslations('Account');

  return (
    <AccountShell profile={profile} wide hideFooter>
      <VoyagesBoard
        logs={logs}
        title={t('filmLogsTitle')}
        emptyCtaLabel={t('filmLogsEmptyCta')}
      />
    </AccountShell>
  );
}
