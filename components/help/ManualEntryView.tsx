import React from 'react';
import Image from 'next/image';
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

const CROSSHATCH = {
  backgroundImage: `
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 5px,
      color-mix(in srgb, var(--page-fg) 2.5%, transparent) 5px,
      color-mix(in srgb, var(--page-fg) 2.5%, transparent) 6px
    ),
    repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 5px,
      color-mix(in srgb, var(--page-fg) 2.5%, transparent) 5px,
      color-mix(in srgb, var(--page-fg) 2.5%, transparent) 6px
    )
  `,
} as const;

function ReferenceFigure({
  src,
  caption,
  label,
}: {
  src?: string;
  caption: string;
  label: string;
}) {
  return (
    <figure className="m-0 w-full print:break-inside-avoid">
      <div
        className="relative aspect-[4/3] w-full border border-[color-mix(in_srgb,var(--page-fg)_28%,transparent)] overflow-hidden bg-page"
        style={CROSSHATCH}
      >
        {src ? (
          <Image
            src={src}
            alt={caption}
            fill
            sizes="(max-width: 1023px) 90vw, 40vw"
            className="object-cover"
            unoptimized={src.endsWith('.svg')}
          />
        ) : (
          <div className="absolute inset-0 flex items-end p-3">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-page-faint">
              {label}
            </span>
          </div>
        )}
      </div>
      {src ? (
        <figcaption className="mt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-page-faint">
          {label}
          <span className="mx-1.5 opacity-40">·</span>
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

const primaryActionClass =
  'self-start inline-flex h-9 items-center gap-1.5 px-3.5 rounded-[8px] bg-[color-mix(in_srgb,var(--page-fg)_8%,var(--page-bg))] text-page font-sans text-[13px] font-semibold tracking-tight hover:bg-[color-mix(in_srgb,var(--page-fg)_12%,var(--page-bg))] transition-colors print:hidden';

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
          className="shrink-0 text-page-faint translate-y-px"
          aria-hidden
        />
      </ActionLink>
    );
  }

  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-[14px] font-semibold print:hidden">
      {actions.map((action, i) => (
        <React.Fragment key={action.href}>
          {i > 0 ? (
            <span className="text-page-faint" aria-hidden>
              ·
            </span>
          ) : null}
          <ActionLink
            href={action.href}
            label={action.label}
            className="text-page underline underline-offset-2 decoration-[color-mix(in_srgb,var(--page-fg)_30%,transparent)] hover:decoration-[color-mix(in_srgb,var(--page-fg)_55%,transparent)]"
          />
        </React.Fragment>
      ))}
    </p>
  );
}

function SpecField({
  label,
  children,
  last = false,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-2 ${
        last
          ? 'pt-0'
          : 'pb-8 border-b border-[color-mix(in_srgb,var(--page-fg)_22%,transparent)]'
      }`}
    >
      <dt className="m-0 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-page-faint">
        {label}
      </dt>
      <dd className="m-0 font-sans text-[15px] sm:text-[16px] text-page leading-[1.65] tracking-[-0.005em]">
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
  referenceLabel: string;
};

/** Shared entry layout — screen + print sheet. */
export function ManualEntryArticle({
  entry,
  audience,
  labels,
  animateFolio = false,
  showReference = true,
  showActions = true,
}: {
  entry: ManualEntry;
  audience: ManualAudience;
  /** Kept for call-site compatibility; copy no longer varies by seat. */
  bureauxNumber?: number | null;
  labels: Labels;
  animateFolio?: boolean;
  showReference?: boolean;
  showActions?: boolean;
}) {
  const actions = entry.actions[audience];
  const actionLine =
    actions.length === 0 ? labels.actionNone : labels.actionRequired;

  return (
    <article className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-12 lg:gap-16 w-full print:flex-col print:gap-8 print:break-after-page">
      <header className="flex flex-col gap-6 lg:gap-8 min-w-0 lg:max-w-[22rem] xl:max-w-[26rem] shrink-0 lg:pl-0">
        <div className="flex flex-col gap-4 lg:gap-5">
          <p
            className={`m-0 font-interTight font-bold text-[clamp(5.5rem,18vw,9rem)] print:text-[4.5rem] tracking-tighter text-page leading-[0.85] select-none ${
              animateFolio ? 'manual-folio-in' : ''
            }`}
          >
            {entry.number}
          </p>
          <h1 className="font-interTight font-bold tracking-tight text-[clamp(2.5rem,7vw,4rem)] print:text-[2.5rem] text-page leading-[0.98] select-none text-balance">
            {entry.title}
          </h1>
        </div>
        {showActions ? (
          <div className="flex flex-col gap-3">
            <p className="m-0 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-page-faint">
              {actionLine}
            </p>
            <EntryActions actions={actions} />
          </div>
        ) : null}
      </header>

      <div className="flex flex-col gap-10 min-w-0 w-full lg:w-[min(100%,26rem)] lg:shrink-0 lg:pt-3 lg:pr-8 xl:pr-10 print:pt-0 print:pr-0 print:max-w-none">
        <dl className="m-0 flex flex-col gap-8">
          <SpecField label={labels.labelWhat}>{entry.what}</SpecField>
          <SpecField label={labels.labelHappens} last>
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
              <span className="text-page-muted">{entry.happens}</span>
            )}
          </SpecField>
        </dl>

        {showReference ? (
          <ReferenceFigure
            src={entry.plate}
            caption={entry.title}
            label={labels.referenceLabel}
          />
        ) : null}
      </div>
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
    referenceLabel: t('referenceLabel'),
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
