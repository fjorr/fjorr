import React from 'react';
import { Link } from '@/i18n/navigation';
import ManualCopyEmailButton from '@/components/help/ManualCopyEmailButton';
import {
  getManualPlates,
  type ManualAction,
  type ManualArticleEntry,
  type ManualAudience,
  type ManualEntry,
  type ManualInstrumentEntry,
  type ManualPlate,
  type ManualSection,
} from '@/lib/help/content';

const primaryActionClass =
  'self-start inline-flex h-9 items-center px-3.5 rounded-[8px] bg-[var(--page-fg)] text-[var(--page-bg)] font-sans text-[13px] font-semibold tracking-tight hover:opacity-90 transition-opacity print:hidden';

function ActionLink({
  href,
  label,
  className,
  children,
}: {
  href: string;
  label?: string;
  className: string;
  children?: React.ReactNode;
}) {
  const body = children ?? label;
  if (href.startsWith('clipboard:')) {
    return (
      <ManualCopyEmailButton label={label || 'Write in'} className={className} />
    );
  }
  if (href.startsWith('mailto:')) {
    return (
      <a href={href} className={className}>
        {body}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {body}
    </Link>
  );
}

function EntryActions({ actions }: { actions: ManualAction[] }) {
  if (actions.length === 0) return null;

  if (actions.length === 1) {
    const action = actions[0];
    if (action.href.startsWith('clipboard:')) {
      return (
        <ManualCopyEmailButton
          label={action.label}
          className={primaryActionClass}
        />
      );
    }
    return (
      <ActionLink
        href={action.href}
        label={action.label}
        className={primaryActionClass}
      />
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      {actions.map((action) => (
        <ActionLink
          key={action.href}
          href={action.href}
          label={action.label}
          className={primaryActionClass}
        />
      ))}
    </div>
  );
}

function SpecField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <dt className="m-0 font-sans text-[16px] font-bold tracking-tight text-page select-none">
        {label}
      </dt>
      <dd className="m-0 font-sans text-[16px] text-page leading-[1.42] tracking-[-0.01em]">
        {children}
      </dd>
    </div>
  );
}

/** Quiet media opener — thumb + View; doesn’t stretch the card. */
function PlateLinks({
  plates,
  labels,
  onOpenPlate,
}: {
  plates: ManualPlate[];
  labels: ManualEntryLabels;
  onOpenPlate?: (index: number) => void;
}) {
  if (!onOpenPlate || plates.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2 pt-0.5 print:hidden">
      {plates.map((plate, index) => {
        const aria = plate.label
          ? labels.referenceAriaNamed.replace('{label}', plate.label)
          : labels.referenceAria;
        return (
          <button
            key={`${plate.src}-${index}`}
            type="button"
            onClick={() => onOpenPlate(index)}
            aria-label={aria}
            className="group relative block h-7 w-10 shrink-0 overflow-hidden rounded-[4px] bg-page-chip ring-1 ring-[color-mix(in_srgb,var(--page-fg)_12%,transparent)] border-0 p-0 cursor-pointer hover:ring-[color-mix(in_srgb,var(--page-fg)_28%,transparent)] transition-[box-shadow,ring-color]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={plate.src}
              alt=""
              className="h-full w-full object-cover"
            />
          </button>
        );
      })}
    </div>
  );
}

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

function EntryCta({ actions }: { actions: ManualAction[] }) {
  if (actions.length === 0) return null;
  return <EntryActions actions={actions} />;
}

function InstrumentBody({
  entry,
  labels,
  onOpenPlate,
  showActions,
  actions,
}: {
  entry: ManualInstrumentEntry;
  labels: ManualEntryLabels;
  onOpenPlate?: (index: number) => void;
  showActions: boolean;
  actions: ManualAction[];
}) {
  const plates = getManualPlates(entry);
  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="m-0 font-interTight font-extrabold tracking-tight text-[clamp(1.75rem,4.5vw,2.25rem)] print:text-[2rem] text-page leading-[1.08] select-none text-balance">
          {entry.title}
        </h1>
      </header>

      <dl className="m-0 flex flex-col gap-5">
        <SpecField label={labels.labelWhat}>{entry.what}</SpecField>
        <PlateLinks
          plates={plates}
          labels={labels}
          onOpenPlate={onOpenPlate}
        />
        <SpecField label={labels.labelHappens}>
          {entry.slug === 'contact' ? (
            <>
              Email reaches a real person. For how stories earn a place on
              Fjorr, read the{' '}
              <Link
                href="/principles"
                className="text-page underline underline-offset-2 decoration-[color-mix(in_srgb,var(--page-fg)_30%,transparent)] hover:decoration-[color-mix(in_srgb,var(--page-fg)_55%,transparent)]"
              >
                Principles of a Myth
              </Link>
              .
            </>
          ) : (
            entry.happens
          )}
        </SpecField>
      </dl>

      {showActions ? <EntryCta actions={actions} /> : null}
    </>
  );
}

function ArticleBody({
  entry,
  labels,
  onOpenPlate,
  showActions,
  actions,
}: {
  entry: ManualArticleEntry;
  labels: ManualEntryLabels;
  onOpenPlate?: (index: number) => void;
  showActions: boolean;
  actions: ManualAction[];
}) {
  const plates = getManualPlates(entry);
  return (
    <>
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
              {p}
            </p>
          ))}
          <PlateLinks
            plates={plates}
            labels={labels}
            onOpenPlate={onOpenPlate}
          />
        </div>
      ) : (
        <PlateLinks
          plates={plates}
          labels={labels}
          onOpenPlate={onOpenPlate}
        />
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

      {showActions ? <EntryCta actions={actions} /> : null}
    </>
  );
}

export type ManualEntryLabels = {
  labelWhat: string;
  labelHappens: string;
  referenceLabel: string;
  referenceAria: string;
  /** Use `{label}` placeholder for named plates. */
  referenceAriaNamed: string;
};

/**
 * Entry body — sits inside ManualMiniSite (or standalone with `bare={false}`).
 * Instrument = What / Happens. Article = eyebrow + headline + body.
 * Plates: thumb + View after What it is / lead (full-bleed on tap).
 */
export function ManualEntryArticle({
  entry,
  audience,
  labels,
  showActions = true,
  bare = false,
  className = '',
  onOpenPlate,
}: {
  entry: ManualEntry;
  audience: ManualAudience;
  bureauxNumber?: number | null;
  labels: ManualEntryLabels;
  showActions?: boolean;
  /** Inside the mini-site card — no outer shell, content padding only. */
  bare?: boolean;
  className?: string;
  /** Open a plate full-bleed in the parent card (index into entry.plates). */
  onOpenPlate?: (index: number) => void;
}) {
  const actions = entry.actions[audience];

  // No enter animation in the mini-site card — it flashes on every in-card switch / remount.
  const shell = bare
    ? 'flex flex-col gap-7 sm:gap-8 w-full px-10 pt-6 sm:pt-7 pb-10 print:break-after-page'
    : 'manual-card-in flex flex-col gap-7 sm:gap-8 w-full rounded-[16px] bg-page-elevated px-6 py-7 sm:px-9 sm:py-9 print:break-after-page';

  return (
    <article className={`${shell} ${className}`}>
      {entry.kind === 'article' ? (
        <ArticleBody
          entry={entry}
          labels={labels}
          onOpenPlate={onOpenPlate}
          showActions={showActions}
          actions={actions}
        />
      ) : (
        <InstrumentBody
          entry={entry}
          labels={labels}
          onOpenPlate={onOpenPlate}
          showActions={showActions}
          actions={actions}
        />
      )}
    </article>
  );
}
