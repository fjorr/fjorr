/**
 * Admin access — fail closed.
 * Phase 0: ADMIN_EMAILS env allowlist (comma-separated).
 * Later: profiles.role when you outgrow env.
 */

import { redirect, notFound } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

export function adminEmailAllowlist(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const list = adminEmailAllowlist();
  if (list.length === 0) return false;
  return list.includes(email.trim().toLowerCase());
}

export async function requireAdmin(): Promise<{ user: User; email: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect('/signin?next=/admin');
  }

  if (!isAdminEmail(user.email)) {
    notFound();
  }

  return { user, email: user.email };
}
