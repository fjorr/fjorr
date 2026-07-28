/**
 * Supabase Edge Function: translate-collection
 *
 * Deploy:  supabase functions deploy translate-collection
 *
 * Payload:
 *  - Manual:  { "collection_id": "..." }
 *  - Webhook: { "record": { "id": "..." } } on public.collection INSERT/UPDATE
 *
 * Upserts collection_translation.name + description for each locale.
 * Skips status = 'reviewed'.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  LOCALES,
  LOCALE_LABEL,
  json,
  resolveUuidId,
  sha256,
  type AppLocale,
} from '../_shared/i18n.ts';

type CollectionCopy = {
  name: string;
  description: string;
};

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204 });

    const body = await req.json().catch(() => ({}));
    const webhookType = typeof body.type === 'string' ? body.type.toUpperCase() : '';
    if (webhookType === 'DELETE') return json({ skipped: 'delete' });

    const collectionId = resolveUuidId(body, 'collection_id');
    if (!collectionId) {
      return json(
        {
          error: 'collection_id required',
          hint: 'Send { "collection_id": "<uuid>" } or a Database Webhook body with record.id',
        },
        400
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: collection, error: collectionError } = await supabase
      .from('collection')
      .select('id, name, description')
      .eq('id', collectionId)
      .maybeSingle();

    if (collectionError || !collection) {
      return json(
        { error: collectionError?.message ?? 'collection not found' },
        404
      );
    }

    const source: CollectionCopy = {
      name: String(collection.name ?? '').trim(),
      description: String(collection.description ?? '').trim(),
    };

    if (!source.name) {
      return json({ error: 'collection name is empty' }, 400);
    }

    const sourceHash = await sha256(
      `${source.name}\n${source.description}`
    );

    const { data: existing } = await supabase
      .from('collection_translation')
      .select('locale, status, source_hash')
      .eq('collection_id', collectionId);

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
        .from('collection_translation')
        .upsert(
          {
            collection_id: collectionId,
            locale,
            name: translated.name,
            description: translated.description || null,
            source_hash: sourceHash,
            status: 'auto',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'collection_id,locale' }
        );

      results[locale] = upsertError ? `error:${upsertError.message}` : 'upserted';
    }

    return json({
      collection_id: collectionId,
      source_hash: sourceHash,
      results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: message }, 500);
  }
});

async function translateCopy(
  source: CollectionCopy,
  locale: AppLocale
): Promise<CollectionCopy> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not set');
  }

  const system = [
    `You translate a Fjorr collection (mix) label and optional one-line subhead into ${LOCALE_LABEL[locale]} (${locale}).`,
    'Return ONLY valid JSON with keys: name, description.',
    'name is a short UI label — concise, not marketing.',
    'description is one quiet editorial line under the mix title (Shel Silverstein–simple when the English is). Keep that spirit; do not expand into a paragraph.',
    'Keep proper nouns unchanged unless a well-known localized form exists.',
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
  const parsed = JSON.parse(raw) as Partial<CollectionCopy>;

  return {
    name: String(parsed.name ?? source.name).trim() || source.name,
    description: String(parsed.description ?? source.description).trim(),
  };
}
