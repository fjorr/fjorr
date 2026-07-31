import { redirect } from '@/i18n/navigation';
import { getLocale } from 'next-intl/server';

/** Account Bureaux folded into the public /bureaux page. */
export default async function AccountBureauxRedirect({
  searchParams,
}: {
  searchParams: Promise<{ joined?: string }>;
}) {
  const locale = await getLocale();
  const { joined } = await searchParams;
  const qs = joined === '1' ? '?joined=1' : '';
  redirect({ href: `/bureaux${qs}`, locale });
}
