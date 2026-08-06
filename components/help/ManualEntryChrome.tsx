'use client';

import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import ManualCopyEmailButton from '@/components/help/ManualCopyEmailButton';
import { useManualCard } from '@/components/help/ManualCardContext';
import {
  parseManualEntryHref,
  type ManualAction,
  type ManualAudience,
  type ManualPlate,
} from '@/lib/help/content';
export type ManualEntryLabels = {
  referenceLabel: string;
  referenceAria: string;
  /** Use `{label}` placeholder for named plates. */
  referenceAriaNamed: string;
};

const primaryActionClass =
  'inline-flex h-9 items-center px-3.5 rounded-[8px] bg-[var(--page-fg)] text-[var(--page-bg)] font-sans text-[13px] font-semibold tracking-tight hover:opacity-90 transition-opacity print:hidden';

const pagerBtnClass =
  'inline-flex items-center justify-center size-9 rounded-[8px] text-page-faint hover:text-page hover:bg-[color-mix(in_srgb,var(--page-fg)_6%,transparent)] transition-colors bg-transparent border-0 p-0 cursor-pointer print:hidden disabled:opacity-25 disabled:pointer-events-none';

const inlineLinkClass =
  'text-page underline underline-offset-2 decoration-[color-mix(in_srgb,var(--page-fg)_30%,transparent)] hover:decoration-[color-mix(in_srgb,var(--page-fg)_55%,transparent)]';

/**
 * Account routes need an active Bureaux seat.
 * Members keep `/account/…`; guests go to Join in the Manual.
 */
function resolveManualHref(href: string, audience: ManualAudience): string {
  if (audience === 'guest' && href.startsWith('/account/')) {
    return '/manual/join';
  }
  return href;
}

function ManualHref({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: React.ReactNode;
}) {
  const { onNavigateEntry } = useManualCard();
  const manualSlug = parseManualEntryHref(href);

  if (manualSlug && onNavigateEntry) {
    return (
      <a
        href={href}
        className={className}
        onClick={(e) => {
          e.preventDefault();
          onNavigateEntry(manualSlug);
        }}
      >
        {children}
      </a>
    );
  }

  if (href.startsWith('clipboard:')) {
    return (
      <ManualCopyEmailButton
        href={href}
        label={typeof children === 'string' ? children : 'Write in'}
        className={className}
      />
    );
  }

  if (href.startsWith('mailto:')) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

/** Render Manual copy with optional `[label](/path)` links. */
function ManualInline({
  text,
  audience = 'guest',
}: {
  text: string;
  audience?: ManualAudience;
}) {
  const nodes: React.ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    const href = resolveManualHref(match[2], audience);
    nodes.push(
      <ManualHref
        key={`${match.index}-${href}`}
        href={href}
        className={inlineLinkClass}
      >
        {match[1]}
      </ManualHref>
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    nodes.push(text.slice(last));
  }
  return <>{nodes}</>;
}

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
      <ManualCopyEmailButton
        href={href}
        label={label || 'Write in'}
        className={className}
      />
    );
  }
  return (
    <ManualHref href={href} className={className}>
      {body}
    </ManualHref>
  );
}

function EntryPager() {
  const t = useTranslations('Help');
  const { pager, onNavigateEntry } = useManualCard();
  if (!pager || !onNavigateEntry) return null;
  if (!pager.prev && !pager.next) return null;

  return (
    <nav aria-label={t('pagerLabel')} className="inline-flex items-center gap-0.5">
      <button
        type="button"
        disabled={!pager.prev}
        onClick={() => pager.prev && onNavigateEntry(pager.prev.slug)}
        aria-label={
          pager.prev
            ? t('pagerPrevAria', { title: pager.prev.title })
            : undefined
        }
        className={pagerBtnClass}
      >
        <ArrowLeft size={16} strokeWidth={1.75} aria-hidden />
      </button>
      <button
        type="button"
        disabled={!pager.next}
        onClick={() => pager.next && onNavigateEntry(pager.next.slug)}
        aria-label={
          pager.next
            ? t('pagerNextAria', { title: pager.next.title })
            : undefined
        }
        className={pagerBtnClass}
      >
        <ArrowRight size={16} strokeWidth={1.75} aria-hidden />
      </button>
    </nav>
  );
}

function EntryActions({ actions }: { actions: ManualAction[] }) {
  if (actions.length === 0) {
    return <EntryPager />;
  }

  const buttons =
    actions.length === 1 ? (
      actions[0].href.startsWith('clipboard:') ? (
        <ManualCopyEmailButton
          href={actions[0].href}
          label={actions[0].label}
          className={primaryActionClass}
        />
      ) : (
        <ActionLink
          href={actions[0].href}
          label={actions[0].label}
          className={primaryActionClass}
        />
      )
    ) : (
      actions.map((action) => (
        <ActionLink
          key={action.href}
          href={action.href}
          label={action.label}
          className={primaryActionClass}
        />
      ))
    );

  return (
    <div className="self-start flex flex-wrap items-center gap-1.5">
      {buttons}
      <EntryPager />
    </div>
  );
}

/** Quiet media opener — thumb + visible View / caption. */
function PlateLinks({
  plates,
  labels,
}: {
  plates: ManualPlate[];
  labels: ManualEntryLabels;
}) {
  const { onOpenPlate } = useManualCard();
  if (!onOpenPlate || plates.length === 0) return null;
  return (
    <div className="flex flex-col gap-2 pt-0.5 print:hidden">
      {plates.map((plate, index) => {
        const caption = plate.label || labels.referenceLabel;
        const aria = plate.label
          ? labels.referenceAriaNamed.replace('{label}', plate.label)
          : labels.referenceAria;
        return (
          <button
            key={`${plate.src}-${index}`}
            type="button"
            onClick={() => onOpenPlate(index)}
            aria-label={aria}
            className="group self-start inline-flex items-center gap-2.5 bg-transparent border-0 p-0 cursor-pointer"
          >
            <span className="relative block h-8 w-11 shrink-0 overflow-hidden rounded-[4px] bg-page-chip ring-1 ring-[color-mix(in_srgb,var(--page-fg)_12%,transparent)] group-hover:ring-[color-mix(in_srgb,var(--page-fg)_28%,transparent)] transition-[box-shadow,ring-color]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={plate.src}
                alt=""
                className="h-full w-full object-cover"
              />
            </span>
            <span className="flex flex-col items-start gap-0.5 min-w-0">
              <span className="font-sans text-[13px] font-semibold tracking-tight text-page leading-none group-hover:opacity-80 transition-opacity">
                {labels.referenceLabel}
              </span>
              {plate.label ? (
                <span className="font-sans text-[12px] font-medium text-page-faint leading-none tracking-tight">
                  {caption}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}


export { ManualInline, EntryActions, PlateLinks };
