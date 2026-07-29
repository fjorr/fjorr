/**
 * Intelligence — nominations + bounties (server).
 */

'use server';

import { createClient } from '@/lib/supabase/server';

export type NominationKind = 'true' | 'fiction';

export type NominationStatus =
  | 'received'
  | 'in_review'
  | 'shortlisted'
  | 'passed'
  | 'in_production'
  | 'released';

export type BountyRow = {
  id: string;
  slug: string;
  title: string;
  brief: string;
  amount_cents: number;
  currency: string;
  status: 'active' | 'filled' | 'closed';
  hero_image_url: string | null;
};

export type NominationRow = {
  id: string;
  created_at: string;
  story_details: string;
  kind: NominationKind;
  why_fjorr: string | null;
  setting: string | null;
  proof_or_premise: string | null;
  proof_url: string | null;
  status: NominationStatus;
  status_reason: string | null;
  bounty_id: string | null;
  bounty_title: string | null;
};

export type NominateInput = {
  story: string;
  kind: NominationKind;
  whyFjorr: string;
  setting: string;
  proofOrPremise: string;
  proofUrl?: string;
  bountyId?: string | null;
};

export type NominateResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/** Active bounties for the nominate form (public read). */
export async function listActiveBounties(): Promise<BountyRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bounties')
    .select(
      'id, slug, title, brief, amount_cents, currency, status, hero_image_url'
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('listActiveBounties failed:', error.message);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    brief: String(row.brief || ''),
    amount_cents: Number(row.amount_cents) || 0,
    currency: String(row.currency || 'USD'),
    status: row.status as BountyRow['status'],
    hero_image_url: row.hero_image_url ? String(row.hero_image_url) : null,
  }));
}

/** Single active bounty by slug (public brief page). */
export async function getActiveBountyBySlug(
  slug: string
): Promise<BountyRow | null> {
  const cleaned = slug.trim().toLowerCase();
  if (!cleaned) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bounties')
    .select(
      'id, slug, title, brief, amount_cents, currency, status, hero_image_url'
    )
    .eq('slug', cleaned)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    console.error('getActiveBountyBySlug failed:', error.message);
    return null;
  }
  if (!data) return null;

  return {
    id: String(data.id),
    slug: String(data.slug),
    title: String(data.title),
    brief: String(data.brief || ''),
    amount_cents: Number(data.amount_cents) || 0,
    currency: String(data.currency || 'USD'),
    status: data.status as BountyRow['status'],
    hero_image_url: data.hero_image_url ? String(data.hero_image_url) : null,
  };
}

/** Own nominations, newest first. */
export async function getOwnNominations(): Promise<NominationRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('nominations')
    .select(
      `
      id,
      created_at,
      story_details,
      kind,
      why_fjorr,
      setting,
      proof_or_premise,
      proof_url,
      status,
      status_reason,
      bounty_id,
      bounty:bounty_id ( title )
    `
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getOwnNominations failed:', error.message);
    return [];
  }

  return (data || []).map((row: any) => {
    const bounty = Array.isArray(row.bounty) ? row.bounty[0] : row.bounty;
    return {
      id: String(row.id),
      created_at: String(row.created_at),
      story_details: String(row.story_details || ''),
      kind: row.kind as NominationKind,
      why_fjorr: row.why_fjorr ? String(row.why_fjorr) : null,
      setting: row.setting ? String(row.setting) : null,
      proof_or_premise: row.proof_or_premise
        ? String(row.proof_or_premise)
        : null,
      proof_url: row.proof_url ? String(row.proof_url) : null,
      status: (row.status || 'received') as NominationStatus,
      status_reason: row.status_reason ? String(row.status_reason) : null,
      bounty_id: row.bounty_id ? String(row.bounty_id) : null,
      bounty_title: bounty?.title ? String(bounty.title) : null,
    };
  });
}

/** Submit a nomination (members only). */
export async function submitNomination(
  input: NominateInput
): Promise<NominateResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'signInRequired' };
  }

  const story = input.story.trim();
  const whyFjorr = input.whyFjorr.trim();
  const setting = input.setting.trim();
  const proofOrPremise = input.proofOrPremise.trim();
  const proofUrl = (input.proofUrl || '').trim();
  const kind = input.kind;
  const bountyId = input.bountyId || null;

  if (!story) return { ok: false, error: 'storyRequired' };
  if (!whyFjorr) return { ok: false, error: 'whyRequired' };
  if (!setting) return { ok: false, error: 'settingRequired' };
  if (!proofOrPremise) {
    return {
      ok: false,
      error: kind === 'true' ? 'proofRequired' : 'premiseRequired',
    };
  }
  if (!['true', 'fiction'].includes(kind)) {
    return { ok: false, error: 'kindRequired' };
  }

  if (proofUrl) {
    try {
      const u = new URL(proofUrl);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') {
        return { ok: false, error: 'proofUrlInvalid' };
      }
    } catch {
      return { ok: false, error: 'proofUrlInvalid' };
    }
  }

  if (bountyId) {
    const { data: bounty } = await supabase
      .from('bounties')
      .select('id, status')
      .eq('id', bountyId)
      .maybeSingle();
    if (!bounty || bounty.status !== 'active') {
      return { ok: false, error: 'bountyInvalid' };
    }
  }

  const { data, error } = await supabase
    .from('nominations')
    .insert({
      user_id: user.id,
      contributor_email: (user.email || '').toLowerCase(),
      story_details: story,
      kind,
      why_fjorr: whyFjorr,
      setting,
      proof_or_premise: proofOrPremise,
      proof_url: proofUrl || null,
      bounty_id: bountyId,
      status: 'received',
    })
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('submitNomination failed:', error.message);
    return { ok: false, error: 'submitError' };
  }

  return { ok: true, id: String(data?.id) };
}
