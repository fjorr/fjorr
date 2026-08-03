import { createClient } from '@/lib/supabase/client';
import { isBureauxActive } from '@/lib/bureaux-status';

export type OwnBureauxNav = {
  active: boolean;
  bureauxNumber: number | null;
  displayName: string | null;
};

/** Browser check — own row is readable via RLS. */
export async function fetchOwnBureauxNav(): Promise<OwnBureauxNav> {
  const empty: OwnBureauxNav = {
    active: false,
    bureauxNumber: null,
    displayName: null,
  };
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return empty;

  const [{ data, error }, { data: profile }] = await Promise.all([
    supabase
      .from('bureaux_memberships')
      .select('status, current_period_end, comp_lifetime, bureaux_number')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle(),
  ]);

  if (error || !data) return empty;

  const active = isBureauxActive(
    data.status,
    data.current_period_end,
    data.comp_lifetime
  );
  if (!active) return empty;

  const n = Number(data.bureaux_number);
  const displayName = String(profile?.display_name || '').trim() || null;
  return {
    active: true,
    bureauxNumber: Number.isFinite(n) && n >= 1 ? n : null,
    displayName,
  };
}

/** Browser check — own row is readable via RLS. */
export async function fetchOwnBureauxActive(): Promise<boolean> {
  const nav = await fetchOwnBureauxNav();
  return nav.active;
}
