import { Metadata } from 'next';
import SearchClient from './SearchClient'; // 🛠️ Points directly to your layout code file Above

// 🎯 SERVER-SIDE METADATA ENGINE FOR SEARCH
export const metadata: Metadata = {
  title: 'Search', // Automatically transforms to "Search | Fjorr" via layout.tsx
  description: 'Search short films and artifacts.',
  openGraph: {
    title: 'Search | Fjorr',
    description: 'Search short films and artifacts.',
    url: 'https://fjorr.com/search',
    type: 'website',
  },
  twitter: {
    title: 'Search | Fjorr',
    description: 'Search short films and artifacts.',
  }
};

export default function SearchPage() {
  return <SearchClient />;
}