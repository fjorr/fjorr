import { createClient } from '@/lib/supabase/client';
import { isBureauxActive } from '@/lib/bureaux-status';

export type OwnBureauxNav = {
  active: boolean;
  bureauxNumber: number | null;
};

/** Browser check — own row is readable via RLS. */
export async function fetchOwnBureauxNav(): Promise<OwnBureauxNav> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { active: false, bureauxNumber: null };

  const { data, error } = await supabase
    .from('bureaux_memberships')
    .select('status, current_period_end, comp_lifetime, bureaux_number')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !data) return { active: false, bureauxNumber: null };

  const active = isBureauxActive(
    data.status,
    data.current_period_end,
    data.comp_lifetime
  );
  if (!active) return { active: false, bureauxNumber: null };

  const n = Number(data.bureaux_number);
  return {
    active: true,
    bureauxNumber: Number.isFinite(n) && n >= 1 ? n : null,
  };
}

/** Browser check — own row is readable via RLS. */
export async function fetchOwnBureauxActive(): Promise<boolean> {
  const nav = await fetchOwnBureauxNav();
  return nav.active;
}
