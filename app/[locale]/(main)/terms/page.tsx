import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import TermsClient from './TermsClient'; // 🛠️ Points directly to your layout code file Above

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');
  const title = t('termsTitle');
  const description = t('termsDescription');
  return {
    title,
    description,
    alternates: { canonical: '/terms' },
    openGraph: {
      title: `${title} | Fjorr`,
      description,
      url: 'https://www.fjorr.com/terms',
      type: 'website',
    },
    twitter: {
      title: `${title} | Fjorr`,
      description,
    },
  };
}

export default function TermsPage() {
  return <TermsClient />;
}