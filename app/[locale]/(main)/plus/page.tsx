import { redirect } from '@/i18n/navigation';
import { getLocale } from 'next-intl/server';

/** Plus Machine doctrine lives in The Manual. */
export default async function PlusPage() {
  const locale = await getLocale();
  redirect({ href: '/manual/plus', locale });
}
