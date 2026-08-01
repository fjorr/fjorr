import type { Metadata } from 'next';
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

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = safeInternalPath(params.next ?? null, '/bureaux');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const active = await isOwnBureauxActive(user.id);
    const path = nextPath.split('?')[0];
    const joining = path === '/bureaux' || path.startsWith('/bureaux/');
    if (!active && !joining) {
      redirect('/bureaux');
    }
    redirect(nextPath);
  }

  return <SignInPageClient nextPath={nextPath} />;
}
