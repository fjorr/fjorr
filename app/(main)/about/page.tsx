import { Metadata } from 'next';
import AboutClient from './AboutClient'; // 🛠️ Points directly to your GSAP timeline code file Above

// 🎯 SERVER-SIDE METADATA ENGINE FOR THE ABOUT MANIFESTO
export const metadata: Metadata = {
  title: 'Our Story', // Automatically transforms to "Our Story | Fjorr" via layout.tsx
  description: 'We are building a myth engine. Short, cinematic films designed to form imagination, character, and cultural literacy.',
  openGraph: {
    title: 'Our Story | Fjorr',
    description: 'We are building a myth engine. Short, cinematic films designed to form imagination, character, and cultural literacy.',
    url: 'https://fjorr.com/about',
    type: 'website',
  },
  twitter: {
    title: 'Our Story | Fjorr',
    description: 'We are building a myth engine. Short, cinematic films designed to form imagination, character, and cultural literacy.',
  }
};

export default function AboutPage() {
  return <AboutClient />;
}