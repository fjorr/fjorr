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
    <div className="w-full bg-white px-6 pb-20 pt-16 text-[#0B0B0C] md:px-[54px] md:pb-28 md:pt-20">
      <article className="mx-auto w-full max-w-[40rem]">
        <header className="mb-16 flex flex-col items-center text-center md:mb-20">
          <h1 className="m-0 max-w-[36rem] text-balance font-[family-name:var(--font-circular-black)] text-[clamp(2.5rem,7vw,3.75rem)] font-[900] leading-[1.05] tracking-[-0.04em] text-[#0B0B0C]">
            {title}
          </h1>
          <p className="m-0 mt-5 font-sans text-[13px] font-medium tabular-nums text-black/35">
            {lastUpdatedLabel} · {date}
          </p>
          {lead ? (
            <p className="m-0 mt-5 max-w-[26rem] text-balance font-sans text-[16px] font-medium leading-relaxed text-black/55 md:text-[17px]">
              {lead}
            </p>
          ) : null}
        </header>

        <div className="flex flex-col">
          {sections.map((section, i) => (
            <section
              key={section.title}
              className={`flex flex-col gap-4 ${
                i === 0 ? '' : 'mt-12 md:mt-14'
              }`}
            >
              <h2 className="m-0 font-[family-name:var(--font-circular-black)] text-[22px] font-[900] leading-[1.05] tracking-[-0.03em] text-[#0B0B0C] md:text-[26px]">
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
