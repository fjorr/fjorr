/**
 * Supabase Edge Function: translate-artifact
 *
 * Deploy:  supabase functions deploy translate-artifact
 * Secrets: OPENAI_API_KEY (shared with translate-film), SUPABASE_SERVICE_ROLE_KEY (auto)
 *
 * Triggers:
 *  1. Database Webhook on public.artifact INSERT/UPDATE → this function
 *  2. Manual backfill: POST /functions/v1/translate-artifact { "artifact_id": "..." }
 *  3. Cron: retranslate where status = 'stale'
 *
 * Payload ID resolution (first match wins):
 *  - body.artifact_id          (manual / scripts)
 *  - body.record.id            (Supabase Database Webhook)
 *  - body.record.artifact_id   (defensive)
 *  - body.id                   (loose / older callers)
 *
 * Behavior:
 *  - Reads English copy from public.artifact
 *  - Skips locales with status = 'reviewed'
 *  - Upserts artifact_translation for es/fr/it/de/pt/sv/hi/ko/ja/zh-tw
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

type ArtifactRow = {
  id: string;
  name: string | null;
  teaser: string | null;
  description: string | null;
  label: string | null;
  quote: string | null;
  link_cta: string | null;
};

type ArtifactCopy = {
  name: string;
  teaser: string;
  description: string;
  label: string;
  quote: string;
  link_cta: string;
};

const COPY_KEYS: (keyof ArtifactCopy)[] = [
  'name',
  'teaser',
  'description',
  'label',
  'quote',
  'link_cta',
];

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    const body = await req.json().catch(() => ({}));

    // Ignore webhook deletes — nothing to translate.
    const webhookType = typeof body.type === 'string' ? body.type.toUpperCase() : '';
    if (webhookType === 'DELETE') {
      return json({ skipped: 'delete' });
    }

    const artifactId = resolveArtifactId(body);
    if (!artifactId) {
      return json(
        {
          error: 'artifact_id required',
          hint: 'Send { "artifact_id": "<uuid>" } or a Database Webhook body with record.id',
        },
        400
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: artifact, error: artifactError } = await supabase
      .from('artifact')
      .select('id, name, teaser, description, label, quote, link_cta')
      .eq('id', artifactId)
      .maybeSingle();

    if (artifactError || !artifact) {
      return json({ error: artifactError?.message ?? 'artifact not found' }, 404);
    }

    const source = pickCopy(artifact as ArtifactRow);
    const sourceHash = await sha256(COPY_KEYS.map((k) => source[k]).join('\n'));

    const { data: existing } = await supabase
      .from('artifact_translation')
      .select('locale, status, source_hash')
      .eq('artifact_id', artifactId);

    const byLocale = new Map(
      (existing ?? []).map(
        (r: { locale: string; status: string; source_hash: string | null }) => [
          r.locale,
          r,
        ]
      )
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

      const { error: upsertError } = await supabase
        .from('artifact_translation')
        .upsert(
          {
            artifact_id: artifactId,
            locale,
            ...translated,
            source_hash: sourceHash,
            status: 'auto',
            provider: 'openai',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'artifact_id,locale' }
        );

      if (upsertError) {
        results[locale] = `error:${upsertError.message}`;
        continue;
      }

      const { error: searchError } = await supabase.rpc('sync_artifact_to_search', {
        p_artifact_id: artifactId,
        p_locale: locale,
      });
      if (searchError) {
        results[locale] = `translated_search_error:${searchError.message}`;
        continue;
      }

      results[locale] = 'upserted';
    }

    await supabase.rpc('sync_artifact_to_search', {
      p_artifact_id: artifactId,
      p_locale: 'en',
    });

    return json({ artifact_id: artifactId, source_hash: sourceHash, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: message }, 500);
  }
});

/** Manual `{ artifact_id }` and Database Webhook `{ record: { id } }` (plus a few aliases). */
function resolveArtifactId(body: Record<string, unknown>): string | undefined {
  const asId = (value: unknown): string | undefined => {
    if (typeof value === 'string' && value.trim()) return value.trim();
    return undefined;
  };

  const direct = asId(body.artifact_id) ?? asId(body.id);
  if (direct) return direct;

  const record = body.record;
  if (record && typeof record === 'object') {
    const row = record as Record<string, unknown>;
    return asId(row.id) ?? asId(row.artifact_id);
  }

  return undefined;
}

function pickCopy(artifact: ArtifactRow): ArtifactCopy {
  return {
    name: artifact.name ?? '',
    teaser: artifact.teaser ?? '',
    description: artifact.description ?? '',
    label: artifact.label ?? '',
    quote: artifact.quote ?? '',
    link_cta: artifact.link_cta ?? '',
  };
}

async function translateCopy(
  source: ArtifactCopy,
  locale: AppLocale
): Promise<ArtifactCopy> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not set');
  }

  const system = [
    `You translate Fjorr cultural-artifact metadata into ${LOCALE_LABEL[locale]} (${locale}).`,
    'Return ONLY valid JSON with keys: name, teaser, description, label, quote, link_cta.',
    'Keep proper nouns (Fjorr, person names, place names, brand names) unchanged unless a well-known localized form exists.',
    'Do not add marketing fluff. Match tone: concise, editorial, cultural.',
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
  const parsed = JSON.parse(raw) as Partial<ArtifactCopy>;

  return {
    name: String(parsed.name ?? source.name),
    teaser: String(parsed.teaser ?? source.teaser),
    description: String(parsed.description ?? source.description),
    label: String(parsed.label ?? source.label),
    quote: String(parsed.quote ?? source.quote),
    link_cta: String(parsed.link_cta ?? source.link_cta),
  };
}

async function sha256(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
