import { getLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';

/** Privacy settings removed — via stays on for everyone. */
export default async function AccountPrivacyRedirectPage() {
  const locale = await getLocale();
  redirect({ href: '/account/voyages', locale });
}