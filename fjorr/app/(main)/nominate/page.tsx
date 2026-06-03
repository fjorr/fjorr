import { Metadata } from 'next';
import NominateClient from './NominateClient'; // 🛠️ Points straight to your form code file

// 🎯 SERVER-SIDE METADATA ENGINE FOR NOMINATIONS
export const metadata: Metadata = {
  title: 'Nominate', // Becomes "Nominate | Fjorr" automatically via layout.tsx
  description: 'Know a story the world needs to hear? Nominate a piece of history, a fictional adventure, or a forgotten legend to have your name stamped on the film.',
  openGraph: {
    title: 'Nominate | Fjorr',
    description: 'Know a story the world needs to hear? Nominate a piece of history, a fictional adventure, or a forgotten legend to have your name stamped on the film.',
    url: 'https://fjorr.com/nominate',
    type: 'website',
  },
  twitter: {
    title: 'Nominate | Fjorr',
    description: 'Know a story the world needs to hear? Nominate a piece of history, a fictional adventure, or a forgotten legend to have your name stamped on the film.',
  }
};

export default function NominatePage() {
  return <NominateClient />;
}