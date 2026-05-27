import { Metadata } from 'next';
import TermsClient from './TermsClient'; // 🛠️ Points directly to your layout code file Above

// 🎯 SERVER-SIDE METADATA ENGINE FOR TERMS OF USE
export const metadata: Metadata = {
  title: 'Terms of Use', // Automatically transforms to "Terms of Use | Fjorr" via layout.tsx
  description: 'Read the conditions, rules, and rules of engagement we play by.',
  openGraph: {
    title: 'Terms of Use | Fjorr',
    description: 'Read the conditions, rules, and rules of engagement we play by.',
    url: 'https://fjorr.com/terms',
    type: 'website',
  },
  twitter: {
    title: 'Terms of Use | Fjorr',
    description: 'Read the conditions, rules, and rules of engagement we play by.',
  }
};

export default function TermsPage() {
  return <TermsClient />;
}