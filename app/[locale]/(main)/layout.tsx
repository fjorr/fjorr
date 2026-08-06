import MainChrome from '@/components/MainChrome';

/** Server layout — chrome is a thin client shell; pages stay RSC. */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <MainChrome>{children}</MainChrome>;
}
