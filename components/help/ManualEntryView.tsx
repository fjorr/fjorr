import React from 'react';
import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import ManualCopyEmailButton from '@/components/help/ManualCopyEmailButton';
import ManualPager from '@/components/help/ManualPager';
import {
  getManualEntryNeighbors,
  manualEntryHref,
  type ManualAction,
  type ManualAudience,
  type ManualEntry,
} from '@/lib/help/content';

const primaryActionClass =
  'self-start inline-flex h-9 items-center gap-1.5 px-3.5 rounded-[8px] bg-[var(--page-fg)] text-[var(--page-bg)] font-sans text-[13px] font-semibold tracking-tight hover:opacity-90 transition-opacity print:hidden';

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
      <ActionLink href={action.href} className={primaryActionClass}>
        <span>{action.label}</span>
        <ArrowRight
          size={14}
          strokeWidth={1.75}
          className="shrink-0 opacity-70 translate-y-px"
          aria-hidden
        />
      </ActionLink>
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
      <dt className="m-0 font-sans text-[13px] font-medium text-page-muted select-none">
        {label}
      </dt>
      <dd className="m-0 font-sans text-[15px] sm:text-[16px] text-page leading-[1.42] tracking-[-0.01em]">
        {children}
      </dd>
    </div>
  );
}

type Labels = {
  labelWhat: string;
  labelHappens: string;
  actionRequired: string;
  actionNone: string;
};

/** Shared entry layout — screen + print sheet. */
export function ManualEntryArticle({
  entry,
  audience,
  labels,
  animateFolio = false,
  showActions = true,
}: {
  entry: ManualEntry;
  audience: ManualAudience;
  /** Kept for call-site compatibility; copy no longer varies by seat. */
  bureauxNumber?: number | null;
  labels: Labels;
  animateFolio?: boolean;
  showActions?: boolean;
}) {
  const actions = entry.actions[audience];
  const actionLine =
    actions.length === 0 ? labels.actionNone : labels.actionRequired;

  return (
    <article className="flex flex-col gap-8 lg:gap-10 w-full max-w-[40rem] print:break-after-page">
      <header className="flex flex-col gap-3">
        <p
          className={`m-0 font-mono text-[12px] font-medium tabular-nums tracking-[0.06em] text-page-faint select-none ${
            animateFolio ? 'manual-folio-in' : ''
          }`}
        >
          {entry.number}
        </p>
        <h1 className="font-interTight font-bold tracking-tight text-[clamp(2.5rem,7vw,4rem)] print:text-[2.5rem] text-page leading-[0.98] select-none text-balance">
          {entry.title}
        </h1>
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
          <p className="m-0 font-sans text-[13px] font-medium text-page-muted select-none">
            {actionLine}
          </p>
          <EntryActions actions={actions} />
        </div>
      ) : null}
    </article>
  );
}

/** Single Manual entry with pager + folio motion. */
export default async function ManualEntryView({
  entry,
  audience,
  bureauxNumber,
}: {
  entry: ManualEntry;
  audience: ManualAudience;
  bureauxNumber: number | null;
}) {
  const t = await getTranslations('Help');
  const { prev, next } = getManualEntryNeighbors(entry.slug);
  const labels = {
    labelWhat: t('labelWhat'),
    labelHappens: t('labelHappens'),
    actionRequired: t('actionRequired'),
    actionNone: t('actionNone'),
  };

  return (
    <ManualPager
      prevHref={prev ? manualEntryHref(prev.slug) : null}
      nextHref={next ? manualEntryHref(next.slug) : null}
    >
      <ManualEntryArticle
        entry={entry}
        audience={audience}
        bureauxNumber={bureauxNumber}
        labels={labels}
        animateFolio
      />
    </ManualPager>
  );
}
