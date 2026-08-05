import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import LegalDoc, { type LegalSection } from '@/components/LegalDoc';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');
  return {
    title: t('termsTitle'),
    description: t('termsDescription'),
    alternates: { canonical: '/terms' },
  };
}

export default async function TermsPage() {
  const t = await getTranslations('Terms');
  const tFooter = await getTranslations('Footer');

  const title = `${t('titleLine1')} ${t('titleLine2')}`;
  const sections: LegalSection[] = [
    { title: t('s1Title'), paragraphs: [t('s1Body')] },
    { title: t('s2Title'), paragraphs: [t('s2Body')] },
    { title: t('s3Title'), paragraphs: [t('s3Body')] },
    { title: t('s4Title'), paragraphs: [t('s4Body')] },
    { title: t('s5Title'), paragraphs: [t('s5Body')] },
    { title: t('s6Title'), paragraphs: [t('s6Body')] },
    { title: t('s7Title'), paragraphs: [t('s7Body')] },
    { title: t('s8Title'), paragraphs: [t('s8Body')] },
    { title: t('s9Title'), paragraphs: [t('s9Body')] },
    { title: t('s10Title'), paragraphs: [t('s10Body')] },
  ];

  return (
    <LegalDoc
      title={title}
      lastUpdatedLabel={t('lastUpdated')}
      date={t('date')}
      sections={sections}
      footerLinks={[{ href: '/privacy', label: tFooter('privacy') }]}
    />
  );
}
