'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  normalizeSlug,
  profilePath,
  type ScoutProfile,
} from '@/lib/profile';

export type ProfileSaveResult =
  | { ok: true; profile: ScoutProfile }
  | { ok: false; error: string };

/** Load or create the signed-in member profile. */
export async function ensureOwnProfile(): Promise<ScoutProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.rpc('ensure_own_profile');
  if (error) {
    console.error('ensure_own_profile failed:', error.message);
    // Fallback: direct select (row may already exist)
    const { data: row } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    return (row as ScoutProfile | null) ?? null;
  }
  return data as ScoutProfile;
}

export async function saveOwnProfile(input: {
  displayName: string;
  slug: string;
  isPublic: boolean;
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
      is_public: input.isPublic,
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

  const profile = data as ScoutProfile;
  revalidatePath('/account');
  revalidatePath('/account/profile');
  revalidatePath(profilePath(profile.member_number, profile.slug));
  return { ok: true, profile };
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
  return (data as ScoutProfile | null) ?? null;
}
