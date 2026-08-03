import { notFound, permanentRedirect } from 'next/navigation';
import { getPublicProfileByAccountNumber } from '@/lib/profile-actions';
import { profilePath } from '@/lib/profile';

type Props = {
  params: Promise<{ memberNumber: string; slug: string }>;
};

/** Legacy /account/{n}/{slug} → /{bureauxNumber}/{slug} */
export default async function LegacyAccountProfileRedirect({ params }: Props) {
  const { memberNumber: raw } = await params;
  const accountNumber = Number.parseInt(raw, 10);
  if (!Number.isFinite(accountNumber) || String(accountNumber) !== raw) {
    notFound();
  }

  const result = await getPublicProfileByAccountNumber(accountNumber);
  if (!result || !result.profile.is_public) {
    notFound();
  }

  permanentRedirect(profilePath(result.bureauxNumber, result.profile.slug));
}
