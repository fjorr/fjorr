import { Metadata } from 'next';
import ContactClient from './ContactClient'; // 🛠️ Points directly to the file above

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Ideas, partnerships, or something worth making. Reach out to the Fjorr team.',
  openGraph: {
    title: 'Contact Fjorr',
    description: 'Ideas, partnerships, or something worth making. Reach out to the Fjorr team.',
    url: 'https://fjorr.com/contact',
    type: 'website',
  },
};

export default function ContactPage() {
  return <ContactClient />;
}