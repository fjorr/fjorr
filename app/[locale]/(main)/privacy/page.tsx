import { redirect } from '@/i18n/navigation';
import { getLocale } from 'next-intl/server';

/** Privacy lives in The Manual — keep /privacy for bookmarks and footer. */
export default async function PrivacyPage() {
  const locale = await getLocale();
  redirect({ href: '/manual/privacy', locale });
}
