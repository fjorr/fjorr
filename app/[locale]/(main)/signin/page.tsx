import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import SignInPageClient from './SignInPageClient';
import { createClient } from '@/lib/supabase/server';
import { isOwnBureauxActive } from '@/lib/bureaux';
import { safeInternalPath } from '@/lib/site-gate';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');
  return {
    title: t('signInTitle'),
    robots: { index: false, follow: false },
  };
}

function hasSupabaseAuthCookie(
  cookieStore: Awaited<ReturnType<typeof cookies>>
) {
  return cookieStore
    .getAll()
    .some(
      (c) =>
        c.name.startsWith('sb-') &&
        (c.name.includes('auth-token') || c.name.endsWith('-auth-token'))
    );
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = safeInternalPath(params.next ?? null, '/bureaux');

  // Guests: skip Supabase round-trip (same short-circuit as middleware).
  const cookieStore = await cookies();
  if (!hasSupabaseAuthCookie(cookieStore)) {
    return <SignInPageClient nextPath={nextPath} />;
  }

  const supabase = await createClient();
  // getClaims() is cheaper than getUser() for the redirect gate.
  const { data } = await supabase.auth.getClaims();
  const userId =
    typeof data?.claims?.sub === 'string' ? data.claims.sub : null;

  if (userId) {
    const active = await isOwnBureauxActive(userId);
    const path = nextPath.split('?')[0];
    const joining = path === '/bureaux' || path.startsWith('/bureaux/');
    if (!active && !joining) {
      redirect('/bureaux');
    }
    redirect(nextPath);
  }

  return <SignInPageClient nextPath={nextPath} />;
}
