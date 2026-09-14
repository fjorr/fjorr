import React from 'react';

export type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  /** Optional trailing node (e.g. mailto after contact lead). */
  after?: React.ReactNode;
};

/**
 * Full-page legal reading layout — Privacy / Terms.
 * White house reading surface; content from next-intl.
 */
export default function LegalDoc({
  title,
  lastUpdatedLabel,
  date,
  lead,
  sections,
}: {
  title: string;
  lastUpdatedLabel: string;
  date: string;
  lead?: string;
  sections: LegalSection[];
}) {
  return (
    <div className="w-full bg-white px-5 pb-16 pt-10 text-[#0B0B0C] sm:px-8 md:px-[60px] md:pb-24 md:pt-14 lg:px-[100px]">
      <article className="mx-auto w-full max-w-[40rem]">
        <header className="mb-12 flex flex-col items-center gap-3 text-center md:mb-16">
          <h1 className="m-0 text-balance font-interTight text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-[1.1] tracking-tight text-[#0B0B0C]">
            {title}
          </h1>
          <p className="m-0 font-sans text-[13px] font-medium tabular-nums text-black/35">
            {lastUpdatedLabel} · {date}
          </p>
          {lead ? (
            <p className="m-0 max-w-[36rem] text-balance font-sans text-[17px] font-medium leading-[1.5] tracking-[-0.01em] text-[#0B0B0C]">
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
              <h2 className="m-0 font-interTight text-[1.1rem] font-bold leading-[1.3] tracking-tight text-[#0B0B0C] sm:text-[1.2rem]">
                {section.title}
              </h2>
              {section.paragraphs?.map((p) => (
                <p
                  key={p.slice(0, 48)}
                  className="m-0 font-sans text-[15px] leading-[1.6] tracking-[-0.01em] text-black/55 sm:text-[16px]"
                >
                  {p}
                </p>
              ))}
              {section.bullets && section.bullets.length > 0 ? (
                <ul className="m-0 mt-1 flex list-disc flex-col gap-2.5 pl-[1.1em] marker:text-black/30">
                  {section.bullets.map((item) => (
                    <li
                      key={item}
                      className="pl-0.5 font-sans text-[15px] leading-[1.6] tracking-[-0.01em] text-black/55 sm:text-[16px]"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
              {section.after ? (
                <div className="font-sans text-[15px] leading-[1.6] text-black/55 sm:text-[16px]">
                  {section.after}
                </div>
              ) : null}
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
