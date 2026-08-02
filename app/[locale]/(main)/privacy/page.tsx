import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import PrivacyClient from './PrivacyClient'; // 🛠️ Points directly to your layout code file Above

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');
  const title = t('privacyTitle');
  const description = t('privacyDescription');
  return {
    title,
    description,
    alternates: { canonical: '/privacy' },
    openGraph: {
      title: `${title} | Fjorr`,
      description,
      url: 'https://www.fjorr.com/privacy',
      type: 'website',
    },
    twitter: {
      title: `${title} | Fjorr`,
      description,
    },
  };
}

export default function PrivacyPage() {
  return <PrivacyClient />;
}