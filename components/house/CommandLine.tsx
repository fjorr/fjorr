'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { parseLocale } from '@/i18n/config';
import { usePathname } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { storySettingDisplay } from '@/lib/story-year';
import { setSearchReturn } from '@/lib/house-search-return';
import { scoreSearchFields } from '@/lib/search-match';
import {
  hitSnippet,
  snippetContainsQuery,
} from '@/lib/intelligence';
import CatalogIndex from '@/components/house/CatalogIndex';

type SeedFilm = {
  id: string;
  slug: string;
  name?: string | null;
  teaser?: string | null;
  runtime?: number | null;
  release_date?: string | null;
  comingSoon?: boolean;
  theme?: string | null;
  rating?: string | null;
  storyDate?: string | null;
  story_date?: string | null;
  poster?: string | null;
  blok_tall?: string | null;
  hero_clsx?: string | null;
  hero_tall?: string | null;
  hero_wide?: string | null;
  mux_playback_id?: string | null;
  playbackId?: string | null;
};

export type CommandFilm = {
  id: string;
  slug: string;
  name: string;
  teaser: string | null;
  creator: string | null;
  theme: string | null;
  /** Story-setting year label (not release date). */
  year: string | null;
  /** Raw story_date for chronological sort. */
  storyDate: string | null;
  runtime: number | null;
  rating: string | null;
  comingSoon: boolean;
  kind: 'film' | 'artifact';
  /** Landscape / frame for preview modal. */
  poster: string | null;
  /** Portrait poster for grid view. */
  thumb: string | null;
  /** Mux id for muted 8s tease in preview. */
  playbackId: string | null;
  /** Artifact exhibit ground color. */
  pageBg?: string | null;
  isDarkBg?: boolean;
  /** Quiet match line from Engine Intelligence (never the full dump). */
  why?: string | null;
};

const FILM_LIMIT = 16;
const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;

type CatalogBundle = {
  films: CommandFilm[];
  artifacts: CommandFilm[];
  at: number;
};

type SearchBundle = {
  hits: CommandFilm[];
  why: Record<string, string>;
  at: number;
};

/** Survive ⌘K remounts so return / reopen feels instant. */
const catalogCache = new Map<string, CatalogBundle>();
const searchCache = new Map<string, SearchBundle>();
const CATALOG_CACHE_TTL_MS = 2 * 60 * 1000;
/** Bump when catalog thumb shape changes so warm cache doesn’t keep wrong art. */
const CATALOG_CACHE_VERSION = 3;

function catalogCacheKey(locale: string) {
  return `${CATALOG_CACHE_VERSION}:${locale}`;
}

function searchCacheKey(locale: string, text: string) {
  return `${locale}:${text.toLowerCase()}`;
}

function readSearchCache(locale: string, text: string): SearchBundle | null {
  const entry = searchCache.get(searchCacheKey(locale, text));
  if (!entry) return null;
  if (Date.now() - entry.at > SEARCH_CACHE_TTL_MS) {
    searchCache.delete(searchCacheKey(locale, text));
    return null;
  }
  return entry;
}

function writeSearchCache(
  locale: string,
  text: string,
  hits: CommandFilm[],
  why: Record<string, string>
) {
  searchCache.set(searchCacheKey(locale, text), {
    hits,
    why,
    at: Date.now(),
  });
}

function isFuture(value?: string | null) {
  if (!value) return false;
  return new Date(value).getTime() > Date.now();
}

function releaseYearLabel(value?: string | null): string | null {
  if (!value) return null;
  const year = new Date(value).getFullYear();
  return Number.isFinite(year) ? String(year) : null;
}

function pickPoster(row: {
  poster?: string | null;
  blok_tall?: string | null;
  hero_clsx?: string | null;
  hero_tall?: string | null;
  hero_wide?: string | null;
}): string | null {
  return (
    row.poster ||
    row.blok_tall ||
    row.hero_clsx ||
    row.hero_tall ||
    row.hero_wide ||
    null
  );
}

/** Prefer landscape frames for the preview modal. */
function pickPreviewPoster(row: {
  poster?: string | null;
  blok_tall?: string | null;
  hero_clsx?: string | null;
  hero_tall?: string | null;
  hero_wide?: string | null;
}): string | null {
  return (
    row.hero_wide ||
    row.hero_clsx ||
    row.poster ||
    row.hero_tall ||
    row.blok_tall ||
    null
  );
}

function toFilm(row: {
  id?: string;
  internal_id?: string;
  slug?: string;
  name?: string | null;
  teaser?: string | null;
  creator?: string | null;
  theme?: string | null;
  label?: string | null;
  release_date?: string | null;
  runtime?: number | null;
  comingSoon?: boolean;
  item_type?: string;
  kind?: 'film' | 'artifact';
  rating?: string | null;
  storyDate?: string | null;
  story_date?: string | null;
  poster?: string | null;
  blok_tall?: string | null;
  hero_clsx?: string | null;
  hero_tall?: string | null;
  hero_wide?: string | null;
  mux_playback_id?: string | null;
  playbackId?: string | null;
}): CommandFilm | null {
  const slug = String(row.slug || '');
  if (!slug) return null;
  const kind = row.kind || (row.item_type === 'artifact' ? 'artifact' : 'film');
  const storyRaw = row.storyDate ?? row.story_date ?? null;
  return {
    id: String(row.internal_id || row.id || ''),
    slug,
    name: row.name || 'Untitled',
    teaser: row.teaser || row.label || null,
    creator: row.creator || null,
    theme: row.theme || null,
    year:
      kind === 'artifact'
        ? releaseYearLabel(row.release_date)
        : storySettingDisplay(storyRaw),
    storyDate: kind === 'artifact' ? row.release_date ?? null : storyRaw,
    runtime: row.runtime ?? null,
    rating: row.rating?.trim() || null,
    comingSoon: kind === 'film' && (Boolean(row.comingSoon) || isFuture(row.release_date)),
    kind,
    poster: pickPreviewPoster(row),
    thumb: pickPoster(row),
    playbackId: row.playbackId || row.mux_playback_id || null,
    pageBg: null,
    isDarkBg: false,
  };
}

function parseIntent(query: string, catalog: CommandFilm[]) {
  let rest = query.toLowerCase().trim();
  let maxMinutes: number | null = null;
  let comingSoon = false;
  let theme: string | null = null;

  const under = rest.match(/\b(?:under|less than)\s+(\d+)\s*(?:m|min|mins|minute|minutes)\b/);
  if (under) {
    maxMinutes = Number(under[1]);
    rest = rest.replace(under[0], ' ');
  }

  if (/\bcoming soon\b/.test(rest)) {
    comingSoon = true;
    rest = rest.replace(/\bcoming soon\b/g, ' ');
  }

  const themes = [...new Set(catalog.map((film) => film.theme).filter(Boolean))] as string[];
  const matched = themes
    .slice()
    .sort((a, b) => b.length - a.length)
    .find((name) => rest.includes(name.toLowerCase()));
  if (matched) {
    theme = matched;
    rest = rest.replace(matched.toLowerCase(), ' ');
  }

  return {
    maxMinutes,
    comingSoon,
    theme,
    text: rest.replace(/\s+/g, ' ').trim(),
  };
}

function passesIntent(
  film: CommandFilm,
  intent: ReturnType<typeof parseIntent>
) {
  const filmOnly = intent.comingSoon || intent.maxMinutes != null;
  if (film.kind === 'artifact') return !filmOnly;
  if (intent.comingSoon && !film.comingSoon) return false;
  if (intent.maxMinutes != null) {
    if (!film.runtime || film.runtime > intent.maxMinutes * 60) return false;
  }
  if (intent.theme && film.theme?.toLowerCase() !== intent.theme.toLowerCase()) return false;
  return true;
}

function scoreFilm(film: CommandFilm, text: string) {
  return scoreSearchFields(
    {
      name: film.name,
      creator: film.creator,
      teaser: film.teaser,
      theme: film.theme,
      year: film.year,
    },
    text
  );
}

function rankFilms(catalog: CommandFilm[], query: string) {
  const intent = parseIntent(query, catalog);
  const hasConstraint = intent.comingSoon || intent.maxMinutes != null || Boolean(intent.theme);
  return catalog
    .filter((film) => passesIntent(film, intent))
    .map((film) => ({ film, score: scoreFilm(film, intent.text) }))
    .filter((row) => (intent.text ? row.score > 0 : hasConstraint || true))
    .sort((a, b) => b.score - a.score || a.film.name.localeCompare(b.film.name))
    .map((row) => row.film);
}

/**
 * Hit line under the title — only when we can show the matched word.
 * Prefer Intelligence notes snippet, then teaser / creator / theme.
 * Skip when the only match is the title itself (already visible).
 */
function whyForHit(
  film: CommandFilm,
  queryText: string,
  intelWhy?: string | null
): string | null {
  const text = queryText.trim();
  if (!text) return null;

  if (intelWhy && snippetContainsQuery(intelWhy, text)) {
    return hitSnippet(intelWhy, text) || intelWhy;
  }

  for (const field of [film.teaser, film.creator, film.theme]) {
    const snip = hitSnippet(field, text);
    if (snip) return snip;
  }

  return null;
}

export default function CommandLine({
  films,
  onClose: _onClose,
  onPlay,
  initialQuery = '',
}: {
  films: SeedFilm[];
  onClose: () => void;
  onPlay: (hit: CommandFilm) => void;
  /** Restore query when reopening after watch. */
  initialQuery?: string;
}) {
  const locale = parseLocale(useLocale());
  const t = useTranslations('Search');
  const pathname = usePathname() || '/';
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const seedFilms = useMemo(
    () =>
      films
        .map((film) => toFilm(film))
        .filter((film): film is CommandFilm => Boolean(film)),
    [films]
  );
  const cachedCatalog = catalogCache.get(catalogCacheKey(locale));
  const restoredSearch = useMemo(() => {
    const text = initialQuery.trim();
    if (!text) return null;
    const intentText =
      parseIntent(text, cachedCatalog?.films || []).text || text;
    return readSearchCache(locale, intentText);
  }, [cachedCatalog?.films, initialQuery, locale]);
  const [catalog, setCatalog] = useState<CommandFilm[]>(
    () => cachedCatalog?.films ?? seedFilms
  );
  const [artifacts, setArtifacts] = useState<CommandFilm[]>(
    () => cachedCatalog?.artifacts ?? []
  );
  const [catalogReady, setCatalogReady] = useState(
    Boolean(cachedCatalog || seedFilms.length > 0)
  );
  const [remoteHits, setRemoteHits] = useState<CommandFilm[] | null>(
    () => restoredSearch?.hits ?? null
  );
  const [remotePending, setRemotePending] = useState(false);
  const [intelWhy, setIntelWhy] = useState<Record<string, string>>(
    () => restoredSearch?.why ?? {}
  );
  const [active, setActive] = useState(0);
  const lastRemoteText = useRef('');
  const [chromeHidden, setChromeHidden] = useState(false);
  const chromeHiddenRef = useRef(false);
  const lastScrollTop = useRef(0);

  const onResultsScroll = (scrollTop: number, el?: HTMLElement) => {
    const canScroll = el
      ? el.scrollHeight > el.clientHeight + 40
      : scrollTop > 40;
    window.dispatchEvent(
      new CustomEvent('fjorr_search_scroll', {
        detail: { scrollTop, canScroll },
      })
    );

    const prev = lastScrollTop.current;
    lastScrollTop.current = scrollTop;
    const delta = scrollTop - prev;

    let nextHidden = chromeHiddenRef.current;
    if (scrollTop < 12) nextHidden = false;
    else if (delta > 6) nextHidden = true;
    else if (delta < -6) nextHidden = false;

    if (nextHidden === chromeHiddenRef.current) return;
    chromeHiddenRef.current = nextHidden;
    setChromeHidden(nextHidden);
  };

  useEffect(() => {
    chromeHiddenRef.current = false;
    lastScrollTop.current = 0;
    setChromeHidden(false);
    window.dispatchEvent(
      new CustomEvent('fjorr_search_scroll', {
        detail: { scrollTop: 0, canScroll: false },
      })
    );
  }, [query]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('fjorr_search_scroll', {
        detail: { scrollTop: 0, canScroll: false },
      })
    );
  }, []);

  const searching = query.trim().length > 0;
  const localHits = useMemo(() => {
    if (!searching) return [];
    const intent = parseIntent(query, catalog);
    const filmOnly = intent.comingSoon || intent.maxMinutes != null;
    const rankedFilms = rankFilms(catalog, query);
    if (filmOnly && !intent.text) return rankedFilms;
    const rankedArtifacts = rankFilms(artifacts, query);
    return [...rankedFilms, ...rankedArtifacts].sort(
      (a, b) => scoreFilm(b, intent.text) - scoreFilm(a, intent.text) || a.name.localeCompare(b.name)
    );
  }, [artifacts, catalog, query, searching]);
  const hits = useMemo(() => {
    const intent = parseIntent(query, catalog);
    const text = intent.text;
    const base = (remoteHits && remoteHits.length ? remoteHits : localHits).slice(
      0,
      FILM_LIMIT
    );
    return base.map((film) => {
      const why = text
        ? whyForHit(film, text, intelWhy[film.slug] || film.why)
        : null;
      return { ...film, why };
    });
  }, [remoteHits, localHits, intelWhy, query, catalog]);
  const rowCount = searching ? hits.length : 0;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setActive(0);
  }, [query, hits.length, catalog.length]);

  useEffect(() => {
    let cancelled = false;
    const warm = catalogCache.get(catalogCacheKey(locale));
    if (warm && Date.now() - warm.at < CATALOG_CACHE_TTL_MS) {
      setCatalog(warm.films);
      setArtifacts(warm.artifacts);
      setCatalogReady(true);
      return;
    }

    const supabase = createClient();
    void (async () => {
      const { data, error } = await supabase
        .from('search')
        .select(
          'internal_id, slug, name, teaser, creator, theme, label, runtime, release_date, item_type, locale'
        )
        .eq('locale', locale);
      if (cancelled) return;
      if (error || !data?.length) {
        setCatalog(seedFilms);
        setCatalogReady(true);
        return;
      }
      const rows = data as Array<{
        internal_id?: string;
        slug?: string;
        name?: string | null;
        teaser?: string | null;
        creator?: string | null;
        theme?: string | null;
        label?: string | null;
        runtime?: number | null;
        release_date?: string | null;
        item_type?: string;
      }>;
      const seedBySlug = new Map(
        films.map((film) => [film.slug, film] as const)
      );

      // search rows don't store story_date / posters — pull from film + artifact.
      const filmIds = rows
        .filter((row) => row.item_type === 'film' && row.internal_id)
        .map((row) => String(row.internal_id));
      const storyById = new Map<string, string | null>();
      const storyBySlug = new Map<string, string | null>();
      const posterById = new Map<string, string | null>();
      const posterBySlug = new Map<string, string | null>();
      const thumbById = new Map<string, string | null>();
      const thumbBySlug = new Map<string, string | null>();
      const playbackById = new Map<string, string | null>();
      const playbackBySlug = new Map<string, string | null>();

      const artifactRows = rows.filter((row) => row.item_type === 'artifact');
      const artifactIds = artifactRows
        .map((row) => String(row.internal_id || ''))
        .filter(Boolean);

      const [storyResult, artResult] = await Promise.all([
        filmIds.length
          ? supabase
              .from('film')
              .select(
                'id, slug, story_date, blok_tall, hero_clsx, hero_tall, hero_wide, mux_playback_id'
              )
              .in('id', filmIds)
          : Promise.resolve({ data: null }),
        artifactIds.length
          ? supabase
              .from('artifact')
              .select(
                'id, slug, primary_color, is_dark_bg, blok_tall, hero_clsx, hero_tall, blok_ogrf, release_date'
              )
              .in('id', artifactIds)
          : Promise.resolve({ data: null }),
      ]);

      if (cancelled) return;

      if (storyResult.data?.length) {
        for (const row of storyResult.data as Array<{
          id?: string;
          slug?: string;
          story_date?: string | null;
          blok_tall?: string | null;
          hero_clsx?: string | null;
          hero_tall?: string | null;
          hero_wide?: string | null;
          mux_playback_id?: string | null;
        }>) {
          const raw = row.story_date?.trim() || null;
          const poster = pickPreviewPoster(row);
          const thumb = pickPoster(row);
          const playback = row.mux_playback_id?.trim() || null;
          if (row.id) {
            storyById.set(String(row.id), raw);
            posterById.set(String(row.id), poster);
            thumbById.set(String(row.id), thumb);
            playbackById.set(String(row.id), playback);
          }
          if (row.slug) {
            storyBySlug.set(String(row.slug), raw);
            posterBySlug.set(String(row.slug), poster);
            thumbBySlug.set(String(row.slug), thumb);
            playbackBySlug.set(String(row.slug), playback);
          }
        }
      }

      const withSeedMeta = (film: CommandFilm): CommandFilm => {
        const seed = seedBySlug.get(film.slug);
        const storyRaw =
          seed?.storyDate ??
          seed?.story_date ??
          storyById.get(film.id) ??
          storyBySlug.get(film.slug) ??
          film.storyDate ??
          null;
        const storyYear = storySettingDisplay(storyRaw);
        const poster =
          film.poster ||
          pickPreviewPoster(seed || {}) ||
          posterById.get(film.id) ||
          posterBySlug.get(film.slug) ||
          null;
        const thumb =
          film.thumb ||
          pickPoster(seed || {}) ||
          thumbById.get(film.id) ||
          thumbBySlug.get(film.slug) ||
          poster ||
          null;
        const playbackId =
          film.playbackId ||
          seed?.playbackId ||
          seed?.mux_playback_id ||
          playbackById.get(film.id) ||
          playbackBySlug.get(film.slug) ||
          null;
        return {
          ...film,
          year: storyYear || film.year,
          storyDate: storyRaw,
          rating: seed?.rating?.trim() || film.rating,
          runtime: seed?.runtime ?? film.runtime,
          teaser: film.teaser || seed?.teaser || null,
          comingSoon:
            seed?.comingSoon != null
              ? Boolean(seed.comingSoon)
              : film.comingSoon,
          theme: film.theme || seed?.theme || null,
          poster,
          thumb,
          playbackId,
        };
      };

      const loaded = rows
        .filter((row) => row.item_type === 'film')
        .map((row) => toFilm(row))
        .filter((film): film is CommandFilm => Boolean(film))
        .map(withSeedMeta);
      const order = new Map(films.map((film, index) => [film.slug, index]));
      loaded.sort((a, b) => {
        const aSoon = a.comingSoon ? 1 : 0;
        const bSoon = b.comingSoon ? 1 : 0;
        if (aSoon !== bSoon) return aSoon - bSoon;
        const aIndex = order.get(a.slug);
        const bIndex = order.get(b.slug);
        if (aIndex != null && bIndex != null) return aIndex - bIndex;
        if (aIndex != null) return -1;
        if (bIndex != null) return 1;
        return a.name.localeCompare(b.name);
      });

      // Films first — don't block browse/search on artifact enrichment.
      const catalogFilms = loaded.length ? loaded : seedFilms;
      setCatalog(catalogFilms);
      setCatalogReady(true);

      const artById = new Map(
        (
          (artResult.data || []) as Array<{
            id?: string;
            slug?: string;
            primary_color?: string | null;
            is_dark_bg?: boolean | null;
            blok_tall?: string | null;
            hero_clsx?: string | null;
            hero_tall?: string | null;
            blok_ogrf?: string | null;
            release_date?: string | null;
          }>
        ).map((row) => [String(row.id), row] as const)
      );

      const enrichArtifacts = (list: CommandFilm[]) =>
        list.map((item) => {
          const raw = artById.get(item.id);
          if (!raw) return item;
          const thumb =
            raw.blok_tall?.trim() ||
            item.thumb ||
            raw.hero_tall ||
            raw.blok_ogrf ||
            raw.hero_clsx ||
            item.poster;
          const releaseYear =
            item.year || releaseYearLabel(raw.release_date);
          return {
            ...item,
            poster:
              raw.hero_clsx || raw.hero_tall || raw.blok_ogrf || item.poster,
            thumb,
            pageBg: raw.primary_color?.trim() || '#111111',
            isDarkBg: Boolean(raw.is_dark_bg),
            year: releaseYear,
            storyDate: item.storyDate || raw.release_date || null,
          };
        });

      let artifactsEnriched = enrichArtifacts(
        artifactRows
          .map((row) => toFilm(row))
          .filter((film): film is CommandFilm => Boolean(film))
      );

      if (!artifactsEnriched.length && locale !== 'en') {
        const fallback = await supabase
          .from('search')
          .select(
            'internal_id, slug, name, teaser, creator, theme, label, runtime, release_date, item_type, locale'
          )
          .eq('item_type', 'artifact')
          .eq('locale', 'en');
        if (!cancelled && fallback.data?.length) {
          const fallbackList = (
            fallback.data as Array<{
              internal_id?: string;
              slug?: string;
              name?: string | null;
              teaser?: string | null;
              creator?: string | null;
              theme?: string | null;
              label?: string | null;
              runtime?: number | null;
              release_date?: string | null;
              item_type?: string;
            }>
          )
            .map((row) => toFilm(row))
            .filter((item): item is CommandFilm => Boolean(item));
          const fallbackIds = fallbackList.map((row) => row.id).filter(Boolean);
          if (fallbackIds.length) {
            const { data: fallbackArt } = await supabase
              .from('artifact')
              .select(
                'id, slug, primary_color, is_dark_bg, blok_tall, hero_clsx, hero_tall, blok_ogrf, release_date'
              )
              .in('id', fallbackIds);
            for (const row of (fallbackArt || []) as Array<{
              id?: string;
              slug?: string;
              primary_color?: string | null;
              is_dark_bg?: boolean | null;
              blok_tall?: string | null;
              hero_clsx?: string | null;
              hero_tall?: string | null;
              blok_ogrf?: string | null;
              release_date?: string | null;
            }>) {
              artById.set(String(row.id), row);
            }
          }
          artifactsEnriched = enrichArtifacts(fallbackList);
        }
      }

      if (cancelled) return;
      setArtifacts(artifactsEnriched);
      catalogCache.set(catalogCacheKey(locale), {
        films: catalogFilms,
        artifacts: artifactsEnriched,
        at: Date.now(),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [films, locale, seedFilms]);

  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setRemoteHits(null);
      setIntelWhy({});
      setRemotePending(false);
      return;
    }
    const intent = parseIntent(term, catalog);
    if (!intent.text) {
      setRemoteHits(null);
      setIntelWhy({});
      setRemotePending(false);
      return;
    }

    const cached = readSearchCache(locale, intent.text);
    if (cached) {
      setRemoteHits(cached.hits);
      setIntelWhy(cached.why);
    } else if (lastRemoteText.current !== intent.text) {
      // New query: fall back to local hits immediately (don't keep stale remote).
      setRemoteHits(null);
      setIntelWhy({});
    }
    lastRemoteText.current = intent.text;

    let cancelled = false;
    const hasUsable =
      Boolean(cached?.hits.length) || localHits.length > 0;
    setRemotePending(!hasUsable);

    const delay = cached ? 0 : 120;
    const timer = window.setTimeout(async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('search_items', {
          search_term: intent.text,
          p_locale: locale,
        });
        if (cancelled) return;

        if (error) {
          console.error('search_items failed:', error.message);
        }

        const known = new Map(
          [...catalog, ...artifacts].map((item) => [
            `${item.kind}:${item.slug}`,
            item,
          ])
        );
        const filmsFromSearch = (error ? [] : data || [])
          .map((row: { item_type?: string; slug?: string }) => {
            const kind = row.item_type === 'artifact' ? 'artifact' : 'film';
            return known.get(`${kind}:${String(row.slug || '')}`) || toFilm(row);
          })
          .filter((film: CommandFilm | null): film is CommandFilm => Boolean(film))
          .filter((film: CommandFilm) => passesIntent(film, intent));

        const seen = new Set<string>();
        const merged = [...localHits, ...filmsFromSearch].filter((film) => {
          const key = `${film.kind}:${film.slug}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        setRemoteHits(merged);
        setIntelWhy({});
        writeSearchCache(locale, intent.text, merged, {});
        setRemotePending(false);
      } catch {
        if (!cancelled && !cached) {
          setRemoteHits(null);
          setIntelWhy({});
        }
      } finally {
        if (!cancelled) setRemotePending(false);
      }
    }, delay);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, locale, catalog, artifacts, localHits]);

  const choose = (index: number) => {
    if (!searching) return;
    const hit = hits[index];
    if (!hit) return;
    leaveToPlay(hit);
  };

  const leaveToPlay = (film: CommandFilm) => {
    setSearchReturn({ path: pathname, query: query.trim() });
    // Keep the sheet up until the route changes — avoids a flash of the page under.
    onPlay(film);
  };

  const playFromCatalog = (slug: string) => {
    const film =
      catalog.find((row) => row.slug === slug) ||
      artifacts.find((row) => row.slug === slug) ||
      hits.find((row) => row.slug === slug);
    if (!film) return;
    leaveToPlay(film);
  };

  const toIndexItem = (film: CommandFilm) => ({
    id: film.id,
    slug: film.slug,
    name: film.name,
    runtime: film.runtime,
    comingSoon: film.comingSoon,
    kind: film.kind,
    rating: film.rating,
    setting: film.year,
    storyDate: film.storyDate,
    why: film.why,
    thumb: film.thumb || film.poster,
    pageBg: film.pageBg ?? null,
  });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActive((current) => (rowCount === 0 ? 0 : (current + 1) % rowCount));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActive((current) => (rowCount === 0 ? 0 : (current - 1 + rowCount) % rowCount));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rowCount]);

  return (
    <div
      role="dialog"
      aria-label="Command"
      className="relative z-50 flex h-full flex-col bg-white text-[#0B0B0C]"
    >
      <div
        className={`mx-auto w-full max-w-[44rem] shrink-0 overflow-hidden px-0 transition-[max-height,opacity,padding] duration-200 ease-out ${
          chromeHidden
            ? 'pointer-events-none max-h-0 py-0 opacity-0'
            : 'max-h-24 pt-2 opacity-100'
        }`}
      >
        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            choose(active);
          }}
        >
          <label className="sr-only" htmlFor="fjorr-command">
            Describe a mood, director, or cinematic intent
          </label>
          <div className="flex w-full items-center gap-3 rounded-[10px] bg-black/[0.05] px-4 py-3 md:py-4">
            <span className="inline-flex shrink-0 text-black/40" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                  stroke="currentColor"
                  strokeWidth="1.75"
                />
                <path
                  d="M20 20l-3-3"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <input
              ref={inputRef}
              id="fjorr-command"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => {
                chromeHiddenRef.current = false;
                setChromeHidden(false);
              }}
              onBlur={() => {
                // Unstick iOS Safari focus-zoom without permanently locking pinch-zoom.
                const meta = document.querySelector('meta[name="viewport"]');
                if (!meta) return;
                const prev = meta.getAttribute('content') || 'width=device-width, initial-scale=1';
                meta.setAttribute(
                  'content',
                  'width=device-width, initial-scale=1, maximum-scale=1'
                );
                window.setTimeout(() => {
                  meta.setAttribute('content', prev);
                }, 120);
              }}
              placeholder="A title, director, or a short phrase"
              // ≥16px is the threshold that stops iOS from auto-zooming inputs.
              className="h-[1.4em] w-full min-w-0 bg-transparent font-sans text-base font-semibold leading-none tracking-tight text-[#0B0B0C] outline-none placeholder:text-black/35 md:text-[17px]"
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setActive(0);
                  inputRef.current?.focus();
                }}
                aria-label="Clear search"
                className="inline-flex size-7 shrink-0 items-center justify-center border-0 bg-transparent p-0 text-black/35 transition-colors hover:text-[#0B0B0C]"
              >
                <X className="size-[18px]" strokeWidth={2} aria-hidden />
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div
        className="mx-auto min-h-0 w-full max-w-[90rem] flex-1 overflow-y-auto overscroll-contain pb-3 pt-3"
        onScroll={(event) =>
          onResultsScroll(event.currentTarget.scrollTop, event.currentTarget)
        }
      >
        {searching ? (
          hits.length === 0 ? (
            catalogReady && !remotePending ? (
              <p className="mx-auto w-full max-w-[44rem] py-2.5 font-interTight text-[24px] font-bold leading-none tracking-tight text-[#0B0B0C] sm:text-[28px] md:text-[32px]">
                {t('nothingMatches')}
              </p>
            ) : null
          ) : (
            <CatalogIndex
              items={hits.map(toIndexItem)}
              showControls={false}
              showKindFilter
              scrollable={false}
              controlsHidden={chromeHidden}
              onPlay={playFromCatalog}
              onHover={(slug) => {
                const index = hits.findIndex((row) => row.slug === slug);
                if (index >= 0) setActive(index);
              }}
            />
          )
        ) : (
          <CatalogIndex
            items={catalog.map(toIndexItem)}
            scrollable={false}
            controlsHidden={chromeHidden}
            onPlay={playFromCatalog}
          />
        )}
      </div>
    </div>
  );
}
