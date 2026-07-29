import { notFound, redirect } from 'next/navigation';
import { getPublicProfileByMemberNumber } from '@/lib/profile-actions';
import { profilePath } from '@/lib/profile';

type Props = {
  params: Promise<{ memberNumber: string }>;
};

/** Short form: /account/42 → /account/42/{slug} */
export default async function AccountMemberRedirectPage({ params }: Props) {
  const { memberNumber: raw } = await params;
  const memberNumber = Number.parseInt(raw, 10);
  if (!Number.isFinite(memberNumber) || String(memberNumber) !== raw) {
    notFound();
  }

  const profile = await getPublicProfileByMemberNumber(memberNumber);
  if (!profile || !profile.is_public) {
    notFound();
  }

  redirect(profilePath(profile.member_number, profile.slug));
}
