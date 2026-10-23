import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import type { AppLocale } from '@/i18n/config';
import { Link } from '@/i18n/navigation';
import { buildAlternates } from '@/lib/seo/alternates';
import { marketingShareImages } from '@/lib/seo/og';
import HouseScrollFooter from '@/components/HouseScrollFooter';
import { formatSlateMonth, loadSlateIndex } from '@/lib/slate';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations('Meta');
  const title = t('slateTitle');
  const description = t('slateDescription');
  const { openGraphImages, twitterImages } = marketingShareImages(title);
  return {
    title,
    description,
    alternates: buildAlternates('/slate', locale),
    openGraph: {
      title: `${title} | Fjorr`,
      description,
      url: 'https://www.fjorr.com/slate',
      type: 'website',
      images: openGraphImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Fjorr`,
      description,
      images: twitterImages,
    },
  };
}

export default async function SlatePage() {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations('Slate');
  const editions = await loadSlateIndex();
  const cards = [...editions].sort((a, b) => {
    const aTime = a.endsAt ? Date.parse(a.endsAt) : 0;
    const bTime = b.endsAt ? Date.parse(b.endsAt) : 0;
    return bTime - aTime;
  });

  return (
    <div className="relative flex min-h-[calc(100dvh-56px)] w-full flex-col bg-[#F5F5F7] text-[#0B0B0C]">
      <div className="mx-auto flex w-full flex-1 flex-col items-center gap-8 px-5 py-8 sm:px-8 md:px-10 md:py-10">
        <header className="flex w-full flex-col items-center gap-3 text-center">
          <h1 className="m-0 select-none font-[family-name:var(--font-circular-black)] text-3xl font-[900] leading-[1.05] tracking-[-0.03em] text-[#0B0B0C] sm:text-4xl">
            {t('headline')}
          </h1>
          <p className="m-0 max-w-[28rem] font-sans text-[16px] font-medium leading-relaxed text-black/45">
            {t('aboutBody')}
          </p>
        </header>
        {cards.length > 0 ? (
          <ul className="m-0 grid w-full list-none justify-center gap-6 p-0 [grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),380px))]">
            {cards.map((item) => {
              const when = item.endsAt ? formatSlateMonth(locale, item.endsAt) : '';
              const card = (
                <>
                  <p className="m-0 font-[family-name:var(--font-circular-black)] text-[28px] font-[900] leading-none tracking-[-0.03em] sm:text-[32px]">
                    {item.edition}
                  </p>
                  <div className="mt-3 min-h-[6.75rem]">
                    {item.open ? (
                      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                        {item.titles.map((title, titleIndex) => (
                          <li
                            key={`${item.edition}-${titleIndex}`}
                            className="line-clamp-1 font-sans text-[15px] font-semibold leading-snug tracking-tight"
                          >
                            {title}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="m-0 line-clamp-2 font-sans text-[17px] font-semibold leading-snug tracking-tight">
                        {'\u00a0'}
                      </p>
                    )}
                  </div>
                  <p className="m-0 mt-3 font-sans text-[14px] font-medium text-black/40">
                    {when || '\u00a0'}
                  </p>
                </>
              );
              const cardClass =
                'relative z-0 flex h-full w-full flex-col overflow-hidden rounded-[18px] bg-white p-7 text-left text-[#0B0B0C] shadow-[3px_5px_30px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:z-10 hover:scale-[1.03] motion-reduce:transition-none motion-reduce:hover:scale-100';
              return (
                <li key={item.edition} className="relative hover:z-10">
                  <Link href={`/slate/${item.edition}`} className={cardClass}>
                    {card}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="m-0 max-w-[28ch] py-6 text-center font-sans text-[16px] font-medium leading-relaxed text-black/45">
            {t('empty')}
          </p>
        )}
      </div>
      <HouseScrollFooter surfaceClassName="bg-[#F5F5F7]" />
    </div>
  );
}
