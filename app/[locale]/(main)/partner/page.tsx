import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import PartnerClient from './PartnerClient'; // 🛠️ Points directly to your layout code file Above

// 🎯 SERVER-SIDE METADATA ENGINE FOR PARTNERSHIPS
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');
  const title = t('partnerTitle');
  const description = t('partnerDescription');
  return {
    title, // Automatically transforms to "Partner | Fjorr" via layout.tsx
    description,
    alternates: { canonical: '/partner' },
    openGraph: {
      title: `${title} with Fjorr`,
      description,
      url: 'https://www.fjorr.com/partner',
      type: 'website',
    },
    twitter: {
      title: `${title} with Fjorr.`,
      description,
    },
  };
}

export default function PartnerPage() {
  return <PartnerClient />;
}