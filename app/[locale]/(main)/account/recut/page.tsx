import { getLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';

/** Legacy path — Plus Machine lives at /account/plus. */
export default async function AccountRecutRedirectPage() {
  const locale = await getLocale();
  redirect({ href: '/account/plus', locale });
}
