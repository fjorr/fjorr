import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import NominateClient from './NominateClient';
import { createClient } from '@/lib/supabase/server';
import { isOwnBureauxActive } from '@/lib/bureaux';
import { listActiveBounties } from '@/lib/nomination-actions';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');
  const title = t('nominateTitle');
  const description = t('nominateDescription');
  return {
    title,
    description,
    alternates: { canonical: '/nominate' },
    openGraph: {
      title: `${title} | Fjorr`,
      description,
      url: 'https://www.fjorr.com/nominate',
      type: 'website',
    },
    twitter: {
      title: `${title} | Fjorr`,
      description,
    },
  };
}

export default async function NominatePage({
  searchParams,
}: {
  searchParams: Promise<{ bounty?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const bureauxActive = user ? await isOwnBureauxActive(user.id) : false;
  const bounties = await listActiveBounties();

  const bountyParam = (params.bounty || '').trim().toLowerCase();
  const initialBountyId =
    bounties.find((b) => b.slug === bountyParam || b.id === bountyParam)?.id ||
    '';

  return (
    <NominateClient
      bureauxActive={bureauxActive}
      bounties={bounties}
      initialBountyId={initialBountyId}
    />
  );
}
