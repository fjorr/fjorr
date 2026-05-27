import { Metadata } from 'next';
import SearchClient from './SearchClient'; // 🛠️ Points directly to your layout code file Above

// 🎯 SERVER-SIDE METADATA ENGINE FOR SEARCH
export const metadata: Metadata = {
  title: 'Search', // Automatically transforms to "Search | Fjorr" via layout.tsx
  description: 'Search across original cinematic films and historical artifacts inside the Fjorr Myth Engine.',
  openGraph: {
    title: 'Search | Fjorr',
    description: 'Search across original cinematic films and historical artifacts inside the Fjorr Myth Engine.',
    url: 'https://fjorr.com/search',
    type: 'website',
  },
  twitter: {
    title: 'Search | Fjorr',
    description: 'Search across original cinematic films and historical artifacts inside the Fjorr Myth Engine.',
  }
};

export default function SearchPage() {
  return <SearchClient />;
}