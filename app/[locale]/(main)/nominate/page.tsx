import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import NominateClient from './NominateClient'; // 🛠️ Points straight to your form code file

// 🎯 SERVER-SIDE METADATA ENGINE FOR NOMINATIONS
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');
  const title = t('nominateTitle');
  const description = t('nominateDescription');
  return {
    title, // Becomes "Nominate | Fjorr" automatically via layout.tsx
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

export default function NominatePage() {
  return <NominateClient />;
}