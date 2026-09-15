import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import HouseHome, { type HouseFilm } from '@/components/house/HouseHome';
import { requireOwnAccount } from '@/lib/account-session';
import {
  getEarlyReleaseFilms,
  getTemporaryEarlyReleaseFilms,
  type EarlyReleaseFilm,
} from '@/lib/early-release';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');
  return {
    title: t('accountEarlyReleaseTitle'),
    robots: { index: false, follow: false },
  };
}

function asText(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value && 'name' in value) {
    const name = (value as { name?: unknown }).name;
    return typeof name === 'string' ? name : null;
  }
  return null;
}

function formatLocation(raw: unknown): string | null {
  if (!raw) return null;
  if (typeof raw === 'string') return raw.trim() || null;
  if (Array.isArray(raw)) {
    const parts = raw.map((v) => String(v).trim()).filter(Boolean);
    return parts.length ? parts.join(', ') : null;
  }
  return null;
}

function toHouseFilm(film: EarlyReleaseFilm): HouseFilm {
  return {
    id: String(film.id),
    name: film.name,
    slug: String(film.slug),
    mux_playback_id: film.mux_playback_id,
    hero_wide: film.hero_wide,
    hero_clsx: film.hero_clsx,
    hero_tall: film.hero_tall,
    blok_tall: film.blok_tall,
    teaser: film.teaser,
    story_date: asText(film.story_date),
    location: formatLocation(film.location),
    runtime: film.runtime ?? null,
    release_date: film.release_date ?? null,
    comingSoon: false,
    sponsor: asText(film.sponsor),
    title_art_code: film.title_art_code,
    title_art_hex: film.title_art_hex,
    title_art_scale: film.title_art_scale,
    rating: asText(film.rating),
    theme: asText(film.theme),
  };
}

/** Local-only sample rail — `/account/early?preview=rail` */
async function previewEarlyFilms(): Promise<EarlyReleaseFilm[]> {
  return getTemporaryEarlyReleaseFilms(8);
}

export default async function AccountEarlyReleasePage({
  searchParams,
}: {
  searchParams?: Promise<{ preview?: string }>;
}) {
  const { profile: _profile } = await requireOwnAccount('/account/early');
  const params = (await searchParams) || {};
  const real = await getEarlyReleaseFilms();
  const films =
    params.preview === 'rail'
      ? await previewEarlyFilms()
      : real.length > 0
        ? real
        : await getTemporaryEarlyReleaseFilms(2);
  const t = await getTranslations('Account');

  if (films.length === 0) {
    return (
      <HouseHome
        films={[]}
        cornerChip={t('earlyReleaseChip')}
        includeIntro={false}
        emptyMessage={t('earlyReleaseEmpty')}
      />
    );
  }

  return (
    <HouseHome
      films={films.map(toHouseFilm)}
      cornerChip={t('earlyReleaseChip')}
      includeIntro={false}
    />
  );
}
