/**
 * Browser helper — signed-in identity for share/lineage links.
 */

import { createClient } from '@/lib/supabase/client';

export type OwnShareIdentity = {
  memberNumber: number;
  /** When false, omit ?via= from share links. */
  voyageLineageEnabled: boolean;
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
      .select('member_number, voyage_lineage_enabled')
      .eq('id', user.id)
      .maybeSingle();

    const n = Number(data?.member_number);
    if (!Number.isFinite(n) || n < 1) return null;

    return {
      memberNumber: n,
      voyageLineageEnabled: data?.voyage_lineage_enabled !== false,
    };
  } catch {
    return null;
  }
}

/** Member # to put in ?via= — null when signed out or opted out. */
export function shareViaMemberNumber(
  identity: OwnShareIdentity | null | undefined
): number | null {
  if (!identity?.voyageLineageEnabled) return null;
  return identity.memberNumber;
}

/** @deprecated use fetchOwnShareIdentity */
export async function fetchOwnMemberNumber(): Promise<number | null> {
  const identity = await fetchOwnShareIdentity();
  return shareViaMemberNumber(identity);
}
