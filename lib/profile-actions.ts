'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import {
  normalizeScoutProfile,
  normalizeSlug,
  profilePath,
  type ScoutProfile,
} from '@/lib/profile';

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

  // Ensure row exists before update
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

  // Keep auth metadata in sync for legacy readers
  await supabase.auth.updateUser({
    data: { display_name },
  });

  const profile = normalizeScoutProfile(data as ScoutProfile);
  revalidatePath('/account');
  revalidatePath('/account/profile');
  revalidatePath('/account/voyages');
  revalidatePath(profilePath(profile.member_number, profile.slug));
  return { ok: true, profile };
}

/** Public profile + voyage trail toggles. */
export async function saveOwnPrivacy(input: {
  isPublic: boolean;
  voyageLineageEnabled: boolean;
}): Promise<ProfileSaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not signed in.' };

  await ensureOwnProfile();

  const { data, error } = await supabase
    .from('profiles')
    .update({
      is_public: Boolean(input.isPublic),
      voyage_lineage_enabled: Boolean(input.voyageLineageEnabled),
    })
    .eq('id', user.id)
    .select('*')
    .single();

  if (error) {
    console.error('saveOwnPrivacy failed:', error.message);
    return { ok: false, error: error.message };
  }

  const profile = normalizeScoutProfile(data as ScoutProfile);
  revalidatePath('/account');
  revalidatePath('/account/privacy');
  revalidatePath('/account/profile');
  revalidatePath('/account/voyages');
  revalidatePath(profilePath(profile.member_number, profile.slug));
  return { ok: true, profile };
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

/** Public profile lookup by member number (RLS: public or owner). */
export async function getPublicProfileByMemberNumber(
  memberNumber: number
): Promise<ScoutProfile | null> {
  if (!Number.isFinite(memberNumber) || memberNumber < 1) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('member_number', memberNumber)
    .maybeSingle();

  if (error) {
    console.error('getPublicProfileByMemberNumber failed:', error.message);
    return null;
  }
  return data ? normalizeScoutProfile(data as ScoutProfile) : null;
}
