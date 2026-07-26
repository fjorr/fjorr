import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import SignInPageClient from './SignInPageClient';
import { createClient } from '@/lib/supabase/server';
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
  const nextPath = safeInternalPath(params.next ?? null, '/account');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(nextPath);
  }

  return <SignInPageClient nextPath={nextPath} />;
}
