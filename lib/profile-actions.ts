'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getOwnBureauxMembership } from '@/lib/bureaux';
import {
  normalizeScoutProfile,
  normalizeSlug,
  profilePath,
  type ScoutProfile,
} from '@/lib/profile';
import { appUrl } from '@/lib/site';

export type PublicProfileLookup = {
  profile: ScoutProfile;
  /** Permanent public path number (Bureaux No.). */
  bureauxNumber: number;
};

async function revalidatePublicProfilePath(userId: string, slug: string) {
  const membership = await getOwnBureauxMembership(userId);
  const n = membership?.bureaux_number;
  if (n != null) revalidatePath(profilePath(n, slug));
}

export type ProfileSaveResult =
  | { ok: true; profile: ScoutProfile }
  | { ok: false; error: string };

/** Load or create the signed-in member profile. */
/** Ensure profile row exists. Pass userId to skip a second auth.getUser(). */
export async function ensureOwnProfile(
  userId?: string
): Promise<ScoutProfile | null> {
  const supabase = await createClient();
  let uid = userId;
  if (!uid) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    uid = user.id;
  }

  const { data, error } = await supabase.rpc('ensure_own_profile');
  if (error) {
    console.error('ensure_own_profile failed:', error.message);
    // Fallback: direct select (row may already exist)
    const { data: row } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();
    return row ? normalizeScoutProfile(row as ScoutProfile) : null;
  }
  return data ? normalizeScoutProfile(data as ScoutProfile) : null;
}

export async function saveOwnDisplayName(input: {
  displayName: string;
}): Promise<ProfileSaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not signed in.' };

  const display_name = input.displayName.trim().slice(0, 80);
  if (!display_name) {
    return { ok: false, error: 'Display name is required.' };
  }

  await ensureOwnProfile();

  const { data, error } = await supabase
    .from('profiles')
    .update({ display_name })
    .eq('id', user.id)
    .select('*')
    .single();

  if (error) {
    console.error('saveOwnDisplayName failed:', error.message);
    return { ok: false, error: error.message };
  }

  await supabase.auth.updateUser({
    data: { display_name },
  });

  const profile = normalizeScoutProfile(data as ScoutProfile);
  revalidatePath('/account');
  revalidatePath('/account/bureaux');
  revalidatePath('/account/voyages');
  await revalidatePublicProfilePath(user.id, profile.slug);
  return { ok: true, profile };
}

/** @deprecated Prefer saveOwnDisplayName — slug editing is not productized. */
export async function saveOwnProfile(input: {
  displayName: string;
  slug: string;
}): Promise<ProfileSaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not signed in.' };

  const display_name = input.displayName.trim().slice(0, 80);
  if (!display_name) {
    return { ok: false, error: 'Display name is required.' };
  }

  const slug = normalizeSlug(input.slug);
  if (!slug) {
    return {
      ok: false,
      error: 'Slug must be 3–32 characters: lowercase letters, numbers, hyphens.',
    };
  }

  await ensureOwnProfile();

  const { data, error } = await supabase
    .from('profiles')
    .update({
      display_name,
      slug,
    })
    .eq('id', user.id)
    .select('*')
    .single();

  if (error) {
    console.error('saveOwnProfile failed:', error.message);
    return { ok: false, error: error.message };
  }

  await supabase.auth.updateUser({
    data: { display_name },
  });

  const profile = normalizeScoutProfile(data as ScoutProfile);
  revalidatePath('/account');
  revalidatePath('/account/bureaux');
  revalidatePath('/account/voyages');
  await revalidatePublicProfilePath(user.id, profile.slug);
  return { ok: true, profile };
}

export type UpdateEmailResult =
  | { ok: true }
  | {
      ok: false;
      error:
        | 'signInRequired'
        | 'emailRequired'
        | 'emailInvalid'
        | 'emailSame'
        | 'updateFailed';
    };

/** Start email change — Supabase sends a confirm link to the new address. */
export async function updateOwnEmail(
  email: string
): Promise<UpdateEmailResult> {
  const next = (email || '').trim().toLowerCase();
  if (!next) return { ok: false, error: 'emailRequired' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next)) {
    return { ok: false, error: 'emailInvalid' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'signInRequired' };

  if ((user.email || '').trim().toLowerCase() === next) {
    return { ok: false, error: 'emailSame' };
  }

  const { error } = await supabase.auth.updateUser(
    { email: next },
    {
      emailRedirectTo: appUrl('/auth/confirm?next=/account/bureaux'),
    }
  );

  if (error) {
    console.error('updateOwnEmail failed:', error.message);
    return { ok: false, error: 'updateFailed' };
  }

  revalidatePath('/account/bureaux');
  return { ok: true };
}

export type DeleteAccountResult =
  | { ok: true }
  | { ok: false; error: string };

/** Permanently delete the signed-in auth user (cascades profile when configured). */
export async function deleteOwnAccount(): Promise<DeleteAccountResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not signed in.' };

  try {
    const admin = createServiceClient();
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      console.error('deleteOwnAccount failed:', error.message);
      return { ok: false, error: error.message };
    }
  } catch (err: unknown) {
    console.error('deleteOwnAccount failed:', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not delete account.',
    };
  }

  await supabase.auth.signOut();
  revalidatePath('/account');
  return { ok: true };
}

/**
 * Public profile lookup by path number.
 * Canonical key is Bureaux No.; legacy profiles.member_number still resolves
 * and should permanent-redirect to the Bureaux path.
 */
export async function getPublicProfileByAccountNumber(
  accountNumber: number
): Promise<PublicProfileLookup | null> {
  if (!Number.isFinite(accountNumber) || accountNumber < 1) return null;

  const supabase = await createClient();
  const db = createServiceClient();

  let userId: string | null = null;
  let bureauxNumber: number | null = null;

  const { data: byBureaux, error: bureauxError } = await db
    .from('bureaux_memberships')
    .select('user_id, bureaux_number')
    .eq('bureaux_number', accountNumber)
    .maybeSingle();

  if (bureauxError) {
    console.error(
      'getPublicProfileByAccountNumber bureaux lookup failed:',
      bureauxError.message
    );
    return null;
  }

  if (byBureaux?.user_id) {
    userId = String(byBureaux.user_id);
    const n = Number(byBureaux.bureaux_number);
    bureauxNumber = Number.isFinite(n) && n >= 1 ? n : null;
  } else {
    // Legacy path used profiles.member_number.
    const { data: byMember, error: memberError } = await supabase
      .from('profiles')
      .select('id')
      .eq('member_number', accountNumber)
      .maybeSingle();

    if (memberError) {
      console.error(
        'getPublicProfileByAccountNumber member lookup failed:',
        memberError.message
      );
      return null;
    }
    if (!byMember?.id) return null;

    userId = String(byMember.id);
    const { data: membership } = await db
      .from('bureaux_memberships')
      .select('bureaux_number')
      .eq('user_id', userId)
      .maybeSingle();
    const n = Number(membership?.bureaux_number);
    bureauxNumber = Number.isFinite(n) && n >= 1 ? n : null;
  }

  if (!userId || bureauxNumber == null) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error(
      'getPublicProfileByAccountNumber profile failed:',
      error.message
    );
    return null;
  }
  if (!data) return null;

  return {
    profile: normalizeScoutProfile(data as ScoutProfile),
    bureauxNumber,
  };
}

/** @deprecated Prefer getPublicProfileByAccountNumber (Bureaux No.). */
export async function getPublicProfileByMemberNumber(
  memberNumber: number
): Promise<ScoutProfile | null> {
  const result = await getPublicProfileByAccountNumber(memberNumber);
  return result?.profile ?? null;
}
