import { notFound, redirect } from 'next/navigation';
import { getPublicProfileByAccountNumber } from '@/lib/profile-actions';
import { profilePath } from '@/lib/profile';

type Props = {
  params: Promise<{ bureauxNumber: string }>;
};

function parseBureauxNumber(raw: string): number | null {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1 || String(n) !== raw) return null;
  return n;
}

/** Short form: /42 → /42/{slug} */
export default async function BureauxNumberRedirectPage({ params }: Props) {
  const { bureauxNumber: raw } = await params;
  const accountNumber = parseBureauxNumber(raw);
  if (accountNumber == null) notFound();

  const result = await getPublicProfileByAccountNumber(accountNumber);
  if (!result || !result.profile.is_public) {
    notFound();
  }

  redirect(profilePath(result.bureauxNumber, result.profile.slug));
}
