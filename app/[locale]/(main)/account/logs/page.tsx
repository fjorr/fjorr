import { getLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';

/** Legacy Film Logs path → Voyages. */
export default async function AccountLogsRedirectPage() {
  const locale = await getLocale();
  redirect({ href: '/account/voyages', locale });
}
