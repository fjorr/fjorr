import { Metadata } from 'next';
import PrivacyClient from './PrivacyClient'; // 🛠️ Points directly to your layout code file Above

// 🎯 SERVER-SIDE METADATA ENGINE FOR PRIVACY POLICY
export const metadata: Metadata = {
  title: 'Privacy Policy', // Automatically transforms to "Privacy Policy | Fjorr" via layout.tsx
  description: 'Read our commitment to your absolute digital privacy.',
  openGraph: {
    title: 'Privacy Policy | Fjorr',
    description: 'Read our commitment to your absolute digital privacy.',
    url: 'https://fjorr.com/privacy',
    type: 'website',
  },
  twitter: {
    title: 'Privacy Policy | Fjorr',
    description: 'Read our commitment to your absolute digital privacy.',
  }
};

export default function PrivacyPage() {
  return <PrivacyClient />;
}