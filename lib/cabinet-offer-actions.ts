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

type CabinetMemberListRow = {
  id: string;
  created_at: string;
  name: string | null;
  discipline: string | null;
  source: string | null;
  status: string | null;
};

function mapCabinetOfferRows(rows: CabinetMemberListRow[]): CabinetOfferRow[] {
  return rows.map((row) => ({
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

/** Names this member put forward — service read after auth (desk table). */
export async function getOwnCabinetOffers(
  userId?: string
): Promise<CabinetOfferRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const uid = userId || user?.id;
  if (!uid) return [];

  const db = createServiceClient();
  const select =
    'id, created_at, name, discipline, source, status' as const;

  const { data, error } = await db
    .from('cabinet_members')
    .select(select)
    .eq('submitted_by_user_id', uid)
    .in('source', ['offer', 'referral'])
    .order('created_at', { ascending: false })
    .limit(OWN_CABINET_LIMIT);

  if (error) {
    console.error('getOwnCabinetOffers failed:', error.message);
    return [];
  }

  const byId = new Map<string, CabinetMemberListRow>();
  for (const row of (data || []) as CabinetMemberListRow[]) {
    byId.set(String(row.id), row);
  }

  // Pre-attribution filings only left "from {email}" in notes.
  let email = user?.email?.trim().toLowerCase() || null;
  if (!email) {
    const { data: authUser, error: authError } =
      await db.auth.admin.getUserById(uid);
    if (authError) {
      console.error(
        'getOwnCabinetOffers auth lookup failed:',
        authError.message
      );
    } else {
      email = authUser.user?.email?.trim().toLowerCase() || null;
    }
  }

  if (email && byId.size < OWN_CABINET_LIMIT) {
    const { data: legacy, error: legacyError } = await db
      .from('cabinet_members')
      .select(select)
      .is('submitted_by_user_id', null)
      .in('source', ['offer', 'referral'])
      .ilike('notes', `%from ${email}%`)
      .order('created_at', { ascending: false })
      .limit(OWN_CABINET_LIMIT);

    if (legacyError) {
      console.error(
        'getOwnCabinetOffers legacy lookup failed:',
        legacyError.message
      );
    } else {
      for (const row of (legacy || []) as CabinetMemberListRow[]) {
        byId.set(String(row.id), row);
      }
    }
  }

  const merged = Array.from(byId.values()).sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return mapCabinetOfferRows(merged.slice(0, OWN_CABINET_LIMIT));
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

  // One filing per email, forever — any intake source.
  const { count, error: countError } = await db
    .from('cabinet_members')
    .select('id', { count: 'exact', head: true })
    .eq('email', email)
    .in('source', ['offer', 'referral', 'scout']);

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
