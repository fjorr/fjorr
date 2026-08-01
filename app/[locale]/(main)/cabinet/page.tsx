import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { isOwnBureauxActive } from '@/lib/bureaux';
import CabinetClient from './CabinetClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');
  const title = t('cabinetTitle');
  const description = t('cabinetDescription');
  return {
    title,
    description,
    alternates: { canonical: '/cabinet' },
    openGraph: {
      title: `${title} | Fjorr`,
      description,
      url: 'https://www.fjorr.com/cabinet',
      type: 'website',
    },
    twitter: {
      title: `${title} | Fjorr`,
      description,
    },
  };
}

export default async function CabinetPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const bureauxActive = user ? await isOwnBureauxActive(user.id) : false;

  return (
    <CabinetClient
      bureauxActive={bureauxActive}
      defaultEmail={user?.email || ''}
    />
  );
}
