/**
 * Supabase Edge Function: translate-theme
 *
 * Deploy:  supabase functions deploy translate-theme
 *
 * Payload:
 *  - Manual:  { "theme_id": "..." }
 *  - Webhook: { "record": { "id": "..." } } on public.theme INSERT/UPDATE
 *
 * Upserts theme_translation.name for each locale. Skips status = 'reviewed'.
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

    const themeId = resolveUuidId(body, 'theme_id');
    if (!themeId) {
      return json(
        {
          error: 'theme_id required',
          hint: 'Send { "theme_id": "<uuid>" } or a Database Webhook body with record.id',
        },
        400
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: theme, error: themeError } = await supabase
      .from('theme')
      .select('id, name')
      .eq('id', themeId)
      .maybeSingle();

    if (themeError || !theme) {
      return json({ error: themeError?.message ?? 'theme not found' }, 404);
    }

    const englishName = String(theme.name ?? '').trim();
    const sourceHash = await sha256(englishName);

    const { data: existing } = await supabase
      .from('theme_translation')
      .select('locale, status, source_hash')
      .eq('theme_id', themeId);

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

      const name = await translateName(englishName, locale, 'theme');

      const { error: upsertError } = await supabase.from('theme_translation').upsert(
        {
          theme_id: themeId,
          locale,
          name,
          source_hash: sourceHash,
          status: 'auto',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'theme_id,locale' }
      );

      results[locale] = upsertError ? `error:${upsertError.message}` : 'upserted';
    }

    return json({ theme_id: themeId, source_hash: sourceHash, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: message }, 500);
  }
});
