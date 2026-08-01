import { createClient } from '@/lib/supabase/client';
import { isBureauxActive } from '@/lib/bureaux-status';

/** Browser check — own row is readable via RLS. */
export async function fetchOwnBureauxActive(): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('bureaux_memberships')
    .select('status, current_period_end')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !data) return false;
  return isBureauxActive(data.status, data.current_period_end);
}
