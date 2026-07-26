/**
 * Supabase Edge Function: translate-film
 *
 * Deploy:  supabase functions deploy translate-film
 * Secrets: OPENAI_API_KEY (or DEEPL_API_KEY), SUPABASE_SERVICE_ROLE_KEY (auto)
 *
 * Triggers (pick one):
 *  1. Database Webhook on public.film UPDATE/INSERT → this function
 *  2. Manual: POST /functions/v1/translate-film { "film_id": "..." }
 *  3. Cron: retranslate where status = 'stale'
 *
 * Behavior:
 *  - Reads English copy from public.film
 *  - Skips locales with status = 'reviewed'
 *  - Upserts film_translation for es/fr/it/de/pt/sv/hi/ko/ja/zh-tw
 *  - Rebuilds public.search rows per locale via sync_film_to_search
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const LOCALES = ['es', 'fr', 'it', 'de', 'pt', 'sv', 'hi', 'ko', 'ja', 'zh-tw'] as const;
type AppLocale = (typeof LOCALES)[number];

const LOCALE_LABEL: Record<AppLocale, string> = {
  es: 'Spanish',
  fr: 'French',
  it: 'Italian',
  de: 'German',
  pt: 'Portuguese',
  sv: 'Swedish',
  hi: 'Hindi',
  ko: 'Korean',
  ja: 'Japanese',
  'zh-tw': 'Traditional Chinese',
};

type FilmRow = {
  id: string;
  name: string | null;
  teaser: string | null;
  description: string | null;
  note: string | null;
  last_line: string | null;
  last_line_attribution: string | null;
  alt_text: string | null;
  location: string[] | string | null;
};

type FilmCopy = {
  name: string;
  teaser: string;
  description: string;
  note: string;
  last_line: string;
  last_line_attribution: string;
  alt_text: string;
  location: string;
};

const COPY_KEYS: (keyof FilmCopy)[] = [
  'name',
  'teaser',
  'description',
  'note',
  'last_line',
  'last_line_attribution',
  'alt_text',
  'location',
];

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    // Database webhooks often send { type, table, record, old_record }
    const filmId: string | undefined =
      body.film_id ?? body.record?.id ?? body.id;

    if (!filmId) {
      return json({ error: 'film_id required' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: film, error: filmError } = await supabase
      .from('film')
      .select(
        'id, name, teaser, description, note, last_line, last_line_attribution, alt_text, location'
      )
      .eq('id', filmId)
      .maybeSingle();

    if (filmError || !film) {
      return json({ error: filmError?.message ?? 'film not found' }, 404);
    }

    const source = pickCopy(film as FilmRow);
    const sourceHash = await sha256(
      COPY_KEYS.map((k) => source[k]).join('\n')
    );

    const { data: existing } = await supabase
      .from('film_translation')
      .select('locale, status, source_hash')
      .eq('film_id', filmId);

    const byLocale = new Map(
      (existing ?? []).map((r: { locale: string; status: string; source_hash: string | null }) => [
        r.locale,
        r,
      ])
    );

    const results: Record<string, string> = {};

    for (const locale of LOCALES) {
      const row = byLocale.get(locale);
      if (row?.status === 'reviewed') {
        results[locale] = 'skipped_reviewed';
        continue;
      }
      if (row?.source_hash === sourceHash && row.status === 'auto') {
        results[locale] = 'unchanged';
        continue;
      }

      const translated = await translateCopy(source, locale);

      const { error: upsertError } = await supabase.from('film_translation').upsert(
        {
          film_id: filmId,
          locale,
          ...translated,
          source_hash: sourceHash,
          status: 'auto',
          provider: 'openai',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'film_id,locale' }
      );

      if (upsertError) {
        results[locale] = `error:${upsertError.message}`;
        continue;
      }

      const { error: searchError } = await supabase.rpc('sync_film_to_search', {
        p_film_id: filmId,
        p_locale: locale,
      });
      if (searchError) {
        results[locale] = `translated_search_error:${searchError.message}`;
        continue;
      }

      results[locale] = 'upserted';
    }

    // Keep EN search row fresh after translation pass
    await supabase.rpc('sync_film_to_search', {
      p_film_id: filmId,
      p_locale: 'en',
    });

    return json({ film_id: filmId, source_hash: sourceHash, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: message }, 500);
  }
});

function pickCopy(film: FilmRow): FilmCopy {
  const loc = film.location;
  const location = Array.isArray(loc)
    ? loc.filter(Boolean).join(', ')
    : loc == null
      ? ''
      : String(loc);

  return {
    name: film.name ?? '',
    teaser: film.teaser ?? '',
    description: film.description ?? '',
    note: film.note ?? '',
    last_line: film.last_line ?? '',
    last_line_attribution: film.last_line_attribution ?? '',
    alt_text: film.alt_text ?? '',
    location,
  };
}

async function translateCopy(source: FilmCopy, locale: AppLocale): Promise<FilmCopy> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not set');
  }

  const system = [
    `You translate Fjorr short-film metadata into ${LOCALE_LABEL[locale]} (${locale}).`,
    'Return ONLY valid JSON with keys: name, teaser, description, note, last_line, last_line_attribution, alt_text, location.',
    'Keep proper nouns (Fjorr, person names, brand names) unchanged unless a well-known localized form exists.',
    'Do not add marketing fluff. Match tone: concise, cinematic.',
    'Empty string input → empty string output.',
  ].join(' ');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: JSON.stringify(source) },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(raw) as Partial<FilmCopy>;

  return {
    name: String(parsed.name ?? source.name),
    teaser: String(parsed.teaser ?? source.teaser),
    description: String(parsed.description ?? source.description),
    note: String(parsed.note ?? source.note),
    last_line: String(parsed.last_line ?? source.last_line),
    last_line_attribution: String(
      parsed.last_line_attribution ?? source.last_line_attribution
    ),
    alt_text: String(parsed.alt_text ?? source.alt_text),
    location: String(parsed.location ?? source.location),
  };
}

async function sha256(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
