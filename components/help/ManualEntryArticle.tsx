import React from 'react';
import { Frame } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import ManualCopyEmailButton from '@/components/help/ManualCopyEmailButton';
import type {
  ManualAction,
  ManualAudience,
  ManualEntry,
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
    <div className="flex flex-col gap-1">
      <dt className="m-0 font-sans text-[12px] sm:text-[13px] font-medium text-page-muted select-none">
        {label}
      </dt>
      <dd className="m-0 font-sans text-[15px] sm:text-[16px] text-page leading-[1.42] tracking-[-0.01em]">
        {children}
      </dd>
    </div>
  );
}

export type ManualEntryLabels = {
  labelWhat: string;
  labelHappens: string;
  actionRequired: string;
  actionNone: string;
  referenceLabel: string;
  referenceAria: string;
};

/**
 * Entry body — sits inside ManualMiniSite (or standalone with `bare={false}`).
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
  /** Open the entry’s reference image full-bleed in the parent card. */
  onOpenPlate?: () => void;
}) {
  const actions = entry.actions[audience];
  const actionLine =
    actions.length === 0 ? labels.actionNone : labels.actionRequired;

  // No enter animation in the mini-site card — it flashes on every in-card switch / remount.
  const shell = bare
    ? 'flex flex-col gap-7 sm:gap-8 w-full px-10 pt-6 sm:pt-7 pb-10 print:break-after-page'
    : 'manual-card-in flex flex-col gap-7 sm:gap-8 w-full rounded-[16px] bg-page-elevated px-6 py-7 sm:px-9 sm:py-9 print:break-after-page';

  return (
    <article className={`${shell} ${className}`}>
      <header className="flex flex-col gap-2">
        <h1 className="m-0 font-interTight font-bold tracking-tight text-[clamp(1.75rem,4.5vw,2.25rem)] print:text-[2rem] text-page leading-[1.08] select-none text-balance">
          {entry.title}
        </h1>
        {entry.plate && onOpenPlate ? (
          <button
            type="button"
            onClick={onOpenPlate}
            aria-label={labels.referenceAria}
            className="self-start inline-flex items-center gap-1.5 font-sans text-[12px] sm:text-[13px] font-medium text-page-faint hover:text-page bg-transparent border-0 p-0 cursor-pointer transition-colors print:hidden"
          >
            <Frame size={14} strokeWidth={1.75} className="shrink-0" aria-hidden />
            {labels.referenceLabel}
          </button>
        ) : null}
      </header>

      <dl className="m-0 flex flex-col gap-4">
        <SpecField label={labels.labelWhat}>{entry.what}</SpecField>
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

      {showActions ? (
        <div className="flex flex-col gap-2.5">
          <p className="m-0 font-sans text-[12px] sm:text-[13px] font-medium text-page-muted select-none">
            {actionLine}
          </p>
          <EntryActions actions={actions} />
        </div>
      ) : null}
    </article>
  );
}
