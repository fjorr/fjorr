import { redirect } from '@/i18n/navigation';
import { getLocale } from 'next-intl/server';

/** Terms live in The Manual — keep /terms for bookmarks and footer. */
export default async function TermsPage() {
  const locale = await getLocale();
  redirect({ href: '/manual/terms', locale });
}
