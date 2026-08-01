import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isOwnBureauxActive } from '@/lib/bureaux';
import { ensureOwnProfile } from '@/lib/profile-actions';
import type { ScoutProfile } from '@/lib/profile';
import type { User } from '@supabase/supabase-js';

/**
 * Account = paid Bureaux member.
 * Guests → sign-in (join flow uses next=/bureaux).
 * Signed-in but unpaid → /bureaux.
 */
export async function requireOwnAccount(
  nextPath = '/account/voyages'
): Promise<{ user: User; profile: ScoutProfile }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const signInNext =
      nextPath.startsWith('/bureaux') || nextPath.startsWith('/account')
        ? nextPath.startsWith('/bureaux')
          ? nextPath
          : '/bureaux'
        : '/bureaux';
    redirect(`/signin?next=${encodeURIComponent(signInNext)}`);
  }

  const profile = await ensureOwnProfile(user.id);
  if (!profile) {
    redirect(`/signin?next=${encodeURIComponent('/bureaux')}`);
  }

  if (!(await isOwnBureauxActive(user.id))) {
    redirect('/bureaux');
  }

  return { user, profile };
}
