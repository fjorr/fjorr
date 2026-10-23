import { getLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';

/** One nominate form. This path only forwards. */
export default async function SlateProposeRedirect() {
  const locale = await getLocale();
  redirect({ href: '/nominate', locale });
}
