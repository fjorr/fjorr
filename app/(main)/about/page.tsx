import { Metadata } from 'next';
import AboutClient from './AboutClient'; // 🛠️ Points directly to your GSAP timeline code file Above

// 🎯 SERVER-SIDE METADATA ENGINE FOR THE ABOUT MANIFESTO
export const metadata: Metadata = {
  title: 'About', // Automatically transforms to "About | Fjorr" via layout.tsx
  description: 'Short films of the world’s greatest stories. Designed to form imagination, character, and cultural literacy.',
  openGraph: {
    title: 'About | Fjorr',
    description: 'Short films of the world’s greatest stories.',
    url: 'https://fjorr.com/about',
    type: 'website',
  },
  twitter: {
    title: 'About | Fjorr',
    description: 'Short films of the world’s greatest stories.',
  }
};

export default function AboutPage() {
  return <AboutClient />;
}