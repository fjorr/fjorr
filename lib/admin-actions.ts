/**
 * Admin ops — nominations + bounties (service role after allowlist gate).
 */

'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin-auth';
import { sendNominationStatusEmail } from '@/lib/email/nomination-mail';
import { createServiceClient } from '@/lib/supabase/service';
import type {
  NominationKind,
  NominationStatus,
} from '@/lib/nomination-actions';

export type AdminNomination = {
  id: string;
  created_at: string;
  story_details: string;
  kind: NominationKind;
  why_fjorr: string;
  setting: string;
  proof_or_premise: string;
  proof_url: string | null;
  status: NominationStatus;
  status_reason: string | null;
  contributor_email: string;
  user_id: string;
  bounty_id: string | null;
  bounty_title: string | null;
};

export type AdminBounty = {
  id: string;
  slug: string;
  title: string;
  brief: string;
  amount_cents: number;
  currency: string;
  status: 'active' | 'filled' | 'closed';
  hero_image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminOverview = {
  nominationsTotal: number;
  nominationsByStatus: Record<string, number>;
  bountiesActive: number;
  recentNominations: AdminNomination[];
};

const STATUSES: NominationStatus[] = [
  'received',
  'in_review',
  'shortlisted',
  'passed',
  'in_production',
  'released',
];

function normalizeSlug(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function mapNomination(row: any): AdminNomination {
  const bounty = Array.isArray(row.bounty) ? row.bounty[0] : row.bounty;
  return {
    id: String(row.id),
    created_at: String(row.created_at),
    story_details: String(row.story_details || ''),
    kind: (row.kind || 'true') as NominationKind,
    why_fjorr: String(row.why_fjorr || ''),
    setting: String(row.setting || ''),
    proof_or_premise: String(row.proof_or_premise || ''),
    proof_url: row.proof_url ? String(row.proof_url) : null,
    status: (row.status || 'received') as NominationStatus,
    status_reason: row.status_reason ? String(row.status_reason) : null,
    contributor_email: String(row.contributor_email || ''),
    user_id: String(row.user_id || ''),
    bounty_id: row.bounty_id ? String(row.bounty_id) : null,
    bounty_title: bounty?.title ? String(bounty.title) : null,
  };
}

function mapBounty(row: any): AdminBounty {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    brief: String(row.brief || ''),
    amount_cents: Number(row.amount_cents) || 0,
    currency: String(row.currency || 'USD'),
    status: row.status as AdminBounty['status'],
    hero_image_url: row.hero_image_url ? String(row.hero_image_url) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function getAdminOverview(): Promise<AdminOverview> {
  await requireAdmin();
  const db = createServiceClient();

  const [{ data: statusRows }, { count: bountyCount }, { data: recentRows }] =
    await Promise.all([
      db.from('nominations').select('status'),
      db
        .from('bounties')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
      db
        .from('nominations')
        .select(
          `
          id, created_at, story_details, kind, why_fjorr, setting,
          proof_or_premise, proof_url, status, status_reason,
          contributor_email, user_id, bounty_id,
          bounty:bounty_id ( title )
        `
        )
        .order('created_at', { ascending: false })
        .limit(8),
    ]);

  const byStatus: Record<string, number> = {};
  for (const s of STATUSES) byStatus[s] = 0;
  for (const row of statusRows || []) {
    const s = String(row.status || 'received');
    byStatus[s] = (byStatus[s] || 0) + 1;
  }

  return {
    nominationsTotal: Object.values(byStatus).reduce((a, b) => a + b, 0),
    nominationsByStatus: byStatus,
    bountiesActive: bountyCount || 0,
    recentNominations: (recentRows || []).map(mapNomination),
  };
}

export async function listAdminNominations(): Promise<AdminNomination[]> {
  await requireAdmin();
  const db = createServiceClient();
  const { data, error } = await db
    .from('nominations')
    .select(
      `
      id, created_at, story_details, kind, why_fjorr, setting,
      proof_or_premise, proof_url, status, status_reason,
      contributor_email, user_id, bounty_id,
      bounty:bounty_id ( title )
    `
    )
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('listAdminNominations failed:', error.message);
    return [];
  }

  return (data || []).map(mapNomination);
}

export async function updateNominationStatus(input: {
  id: string;
  status: NominationStatus;
  statusReason?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();

  if (!STATUSES.includes(input.status)) {
    return { ok: false, error: 'Invalid status' };
  }

  const db = createServiceClient();
  const reason =
    input.status === 'passed'
      ? (input.statusReason || '').trim() || null
      : null;

  const { data: before } = await db
    .from('nominations')
    .select('id, status, story_details, contributor_email, bounty_id')
    .eq('id', input.id)
    .maybeSingle();

  if (!before) {
    return { ok: false, error: 'Nomination not found' };
  }

  const previousStatus = String(before.status || 'received') as NominationStatus;

  const { error } = await db
    .from('nominations')
    .update({
      status: input.status,
      status_reason: reason,
    })
    .eq('id', input.id);

  if (error) {
    console.error('updateNominationStatus failed:', error.message);
    return { ok: false, error: error.message };
  }

  if (previousStatus !== input.status) {
    let bountyTitle: string | null = null;
    if (before.bounty_id) {
      const { data: bounty } = await db
        .from('bounties')
        .select('title')
        .eq('id', before.bounty_id)
        .maybeSingle();
      bountyTitle = bounty?.title ? String(bounty.title) : null;
    }

    await sendNominationStatusEmail({
      to: String(before.contributor_email || ''),
      status: input.status,
      storyDetails: String(before.story_details || ''),
      statusReason: reason,
      bountyTitle,
    });
  }

  revalidatePath('/admin');
  revalidatePath('/admin/nominations');
  revalidatePath('/account');
  revalidatePath('/account/nominations');
  return { ok: true };
}

/**
 * Award: attach/confirm bounty, mark nomination shortlisted, fill the bounty.
 * Operational first-to-file.
 */
export async function awardNomination(input: {
  id: string;
  bountyId?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const db = createServiceClient();

  const { data: nom, error: nomErr } = await db
    .from('nominations')
    .select('id, bounty_id, status, story_details, contributor_email')
    .eq('id', input.id)
    .maybeSingle();

  if (nomErr || !nom) {
    return { ok: false, error: nomErr?.message || 'Nomination not found' };
  }

  const bountyId = input.bountyId || nom.bounty_id || null;
  if (!bountyId) {
    return { ok: false, error: 'Attach a bounty before awarding' };
  }

  const { data: bounty } = await db
    .from('bounties')
    .select('id, status, slug, title')
    .eq('id', bountyId)
    .maybeSingle();

  if (!bounty) {
    return { ok: false, error: 'Bounty not found' };
  }

  const { error: updateNomErr } = await db
    .from('nominations')
    .update({
      bounty_id: bountyId,
      status: 'shortlisted',
      status_reason: null,
    })
    .eq('id', input.id);

  if (updateNomErr) {
    console.error('awardNomination nom failed:', updateNomErr.message);
    return { ok: false, error: updateNomErr.message };
  }

  const { error: updateBountyErr } = await db
    .from('bounties')
    .update({ status: 'filled' })
    .eq('id', bountyId);

  if (updateBountyErr) {
    console.error('awardNomination bounty failed:', updateBountyErr.message);
    return { ok: false, error: updateBountyErr.message };
  }

  await sendNominationStatusEmail({
    to: String(nom.contributor_email || ''),
    status: 'shortlisted',
    storyDetails: String(nom.story_details || ''),
    bountyTitle: bounty.title ? String(bounty.title) : null,
    awarded: true,
  });

  revalidatePath('/admin');
  revalidatePath('/admin/nominations');
  revalidatePath('/admin/bounties');
  revalidatePath('/account');
  revalidatePath('/account/nominations');
  revalidatePath('/bounties');
  revalidatePath('/nominate');
  if (bounty.slug) {
    revalidatePath(`/bounties/${bounty.slug}`);
  }
  return { ok: true };
}

/** Attach (or clear) a bounty on any nomination — including General pitches. */
export async function attachNominationBounty(input: {
  id: string;
  bountyId: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const db = createServiceClient();

  if (input.bountyId) {
    const { data: bounty } = await db
      .from('bounties')
      .select('id, status')
      .eq('id', input.bountyId)
      .maybeSingle();
    if (!bounty) {
      return { ok: false, error: 'Bounty not found' };
    }
  }

  const { error } = await db
    .from('nominations')
    .update({ bounty_id: input.bountyId })
    .eq('id', input.id);

  if (error) {
    console.error('attachNominationBounty failed:', error.message);
    return { ok: false, error: error.message };
  }

  revalidatePath('/admin');
  revalidatePath('/admin/nominations');
  revalidatePath('/account');
  revalidatePath('/account/nominations');
  return { ok: true };
}

export async function listAdminBounties(): Promise<AdminBounty[]> {
  await requireAdmin();
  const db = createServiceClient();
  const { data, error } = await db
    .from('bounties')
    .select(
      'id, slug, title, brief, amount_cents, currency, status, hero_image_url, created_at, updated_at'
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('listAdminBounties failed:', error.message);
    return [];
  }

  return (data || []).map(mapBounty);
}

export async function createBounty(input: {
  title: string;
  slug?: string;
  brief: string;
  amountDollars: number;
  currency?: string;
  heroImageUrl?: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  await requireAdmin();

  const title = input.title.trim();
  const brief = input.brief.trim();
  const slug = normalizeSlug(input.slug || title);
  const amount = Math.round(Number(input.amountDollars) * 100);
  const currency = (input.currency || 'USD').trim().toUpperCase() || 'USD';
  const heroImageUrl = (input.heroImageUrl || '').trim() || null;

  if (!title) return { ok: false, error: 'Title required' };
  if (!slug || slug.length < 2) return { ok: false, error: 'Slug invalid' };
  if (!Number.isFinite(amount) || amount < 0) {
    return { ok: false, error: 'Amount invalid' };
  }

  if (heroImageUrl) {
    try {
      const u = new URL(heroImageUrl);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') {
        return { ok: false, error: 'Hero image URL invalid' };
      }
    } catch {
      return { ok: false, error: 'Hero image URL invalid' };
    }
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from('bounties')
    .insert({
      title,
      slug,
      brief,
      amount_cents: amount,
      currency,
      status: 'active',
      hero_image_url: heroImageUrl,
    })
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('createBounty failed:', error.message);
    return { ok: false, error: error.message };
  }

  revalidatePath('/admin');
  revalidatePath('/admin/bounties');
  revalidatePath('/bounties');
  revalidatePath('/nominate');
  return { ok: true, id: String(data?.id) };
}

export async function updateBountyStatus(input: {
  id: string;
  status: 'active' | 'filled' | 'closed';
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();

  if (!['active', 'filled', 'closed'].includes(input.status)) {
    return { ok: false, error: 'Invalid status' };
  }

  const db = createServiceClient();
  const { error } = await db
    .from('bounties')
    .update({ status: input.status })
    .eq('id', input.id);

  if (error) {
    console.error('updateBountyStatus failed:', error.message);
    return { ok: false, error: error.message };
  }

  revalidatePath('/admin');
  revalidatePath('/admin/bounties');
  revalidatePath('/bounties');
  revalidatePath('/nominate');
  return { ok: true };
}

/** Update hero image on a bounty brief. */
export async function updateBountyHero(input: {
  id: string;
  heroImageUrl: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const heroImageUrl = input.heroImageUrl.trim();

  if (heroImageUrl) {
    try {
      const u = new URL(heroImageUrl);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') {
        return { ok: false, error: 'Hero image URL invalid' };
      }
    } catch {
      return { ok: false, error: 'Hero image URL invalid' };
    }
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from('bounties')
    .update({ hero_image_url: heroImageUrl || null })
    .eq('id', input.id)
    .select('slug')
    .maybeSingle();

  if (error) {
    console.error('updateBountyHero failed:', error.message);
    return { ok: false, error: error.message };
  }

  revalidatePath('/admin/bounties');
  revalidatePath('/bounties');
  if (data?.slug) {
    revalidatePath(`/bounties/${data.slug}`);
  }
  return { ok: true };
}

// -----------------------------------------------------------------------------
// Plus Machine — member film notes
// -----------------------------------------------------------------------------

export type AdminFilmNote = {
  id: string;
  created_at: string;
  film_id: string;
  film_name: string | null;
  film_slug: string | null;
  body: string;
  at_seconds: number | null;
  status: 'new' | 'read' | 'archived';
  user_id: string;
  member_email: string | null;
};

export async function listAdminFilmNotes(): Promise<AdminFilmNote[]> {
  await requireAdmin();
  const db = createServiceClient();
  const { data, error } = await db
    .from('film_notes')
    .select(
      `
      id, created_at, film_id, body, at_seconds, status, user_id,
      film:film_id ( name, slug )
    `
    )
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('listAdminFilmNotes failed:', error.message);
    return [];
  }

  const rows = data || [];
  const userIds = [...new Set(rows.map((r) => String(r.user_id)).filter(Boolean))];
  const emailByUser = new Map<string, string>();
  await Promise.all(
    userIds.map(async (id) => {
      const { data: userData } = await db.auth.admin.getUserById(id);
      if (userData?.user?.email) {
        emailByUser.set(id, userData.user.email);
      }
    })
  );

  return rows.map((row: any) => {
    const film = Array.isArray(row.film) ? row.film[0] : row.film;
    return {
      id: String(row.id),
      created_at: String(row.created_at),
      film_id: String(row.film_id),
      film_name: film?.name ? String(film.name) : null,
      film_slug: film?.slug ? String(film.slug) : null,
      body: String(row.body || ''),
      at_seconds:
        row.at_seconds == null || Number.isNaN(Number(row.at_seconds))
          ? null
          : Math.floor(Number(row.at_seconds)),
      status: (row.status || 'new') as AdminFilmNote['status'],
      user_id: String(row.user_id),
      member_email: emailByUser.get(String(row.user_id)) || null,
    };
  });
}

export async function updateFilmNoteStatus(input: {
  id: string;
  status: 'new' | 'read' | 'archived';
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  if (!['new', 'read', 'archived'].includes(input.status)) {
    return { ok: false, error: 'Invalid status' };
  }

  const db = createServiceClient();

  const { data: before, error: beforeError } = await db
    .from('film_notes')
    .select(
      `
      id, status, user_id, body, at_seconds,
      film:film_id ( name, slug )
    `
    )
    .eq('id', input.id)
    .maybeSingle();

  if (beforeError) {
    console.error('updateFilmNoteStatus load failed:', beforeError.message);
    return { ok: false, error: beforeError.message };
  }
  if (!before) return { ok: false, error: 'Note not found' };

  const prevStatus = String(before.status || 'new');
  const { error } = await db
    .from('film_notes')
    .update({ status: input.status })
    .eq('id', input.id);

  if (error) {
    console.error('updateFilmNoteStatus failed:', error.message);
    return { ok: false, error: error.message };
  }

  // Quiet comeback: first time desk marks a note read.
  if (prevStatus === 'new' && input.status === 'read' && before.user_id) {
    try {
      const { sendPlusNoteSeenEmail } = await import('@/lib/email/plus-mail');
      const { data: userData } = await db.auth.admin.getUserById(
        String(before.user_id)
      );
      const email = userData?.user?.email;
      if (email) {
        const film = Array.isArray((before as any).film)
          ? (before as any).film[0]
          : (before as any).film;
        const atRaw = (before as any).at_seconds;
        await sendPlusNoteSeenEmail({
          to: email,
          filmName: film?.name ? String(film.name) : null,
          filmSlug: film?.slug ? String(film.slug) : null,
          body: String((before as any).body || ''),
          atSeconds:
            atRaw == null || Number.isNaN(Number(atRaw))
              ? null
              : Math.floor(Number(atRaw)),
        });
      }
    } catch (err) {
      console.error('plus seen email failed:', err);
    }
  }

  revalidatePath('/admin/plus');
  revalidatePath('/admin');
  return { ok: true };
}

// -----------------------------------------------------------------------------
// The Bureaux — desk roster
// -----------------------------------------------------------------------------

export type BureauxMemberStatus = 'prospect' | 'member' | 'paused';
export type BureauxMemberSource = 'manual' | 'scout' | 'plus' | 'referral';

export type AdminBureauxMember = {
  id: string;
  created_at: string;
  name: string;
  discipline: string;
  email: string | null;
  reel_url: string | null;
  notes: string | null;
  source: BureauxMemberSource;
  status: BureauxMemberStatus;
};

export async function listAdminBureauxMembers(): Promise<AdminBureauxMember[]> {
  await requireAdmin();
  const db = createServiceClient();
  const { data, error } = await db
    .from('bureaux_members')
    .select(
      'id, created_at, name, discipline, email, reel_url, notes, source, status'
    )
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    console.error('listAdminBureauxMembers failed:', error.message);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: String(row.id),
    created_at: String(row.created_at),
    name: String(row.name || ''),
    discipline: String(row.discipline || ''),
    email: row.email ? String(row.email) : null,
    reel_url: row.reel_url ? String(row.reel_url) : null,
    notes: row.notes ? String(row.notes) : null,
    source: (row.source || 'manual') as BureauxMemberSource,
    status: (row.status || 'prospect') as BureauxMemberStatus,
  }));
}

export async function createBureauxMember(input: {
  name: string;
  discipline: string;
  email?: string;
  reelUrl?: string;
  notes?: string;
  source?: BureauxMemberSource;
  status?: BureauxMemberStatus;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();

  const name = (input.name || '').trim();
  if (name.length < 2) return { ok: false, error: 'Name is required' };

  const discipline = (input.discipline || '').trim();
  if (!discipline) return { ok: false, error: 'Discipline is required' };

  const email = (input.email || '').trim() || null;
  const reelUrl = (input.reelUrl || '').trim() || null;
  const notes = (input.notes || '').trim() || null;
  const source = input.source || 'manual';
  const status = input.status || 'prospect';

  if (!['manual', 'scout', 'plus', 'referral'].includes(source)) {
    return { ok: false, error: 'Invalid source' };
  }
  if (!['prospect', 'member', 'paused'].includes(status)) {
    return { ok: false, error: 'Invalid status' };
  }

  const db = createServiceClient();
  const { error } = await db.from('bureaux_members').insert({
    name,
    discipline,
    email,
    reel_url: reelUrl,
    notes,
    source,
    status,
  });

  if (error) {
    console.error('createBureauxMember failed:', error.message);
    return { ok: false, error: error.message };
  }

  revalidatePath('/admin/bureaux');
  revalidatePath('/admin');
  return { ok: true };
}

export async function updateBureauxMemberStatus(input: {
  id: string;
  status: BureauxMemberStatus;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  if (!['prospect', 'member', 'paused'].includes(input.status)) {
    return { ok: false, error: 'Invalid status' };
  }

  const db = createServiceClient();
  const { error } = await db
    .from('bureaux_members')
    .update({ status: input.status })
    .eq('id', input.id);

  if (error) {
    console.error('updateBureauxMemberStatus failed:', error.message);
    return { ok: false, error: error.message };
  }

  revalidatePath('/admin/bureaux');
  revalidatePath('/admin');
  return { ok: true };
}
