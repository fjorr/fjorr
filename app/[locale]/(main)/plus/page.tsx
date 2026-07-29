import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import PlusClient from './PlusClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');
  return {
    title: t('plusTitle'),
    description: t('plusDescription'),
  };
}

export default function PlusPage() {
  return <PlusClient />;
}
