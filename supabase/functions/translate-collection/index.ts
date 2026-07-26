/**
 * Supabase Edge Function: translate-collection
 *
 * Deploy:  supabase functions deploy translate-collection
 *
 * Payload:
 *  - Manual:  { "collection_id": "..." }
 *  - Webhook: { "record": { "id": "..." } } on public.collection INSERT/UPDATE
 *
 * Upserts collection_translation.name for each locale. Skips status = 'reviewed'.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  LOCALES,
  json,
  resolveUuidId,
  sha256,
  translateName,
} from '../_shared/i18n.ts';

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
      .select('id, name')
      .eq('id', collectionId)
      .maybeSingle();

    if (collectionError || !collection) {
      return json(
        { error: collectionError?.message ?? 'collection not found' },
        404
      );
    }

    const englishName = String(collection.name ?? '').trim();
    const sourceHash = await sha256(englishName);

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

      const name = await translateName(englishName, locale, 'collection');

      const { error: upsertError } = await supabase
        .from('collection_translation')
        .upsert(
          {
            collection_id: collectionId,
            locale,
            name,
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
