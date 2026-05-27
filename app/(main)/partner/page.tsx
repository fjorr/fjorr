import { Metadata } from 'next';
import PartnerClient from './PartnerClient'; // 🛠️ Points directly to your layout code file Above

// 🎯 SERVER-SIDE METADATA ENGINE FOR PARTNERSHIPS
export const metadata: Metadata = {
  title: 'Partner', // Automatically transforms to "Partner | Fjorr" via layout.tsx
  description: 'We work with brands, studios, and individuals who believe stories shape people. Collaborate with Fjorr to bring meaningful ideas to life.',
  openGraph: {
    title: "Partner with Fjorr",
    description: 'We work with brands, studios, and individuals who believe stories shape people. Collaborate with Fjorr to bring meaningful ideas to life.',
    url: 'https://fjorr.com/partner',
    type: 'website',
  },
  twitter: {
    title: "Partner with Fjorr.",
    description: 'We work with brands, studios, and individuals who believe stories shape people. Collaborate with Fjorr to bring meaningful ideas to life.',
  }
};

export default function PartnerPage() {
  return <PartnerClient />;
}