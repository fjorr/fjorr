import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import AboutClient from './AboutClient'; // 🛠️ Points directly to your GSAP timeline code file Above

// 🎯 SERVER-SIDE METADATA ENGINE FOR THE ABOUT MANIFESTO
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');
  const title = t('aboutTitle');
  const description = t('aboutDescription');
  return {
    title, // Automatically transforms to "About | Fjorr" via layout.tsx
    description,
    alternates: { canonical: '/about' },
    openGraph: {
      title: `${title} | Fjorr`,
      description,
      url: 'https://www.fjorr.com/about',
      type: 'website',
    },
    twitter: {
      title: `${title} | Fjorr`,
      description,
    },
  };
}

export default function AboutPage() {
  return <AboutClient />;
}