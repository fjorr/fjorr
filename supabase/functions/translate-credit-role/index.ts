/**
 * Supabase Edge Function: translate-credit-role
 *
 * Deploy:  supabase functions deploy translate-credit-role
 *
 * Note: table is credit_role / credit_role_translation (not creator_role).
 * Primary key is text `code` (e.g. "director"), not a UUID.
 *
 * Payload:
 *  - Manual:  { "role_code": "director" } or { "code": "director" }
 *  - Webhook: { "record": { "code": "director" } } on public.credit_role INSERT/UPDATE
 *
 * Upserts credit_role_translation.name for each locale. Skips status = 'reviewed'.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  LOCALES,
  asId,
  json,
  sha256,
  translateName,
} from '../_shared/i18n.ts';

function resolveRoleCode(body: Record<string, unknown>): string | undefined {
  const direct = asId(body.role_code) ?? asId(body.code);
  if (direct) return direct;

  const record = body.record;
  if (record && typeof record === 'object') {
    const row = record as Record<string, unknown>;
    return asId(row.code) ?? asId(row.role_code);
  }
  return undefined;
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204 });

    const body = await req.json().catch(() => ({}));
    const webhookType = typeof body.type === 'string' ? body.type.toUpperCase() : '';
    if (webhookType === 'DELETE') return json({ skipped: 'delete' });

    const roleCode = resolveRoleCode(body);
    if (!roleCode) {
      return json(
        {
          error: 'role_code required',
          hint: 'Send { "role_code": "director" } or a Database Webhook body with record.code',
        },
        400
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: role, error: roleError } = await supabase
      .from('credit_role')
      .select('code, name')
      .eq('code', roleCode)
      .maybeSingle();

    if (roleError || !role) {
      return json({ error: roleError?.message ?? 'credit_role not found' }, 404);
    }

    const englishName = String(role.name ?? '').trim();
    const sourceHash = await sha256(englishName);

    const { data: existing } = await supabase
      .from('credit_role_translation')
      .select('locale, status, source_hash')
      .eq('role_code', roleCode);

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

      const name = await translateName(englishName, locale, 'credit role');

      const { error: upsertError } = await supabase
        .from('credit_role_translation')
        .upsert(
          {
            role_code: roleCode,
            locale,
            name,
            source_hash: sourceHash,
            status: 'auto',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'role_code,locale' }
        );

      results[locale] = upsertError ? `error:${upsertError.message}` : 'upserted';
    }

    return json({ role_code: roleCode, source_hash: sourceHash, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: message }, 500);
  }
});
