import React from 'react';
import {
  ManualInline,
  EntryActions,
  PlateLinks,
  type ManualEntryLabels,
} from '@/components/help/ManualEntryChrome';
import {
  getManualPlates,
  type ManualAudience,
  type ManualEntry,
  type ManualSection,
} from '@/lib/help/content';

export type { ManualEntryLabels };

function Sections({ sections }: { sections: ManualSection[] }) {
  return (
    <div className="flex flex-col gap-7 sm:gap-8">
      {sections.map((section) => (
        <section key={section.title} className="flex flex-col gap-2.5">
          <h2 className="m-0 font-interTight font-bold tracking-tight text-[1.05rem] sm:text-[1.15rem] leading-[1.2] text-page">
            {section.title}
          </h2>
          {section.paragraphs && section.paragraphs.length > 0 ? (
            <div className="flex flex-col gap-3">
              {section.paragraphs.map((p) => (
                <p
                  key={p.slice(0, 48)}
                  className="m-0 font-sans text-[16px] text-page leading-[1.45] tracking-[-0.01em]"
                >
                  {p}
                </p>
              ))}
            </div>
          ) : null}
          {section.bullets && section.bullets.length > 0 ? (
            <ul className="m-0 pl-[1.1em] flex flex-col gap-2 list-disc marker:text-page-faint">
              {section.bullets.map((item) => (
                <li
                  key={item}
                  className="font-sans text-[16px] text-page leading-[1.45] tracking-[-0.01em] pl-0.5"
                >
                  {item}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </div>
  );
}

function Steps({ steps }: { steps: { title: string; items: string[] } }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="m-0 font-sans text-[12px] sm:text-[13px] font-medium text-page-muted select-none">
        {steps.title}
      </h2>
      <ol className="m-0 p-0 list-none flex flex-col gap-2.5">
        {steps.items.map((item, i) => (
          <li
            key={item}
            className="font-sans text-[16px] text-page leading-[1.45] tracking-[-0.01em]"
          >
            <span className="font-sans text-[12px] text-page-faint mr-2 tabular-nums">
              {i + 1}
            </span>
            {item}
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * Entry body — server-rendered article with client islands for plates / pager / links.
 */
export function ManualEntryArticle({
  entry,
  audience,
  labels,
  showActions = true,
  bare = false,
  className = '',
}: {
  entry: ManualEntry;
  audience: ManualAudience;
  bureauxNumber?: number | null;
  labels: ManualEntryLabels;
  showActions?: boolean;
  /** Inside the mini-site card — no outer shell, content padding only. */
  bare?: boolean;
  className?: string;
}) {
  const actions = entry.actions[audience];
  const plates = getManualPlates(entry);

  const shell = bare
    ? 'flex flex-col gap-7 sm:gap-8 w-full px-10 pt-6 sm:pt-7 pb-10 print:break-after-page'
    : 'manual-card-in flex flex-col gap-7 sm:gap-8 w-full rounded-[16px] bg-page-elevated px-6 py-7 sm:px-9 sm:py-9 print:break-after-page';

  return (
    <article className={`${shell} ${className}`}>
      <header className="flex flex-col gap-2">
        <p className="m-0 font-sans text-[13px] sm:text-[14px] font-semibold text-page-muted select-none">
          {entry.title}
        </p>
        <h1 className="m-0 font-interTight font-extrabold tracking-tight text-[clamp(1.75rem,4.5vw,2.25rem)] print:text-[2rem] text-page leading-[1.08] select-none text-balance">
          {entry.headline}
        </h1>
        {entry.updated ? (
          <p className="m-0 font-sans text-[12px] sm:text-[13px] font-medium text-page-faint select-none">
            {entry.updated}
          </p>
        ) : null}
      </header>

      {entry.lead && entry.lead.length > 0 ? (
        <div className="flex flex-col gap-3.5">
          {entry.lead.map((p) => (
            <p
              key={p.slice(0, 48)}
              className="m-0 font-sans text-[16px] text-page leading-[1.45] tracking-[-0.01em]"
            >
              <ManualInline text={p} audience={audience} />
            </p>
          ))}
          <PlateLinks plates={plates} labels={labels} />
        </div>
      ) : (
        <PlateLinks plates={plates} labels={labels} />
      )}

      {entry.sections && entry.sections.length > 0 ? (
        <Sections sections={entry.sections} />
      ) : null}

      {entry.steps && entry.steps.items.length > 0 ? (
        <Steps steps={entry.steps} />
      ) : null}

      {entry.closing ? (
        <p className="m-0 font-interTight font-bold tracking-tight text-[1.05rem] sm:text-[1.15rem] leading-[1.25] text-page">
          {entry.closing}
        </p>
      ) : null}

      {showActions ? <EntryActions actions={actions} /> : null}
    </article>
  );
}
