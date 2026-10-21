import type { Metadata } from 'next';
import { File, Lock } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import type { AppLocale } from '@/i18n/config';
import { Link } from '@/i18n/navigation';
import { buildAlternates } from '@/lib/seo/alternates';
import HouseScrollFooter from '@/components/HouseScrollFooter';

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations('Footer');
  const title = t('legalAria');
  return {
    title,
    alternates: buildAlternates('/legal', locale),
  };
}

const LINKS = [
  { href: '/privacy' as const, labelKey: 'privacyShort' as const, icon: Lock },
  { href: '/terms' as const, labelKey: 'termsShort' as const, icon: File },
];

export default async function LegalPage() {
  const t = await getTranslations('Footer');

  return (
    <div className="flex min-h-[calc(100dvh-56px)] w-full flex-col bg-white text-[#0B0B0C]">
      <div className="flex w-full flex-1 flex-col items-center justify-center px-6">
        <div className="flex w-full max-w-[22rem] flex-col items-center">
          <ul className="m-0 grid w-full list-none grid-cols-2 gap-2.5 p-0">
            {LINKS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex h-12 w-full items-center justify-between gap-3 rounded-full bg-[#F5F5F7] px-4 font-sans text-[15px] font-medium tracking-tight text-[#0B0B0C] transition-colors hover:bg-[#EBEBEF]"
                >
                  <span>{t(item.labelKey)}</span>
                  <item.icon
                    className="h-3.5 w-3.5 shrink-0 text-black/45"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <HouseScrollFooter />
    </div>
  );
}
