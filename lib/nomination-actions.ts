/**
 * Intelligence — nominations + bounties (server).
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  bureauxNominationLimits,
  isOwnBureauxActive,
} from '@/lib/bureaux';

export type NominationKind = 'true' | 'fiction';

/** Bounty hunt type — `both` accepts either nomination kind. */
export type BountyKind = NominationKind | 'both';

export type NominationStatus =
  | 'received'
  | 'in_review'
  | 'shortlisted'
  | 'passed'
  | 'in_production'
  | 'released';

export type BountyStatus = 'open' | 'claimed' | 'in_production' | 'closed';

export type BountyRow = {
  id: string;
  slug: string;
  title: string;
  brief: string;
  reward_amount: number;
  currency: string;
  kind: BountyKind;
  status: BountyStatus;
  poster_image_url: string | null;
  featured: boolean;
  sort_order: number | null;
  deadline: string | null;
  claimed_at: string | null;
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

const BOUNTY_SELECT =
  'id, slug, title, brief, reward_amount, currency, kind, status, poster_image_url, featured, sort_order, deadline, claimed_at';

function mapBounty(row: any): BountyRow {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    brief: String(row.brief || ''),
    reward_amount: Number(row.reward_amount) || 0,
    currency: String(row.currency || 'USD'),
    kind: (row.kind || 'true') as BountyKind,
    status: row.status as BountyStatus,
    poster_image_url: row.poster_image_url ? String(row.poster_image_url) : null,
    featured: Boolean(row.featured),
    sort_order:
      row.sort_order == null || Number.isNaN(Number(row.sort_order))
        ? null
        : Number(row.sort_order),
    deadline: row.deadline ? String(row.deadline) : null,
    claimed_at: row.claimed_at ? String(row.claimed_at) : null,
  };
}

/** Open bounties for the public grid / nominate form. */
export async function listActiveBounties(): Promise<BountyRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bounties')
    .select(BOUNTY_SELECT)
    .eq('status', 'open')
    .order('featured', { ascending: false })
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('listActiveBounties failed:', error.message);
    return [];
  }

  return (data || []).map(mapBounty);
}

/** Awarded bounties (claimed / in production) for the public archive. */
export async function listArchivedBounties(): Promise<BountyRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bounties')
    .select(BOUNTY_SELECT)
    .in('status', ['claimed', 'in_production'])
    .order('claimed_at', { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('listArchivedBounties failed:', error.message);
    return [];
  }

  return (data || []).map(mapBounty);
}

/** Public brief — open or awarded (not closed). */
export async function getPublicBountyBySlug(
  slug: string
): Promise<BountyRow | null> {
  const cleaned = slug.trim().toLowerCase();
  if (!cleaned) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bounties')
    .select(BOUNTY_SELECT)
    .eq('slug', cleaned)
    .in('status', ['open', 'claimed', 'in_production'])
    .maybeSingle();

  if (error) {
    console.error('getPublicBountyBySlug failed:', error.message);
    return null;
  }
  if (!data) return null;

  return mapBounty(data);
}

/** @deprecated Prefer getPublicBountyBySlug — kept for open-only callers. */
export async function getActiveBountyBySlug(
  slug: string
): Promise<BountyRow | null> {
  const bounty = await getPublicBountyBySlug(slug);
  if (!bounty || bounty.status !== 'open') return null;
  return bounty;
}

const OWN_NOMINATION_LIMIT = 100;

/** Own nominations, newest first. Pass userId to skip a second auth.getUser(). */
export async function getOwnNominations(
  userId?: string
): Promise<NominationRow[]> {
  const supabase = await createClient();
  let uid = userId;
  if (!uid) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];
    uid = user.id;
  }

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
    .eq('user_id', uid)
    .order('created_at', { ascending: false })
    .limit(OWN_NOMINATION_LIMIT);

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

const ACTIVE_NOMINATION_STATUSES = [
  'received',
  'in_review',
  'shortlisted',
  'in_production',
] as const;

/** Count of own nominations still in flight (for account nav meta). */
export async function countOwnActiveNominations(
  userId?: string
): Promise<number> {
  const supabase = await createClient();
  let uid = userId;
  if (!uid) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return 0;
    uid = user.id;
  }

  const { count, error } = await supabase
    .from('nominations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', uid)
    .in('status', [...ACTIVE_NOMINATION_STATUSES]);

  if (error) {
    console.error('countOwnActiveNominations failed:', error.message);
    return 0;
  }
  return count || 0;
}

/** Soft spam guard window for new pitches. */
const NOMINATION_RATE_LIMIT_HOURS = 24;

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

  if (!(await isOwnBureauxActive(user.id))) {
    return { ok: false, error: 'bureauxRequired' };
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
      .select('id, status, kind')
      .eq('id', bountyId)
      .maybeSingle();
    if (!bounty || bounty.status !== 'open') {
      return { ok: false, error: 'bountyInvalid' };
    }
    // Bounty kind may be true, fiction, or both.
    if (bounty.kind !== 'both' && bounty.kind !== kind) {
      return { ok: false, error: 'kindRequired' };
    }
  }

  const since = new Date(
    Date.now() - NOMINATION_RATE_LIMIT_HOURS * 60 * 60 * 1000
  ).toISOString();

  const [{ count: recentCount, error: recentError }, { count: openCount, error: openError }] =
    await Promise.all([
      supabase
        .from('nominations')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', since),
      supabase
        .from('nominations')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', [...ACTIVE_NOMINATION_STATUSES]),
    ]);

  if (recentError) {
    console.error('submitNomination rate check failed:', recentError.message);
    return { ok: false, error: 'submitError' };
  }
  if (openError) {
    console.error('submitNomination open check failed:', openError.message);
    return { ok: false, error: 'submitError' };
  }

  const limits = bureauxNominationLimits();

  if ((recentCount || 0) >= limits.maxPerDay) {
    return { ok: false, error: 'rateLimited' };
  }
  if ((openCount || 0) >= limits.maxOpen) {
    return { ok: false, error: 'openCap' };
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

  revalidatePath('/account/nominations');
  revalidatePath('/admin');

  return { ok: true, id: String(data?.id) };
}
