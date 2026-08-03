import { getLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';

/** Record folded into Bureaux. */
export default async function AccountProfileRedirectPage() {
  const locale = await getLocale();
  redirect({ href: '/account/bureaux', locale });
}
