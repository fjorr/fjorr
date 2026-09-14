import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import ContactClient from './ContactClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Contact');
  const title = t('title');
  const description = t('description');
  return {
    title,
    description,
    alternates: { canonical: '/contact' },
    openGraph: {
      title: `${title} | Fjorr`,
      description,
      url: 'https://www.fjorr.com/contact',
      type: 'website',
    },
  };
}

export default async function ContactPage() {
  return <ContactClient />;
}
