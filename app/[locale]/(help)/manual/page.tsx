import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { listManualEntries, manualEntryHref } from '@/lib/help/content';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');
  return {
    title: t('helpTitle'),
    description: t('helpDescription'),
    alternates: { canonical: '/manual' },
  };
}

export default async function ManualIndexPage() {
  const t = await getTranslations('Help');
  const first = listManualEntries()[0];

  return (
    <div className="h-full min-h-[min(28rem,60dvh)] flex flex-col justify-center">
      <header className="flex flex-col gap-5 max-w-[22rem] sm:max-w-[36rem]">
        <h1 className="font-sans font-semibold tracking-tight text-[clamp(1.75rem,4.5vw,2.25rem)] text-page leading-[1.15] select-none text-balance">
          {t('homeHeadline')}
        </h1>
        <p className="font-sans text-[15px] sm:text-[16px] text-page-muted leading-relaxed max-w-[22rem]">
          {t('homeLead')}
        </p>
        {first ? (
          <Link
            href={manualEntryHref(first.slug)}
            className="self-start inline-flex h-9 items-center gap-1.5 px-3.5 rounded-[8px] bg-[var(--page-fg)] text-[var(--page-bg)] font-sans text-[13px] font-semibold tracking-tight hover:opacity-90 transition-opacity mt-1"
          >
            <span>
              {t('beginCta', { number: first.number, title: first.title })}
            </span>
            <ArrowRight
              size={14}
              strokeWidth={1.75}
              className="shrink-0 translate-y-px"
              aria-hidden
            />
          </Link>
        ) : null}
      </header>
    </div>
  );
}
