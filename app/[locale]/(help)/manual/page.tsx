import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import {
  HELP_CATEGORIES,
  getHelpArticle,
  helpArticleHref,
} from '@/lib/help/content';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Meta');
  return {
    title: t('helpTitle'),
    description: t('helpDescription'),
    alternates: { canonical: '/manual' },
  };
}

export default async function HelpHomePage() {
  const t = await getTranslations('Help');

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3 border-b border-page-faint pb-8">
        <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.08em] text-page-faint">
          {t('eyebrow')}
        </p>
        <h1 className="font-futura text-[2.25rem] sm:text-[2.75rem] tracking-tighter text-page leading-[0.95] select-none">
          {t('homeHeadline')}
        </h1>
        <p className="font-sans text-[15px] sm:text-[16px] text-page-muted leading-relaxed max-w-xl">
          {t('homeLead')}
        </p>
      </header>

      <div className="flex flex-col gap-8">
        {HELP_CATEGORIES.map((group) => (
          <section key={group.id} className="flex flex-col gap-3">
            <h2 className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-page-faint">
              {group.label}
            </h2>
            <ul className="m-0 p-0 list-none flex flex-col divide-y divide-page-faint border-y border-page-faint">
              {group.articleSlugs.map((slug) => {
                const article = getHelpArticle(slug);
                if (!article) return null;
                return (
                  <li key={slug}>
                    <Link
                      href={helpArticleHref(slug)}
                      className="block py-3.5 group"
                    >
                      <p className="font-sans text-[15px] font-semibold tracking-tight text-page group-hover:opacity-70 transition-opacity">
                        {article.title}
                      </p>
                      <p className="mt-0.5 font-sans text-[13px] text-page-faint leading-snug">
                        {article.description}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
