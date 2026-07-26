/**
 * Supabase Edge Function: translate-tag
 *
 * Deploy:  supabase functions deploy translate-tag
 *
 * Payload:
 *  - Manual:  { "tag_id": "..." }
 *  - Webhook: { "record": { "id": "..." } } on public.tag INSERT/UPDATE
 *
 * Upserts tag_translation.name for each locale. Skips status = 'reviewed'.
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

    const tagId = resolveUuidId(body, 'tag_id');
    if (!tagId) {
      return json(
        {
          error: 'tag_id required',
          hint: 'Send { "tag_id": "<uuid>" } or a Database Webhook body with record.id',
        },
        400
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: tag, error: tagError } = await supabase
      .from('tag')
      .select('id, name')
      .eq('id', tagId)
      .maybeSingle();

    if (tagError || !tag) {
      return json({ error: tagError?.message ?? 'tag not found' }, 404);
    }

    const englishName = String(tag.name ?? '').trim();
    const sourceHash = await sha256(englishName);

    const { data: existing } = await supabase
      .from('tag_translation')
      .select('locale, status, source_hash')
      .eq('tag_id', tagId);

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

      const name = await translateName(englishName, locale, 'tag');

      const { error: upsertError } = await supabase.from('tag_translation').upsert(
        {
          tag_id: tagId,
          locale,
          name,
          source_hash: sourceHash,
          status: 'auto',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'tag_id,locale' }
      );

      results[locale] = upsertError ? `error:${upsertError.message}` : 'upserted';
    }

    return json({ tag_id: tagId, source_hash: sourceHash, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: message }, 500);
  }
});
