'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin-auth';
import { grantBureauxLifetime } from '@/lib/bureaux';
import { createServiceClient } from '@/lib/supabase/service';

export type AdminCompResult =
  | { ok: true; bureauxNumber: number | null; email: string }
  | { ok: false; error: 'emailInvalid' | 'grantFailed'; detail?: string };

/** Control: grant lifetime complimentary Bureaux membership. */
export async function adminGrantBureauxLifetime(
  emailRaw: string
): Promise<AdminCompResult> {
  await requireAdmin();
  const email = emailRaw.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'emailInvalid' };
  }

  try {
    const result = await grantBureauxLifetime(email);
    revalidatePath('/admin/bureaux');
    revalidatePath('/admin');
    return {
      ok: true,
      bureauxNumber: result.bureauxNumber,
      email,
    };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error('adminGrantBureauxLifetime:', detail);
    return { ok: false, error: 'grantFailed', detail };
  }
}

export type AdminCompRow = {
  user_id: string;
  email: string | null;
  bureaux_number: number | null;
  updated_at: string;
};

/** Recent lifetime comps for the Control list. */
export async function listAdminLifetimeComps(): Promise<AdminCompRow[]> {
  await requireAdmin();
  const db = createServiceClient();
  const { data, error } = await db
    .from('bureaux_memberships')
    .select('user_id, bureaux_number, updated_at')
    .eq('comp_lifetime', true)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(40);

  if (error || !data?.length) return [];

  const rows: AdminCompRow[] = [];
  for (const row of data) {
    const { data: userData } = await db.auth.admin.getUserById(row.user_id);
    rows.push({
      user_id: row.user_id,
      email: userData.user?.email || null,
      bureaux_number: row.bureaux_number,
      updated_at: row.updated_at,
    });
  }
  return rows;
}
