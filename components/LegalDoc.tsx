import React from 'react';
import { Link } from '@/i18n/navigation';

export type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  /** Optional trailing node (e.g. mailto after contact lead). */
  after?: React.ReactNode;
};

/**
 * Full-page legal reading layout — Privacy / Terms.
 * Content comes from next-intl message namespaces (one source of truth).
 */
export default function LegalDoc({
  title,
  lastUpdatedLabel,
  date,
  lead,
  sections,
  footerLinks,
}: {
  title: string;
  lastUpdatedLabel: string;
  date: string;
  lead?: string;
  sections: LegalSection[];
  footerLinks?: { href: string; label: string }[];
}) {
  return (
    <div className="w-full min-h-[calc(100dvh-8rem)] px-6 sm:px-8 md:px-16 pt-10 md:pt-14 pb-20 md:pb-28">
      <article className="mx-auto w-full max-w-[40rem]">
        <header className="flex flex-col gap-3 mb-12 md:mb-16">
          <h1 className="m-0 font-interTight font-extrabold tracking-tight text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.1] text-page text-balance">
            {title}
          </h1>
          <p className="m-0 mb-4 md:mb-5 font-sans text-[13px] font-medium text-page-faint tabular-nums">
            {lastUpdatedLabel} · {date}
          </p>
          {lead ? (
            <p className="m-0 font-sans text-[17px] font-medium leading-[1.5] text-page tracking-[-0.01em]">
              {lead}
            </p>
          ) : null}
        </header>

        <div className="flex flex-col">
          {sections.map((section, i) => (
            <section
              key={section.title}
              className={`flex flex-col gap-3 ${
                i === 0 ? '' : 'mt-10 md:mt-12'
              }`}
            >
              <h2 className="m-0 font-interTight font-bold tracking-tight text-[1.1rem] sm:text-[1.2rem] leading-[1.3] text-page">
                {section.title}
              </h2>
              {section.paragraphs?.map((p) => (
                <p
                  key={p.slice(0, 48)}
                  className="m-0 font-sans text-[15px] sm:text-[16px] text-page-muted leading-[1.6] tracking-[-0.01em]"
                >
                  {p}
                </p>
              ))}
              {section.bullets && section.bullets.length > 0 ? (
                <ul className="m-0 mt-1 pl-[1.1em] flex flex-col gap-2.5 list-disc marker:text-page-faint">
                  {section.bullets.map((item) => (
                    <li
                      key={item}
                      className="font-sans text-[15px] sm:text-[16px] text-page-muted leading-[1.6] tracking-[-0.01em] pl-0.5"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
              {section.after ? (
                <div className="font-sans text-[15px] sm:text-[16px] text-page-muted leading-[1.6]">
                  {section.after}
                </div>
              ) : null}
            </section>
          ))}
        </div>

        {footerLinks && footerLinks.length > 0 ? (
          <div className="mt-12 pt-6 border-t border-[color-mix(in_srgb,var(--page-fg)_10%,transparent)] flex flex-wrap gap-x-5 gap-y-2">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-sans text-[14px] font-semibold text-page underline underline-offset-4 decoration-[color-mix(in_srgb,var(--page-fg)_25%,transparent)] hover:decoration-[color-mix(in_srgb,var(--page-fg)_55%,transparent)]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        ) : null}
      </article>
    </div>
  );
}
