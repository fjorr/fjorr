'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isOwnBureauxActive } from '@/lib/bureaux';
import { revalidatePath } from 'next/cache';

const DISCIPLINES = new Set([
  'archivists',
  'cinematographers',
  'composers',
  'curators',
  'directors',
  'editors',
  'producers',
  'researchers',
  'sound designers',
  'writers',
  'other',
]);

const MIN_NOTE = 40;
const MAX_NOTE = 800;
const RATE_DAYS = 30;
const OWN_CABINET_LIMIT = 100;

export type CabinetScoutKind = 'offer' | 'suggest';

/** Soft member-facing status — desk uses prospect / member / paused. */
export type CabinetOfferStatus = 'prospect' | 'member' | 'paused';

export type CabinetOfferRow = {
  id: string;
  created_at: string;
  name: string;
  discipline: string;
  kind: CabinetScoutKind;
  status: CabinetOfferStatus;
};

export type CabinetOfferResult =
  | { ok: true }
  | {
      ok: false;
      error:
        | 'signInRequired'
        | 'bureauxRequired'
        | 'nameRequired'
        | 'disciplineRequired'
        | 'emailRequired'
        | 'emailInvalid'
        | 'reelRequired'
        | 'reelInvalid'
        | 'noteRequired'
        | 'noteTooLong'
        | 'rateLimited'
        | 'submitError';
    };

/** Names this member put forward — service read after auth (desk table). */
export async function getOwnCabinetOffers(
  userId?: string
): Promise<CabinetOfferRow[]> {
  const supabase = await createClient();
  let uid = userId;
  if (!uid) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];
    uid = user.id;
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from('cabinet_members')
    .select('id, created_at, name, discipline, source, status')
    .eq('submitted_by_user_id', uid)
    .in('source', ['offer', 'referral'])
    .order('created_at', { ascending: false })
    .limit(OWN_CABINET_LIMIT);

  if (error) {
    console.error('getOwnCabinetOffers failed:', error.message);
    return [];
  }

  return (data || []).map((row: {
    id: string;
    created_at: string;
    name: string | null;
    discipline: string | null;
    source: string | null;
    status: string | null;
  }) => ({
    id: String(row.id),
    created_at: String(row.created_at),
    name: String(row.name || ''),
    discipline: String(row.discipline || ''),
    kind: row.source === 'referral' ? ('suggest' as const) : ('offer' as const),
    status: (['prospect', 'member', 'paused'].includes(String(row.status))
      ? row.status
      : 'prospect') as CabinetOfferStatus,
  }));
}

/** Public Cabinet intake — self-offer or suggest someone. */
export async function submitCabinetOffer(input: {
  kind: CabinetScoutKind;
  name: string;
  discipline: string;
  email: string;
  reelUrl: string;
  note: string;
}): Promise<CabinetOfferResult> {
  const kind: CabinetScoutKind =
    input.kind === 'suggest' ? 'suggest' : 'offer';
  const source = kind === 'suggest' ? 'referral' : 'offer';

  const name = (input.name || '').trim().slice(0, 120);
  if (name.length < 2) return { ok: false, error: 'nameRequired' };

  const discipline = (input.discipline || '').trim().toLowerCase();
  if (!DISCIPLINES.has(discipline)) {
    return { ok: false, error: 'disciplineRequired' };
  }

  const email = (input.email || '').trim().toLowerCase();
  if (!email) return { ok: false, error: 'emailRequired' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'emailInvalid' };
  }

  const reelUrl = (input.reelUrl || '').trim();
  if (!reelUrl) return { ok: false, error: 'reelRequired' };
  try {
    const u = new URL(reelUrl);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return { ok: false, error: 'reelInvalid' };
    }
  } catch {
    return { ok: false, error: 'reelInvalid' };
  }

  const note = (input.note || '').trim();
  if (note.length < MIN_NOTE) return { ok: false, error: 'noteRequired' };
  if (note.length > MAX_NOTE) return { ok: false, error: 'noteTooLong' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'signInRequired' };
  }

  if (!(await isOwnBureauxActive(user.id))) {
    return { ok: false, error: 'bureauxRequired' };
  }

  const db = createServiceClient();
  const since = new Date(
    Date.now() - RATE_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  // Don't re-file the same person (by email) too often, any intake source.
  const { count, error: countError } = await db
    .from('cabinet_members')
    .select('id', { count: 'exact', head: true })
    .eq('email', email)
    .in('source', ['offer', 'referral', 'scout'])
    .gte('created_at', since);

  if (countError) {
    console.error('submitCabinetOffer rate check failed:', countError.message);
    return { ok: false, error: 'submitError' };
  }
  if ((count || 0) > 0) {
    return { ok: false, error: 'rateLimited' };
  }

  const kindLine = kind === 'suggest' ? 'Suggested by a member' : 'Self-offer';
  const notes = [
    note,
    '',
    `— ${kindLine}`,
    user.email ? `from ${user.email}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const { error } = await db.from('cabinet_members').insert({
    name,
    discipline,
    email,
    reel_url: reelUrl,
    notes,
    source,
    status: 'prospect',
    submitted_by_user_id: user.id,
  });

  if (error) {
    console.error('submitCabinetOffer failed:', error.message);
    return { ok: false, error: 'submitError' };
  }

  revalidatePath('/admin/cabinet');
  revalidatePath('/admin');
  revalidatePath('/account/cabinet');
  return { ok: true };
}
