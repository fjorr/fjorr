import { getLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';

/** Account home is Voyages — no overview dashboard. */
export default async function AccountPage() {
  const locale = await getLocale();
  redirect({ href: '/account/voyages', locale });
}
