import 'server-only';

import { createClient } from '@/lib/supabase/server';
import {
  getOwnBureauxMembership,
  isBureauxMembershipActive,
} from '@/lib/bureaux';
import type { ManualAudience } from '@/lib/help/content';

export type ManualViewer = {
  audience: ManualAudience;
  bureauxNumber: number | null;
};

/** Guest vs active Bureaux member — for Manual state lines. */
export async function getManualViewer(): Promise<ManualViewer> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { audience: 'guest', bureauxNumber: null };
  }

  const membership = await getOwnBureauxMembership(user.id);
  if (!isBureauxMembershipActive(membership)) {
    return { audience: 'guest', bureauxNumber: null };
  }

  const n = membership?.bureaux_number;
  return {
    audience: 'member',
    bureauxNumber: n != null && n >= 1 ? n : null,
  };
}
