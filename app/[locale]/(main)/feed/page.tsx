import { getLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';

/** Legacy human RSS page — engagement lives on /subscribe. */
export default async function FeedPage() {
  const locale = await getLocale();
  redirect({ href: '/subscribe', locale });
}
