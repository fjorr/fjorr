import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { isOwnBureauxActive } from '@/lib/bureaux';
import {
  listActiveBounties,
  listArchivedBounties,
} from '@/lib/nomination-actions';
import BountiesClient from './BountiesClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');
  const title = t('bountiesTitle');
  const description = t('bountiesDescription');
  return {
    title,
    description,
    alternates: { canonical: '/bounties' },
    openGraph: {
      title: `${title} | Fjorr`,
      description,
      url: 'https://www.fjorr.com/bounties',
      type: 'website',
    },
    twitter: {
      title: `${title} | Fjorr`,
      description,
    },
  };
}

export default async function BountiesPage() {
  const [bounties, archivedBounties, supabase] = await Promise.all([
    listActiveBounties(),
    listArchivedBounties(),
    createClient(),
  ]);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const bureauxActive = user ? await isOwnBureauxActive(user.id) : false;

  return (
    <BountiesClient
      bounties={bounties}
      archivedBounties={archivedBounties}
      bureauxActive={bureauxActive}
    />
  );
}
