import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin-auth';
import AdminShell from '@/components/admin/AdminShell';

export const metadata: Metadata = {
  title: 'Control',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { email } = await requireAdmin();

  return <AdminShell email={email}>{children}</AdminShell>;
}
