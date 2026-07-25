import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AccountClient from '@/components/AccountClient';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Account',
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin?next=/account');
  }

  const displayName =
    (typeof user.user_metadata?.display_name === 'string'
      ? user.user_metadata.display_name
      : '') || '';

  return (
    <div className="w-full min-h-[70vh] bg-[#1F1F1F] flex flex-col items-center justify-center px-6 py-24">
      <AccountClient email={user.email || ''} initialName={displayName} />
    </div>
  );
}
