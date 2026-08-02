import React from 'react';
import { Link } from '@/i18n/navigation';
import {
  getHelpCategory,
  type HelpArticle,
  type HelpSection,
} from '@/lib/help/content';

function SectionBlock({ section }: { section: HelpSection }) {
  if (section.type === 'h2') {
    return (
      <h2 className="mt-8 mb-3 font-sans text-[15px] font-semibold tracking-tight text-page">
        {section.text}
      </h2>
    );
  }
  if (section.type === 'ul') {
    return (
      <ul className="m-0 pl-5 flex flex-col gap-2 list-disc">
        {section.items.map((item) => (
          <li
            key={item}
            className="font-sans text-[15px] text-page-muted leading-relaxed"
          >
            {item}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <p className="font-sans text-[15px] sm:text-[16px] text-page-muted leading-relaxed">
      {section.text}
    </p>
  );
}

/** Article template for The Manual. */
export default function HelpArticleView({ article }: { article: HelpArticle }) {
  const category = getHelpCategory(article.categoryId);

  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 border-b border-page-faint pb-6">
        {category ? (
          <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.08em] text-page-faint">
            {category.label}
          </p>
        ) : null}
        <h1 className="font-futura text-[2rem] sm:text-[2.35rem] tracking-tighter text-page leading-[1.05] select-none">
          {article.title}
        </h1>
        <p className="font-sans text-[15px] sm:text-[16px] text-page-muted leading-relaxed max-w-xl">
          {article.lead}
        </p>
      </header>

      <div className="flex flex-col gap-4">
        {article.sections.map((section, i) => (
          <SectionBlock key={`${section.type}-${i}`} section={section} />
        ))}
      </div>

      <footer className="pt-8 mt-4 border-t border-page-faint">
        <Link
          href="/manual"
          className="font-sans text-[13px] font-semibold text-page-faint hover:text-page-muted transition-colors"
        >
          ← The Manual
        </Link>
      </footer>
    </article>
  );
}
