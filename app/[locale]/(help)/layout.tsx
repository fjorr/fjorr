import type { Metadata } from 'next';
import HelpShell from '@/components/help/HelpShell';

export const metadata: Metadata = {
  title: {
    default: 'The Manual',
    template: '%s | The Manual',
  },
  robots: { index: true, follow: true },
};

/** Dedicated Manual chrome — no main site navbar/footer. */
export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <HelpShell>{children}</HelpShell>;
}
