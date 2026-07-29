import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ensureOwnProfile } from '@/lib/profile-actions';
import type { ScoutProfile } from '@/lib/profile';
import type { User } from '@supabase/supabase-js';

/** Own-account gate. Redirects guests to sign-in with a return path. */
export async function requireOwnAccount(
  nextPath = '/account'
): Promise<{ user: User; profile: ScoutProfile }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/signin?next=${encodeURIComponent(nextPath)}`);
  }

  const profile = await ensureOwnProfile();
  if (!profile) {
    redirect(`/signin?next=${encodeURIComponent(nextPath)}`);
  }

  return { user, profile };
}
