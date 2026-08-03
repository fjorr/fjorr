/**
 * Browser helper — signed-in identity for share/lineage links.
 */

import { createClient } from '@/lib/supabase/client';

export type OwnShareIdentity = {
  memberNumber: number;
};

export async function fetchOwnShareIdentity(): Promise<OwnShareIdentity | null> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from('profiles')
      .select('member_number')
      .eq('id', user.id)
      .maybeSingle();

    const n = Number(data?.member_number);
    if (!Number.isFinite(n) || n < 1) return null;

    return { memberNumber: n };
  } catch {
    return null;
  }
}

/** Member # to put in ?via= — null when signed out. */
export function shareViaMemberNumber(
  identity: OwnShareIdentity | null | undefined
): number | null {
  return identity?.memberNumber ?? null;
}

/** @deprecated use fetchOwnShareIdentity */
export async function fetchOwnMemberNumber(): Promise<number | null> {
  const identity = await fetchOwnShareIdentity();
  return shareViaMemberNumber(identity);
}
