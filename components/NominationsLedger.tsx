'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import AccountViewportSwitch from '@/components/AccountViewportSwitch';
import type {
  NominationKind,
  NominationRow,
  NominationStatus,
} from '@/lib/nomination-actions';
import { nominationRefCode } from '@/lib/nomination-ref';

function formatNomDate(iso: string, style: 'short' | 'monthDay' = 'short') {
  try {
    if (style === 'monthDay') {
      return new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
      }).format(new Date(iso));
    }
    return new Intl.DateTimeFormat('en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

function statusKey(status: NominationStatus) {
  switch (status) {
    case 'received':
      return 'statusReceived';
    case 'in_review':
      return 'statusInReview';
    case 'shortlisted':
      return 'statusShortlisted';
    case 'passed':
      return 'statusPassed';
    case 'in_production':
      return 'statusInProduction';
    case 'released':
      return 'statusReleased';
    default:
      return 'statusReceived';
  }
}

function kindKey(kind: NominationKind) {
  return kind === 'fiction' ? 'kindFiction' : 'kindTrue';
}

/** Prefer setting (when & where) — short enough for a ledger row. */
function pitchLabel(entry: NominationRow) {
  const setting = entry.setting?.trim();
  if (setting) return setting;
  const story = entry.story_details.trim().replace(/\s+/g, ' ');
  if (story.length <= 48) return story;
  return `${story.slice(0, 47).trimEnd()}…`;
}

function StatusStamp({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-[5px] bg-page-chip px-2 py-[3px] font-mono text-[11px] font-medium tracking-[0.04em] text-page">
      {label}
    </span>
  );
}

/** Down chevron; rotates up when the row is open. */
function AccordionChevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-3.5 h-3.5 shrink-0 text-page-faint transition-transform duration-200 ${
        open ? 'rotate-180' : 'rotate-0'
      }`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 text-left">
      <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-page-faint leading-none">
        {label}
      </span>
      <div className="font-sans text-[14px] text-page-muted leading-relaxed whitespace-pre-wrap">
        {children}
      </div>
    </div>
  );
}

function NominationExpanded({ entry }: { entry: NominationRow }) {
  const t = useTranslations('Account');
  const tNom = useTranslations('Nominate');
  const [copied, setCopied] = useState(false);
  const ref = nominationRefCode(entry.id);
  const date = formatNomDate(entry.created_at);

  useEffect(() => {
    setCopied(false);
  }, [entry.id]);

  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(ref);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="w-full max-w-[550px] pt-1 pb-5 flex flex-col gap-5">
      <button
        type="button"
        onClick={() => void copyRef()}
        className="self-start font-mono text-[12px] font-medium tracking-[0.06em] text-page-muted hover:text-page-muted transition-colors tabular-nums"
      >
        {copied ? t('nominationRefCopied') : ref}
      </button>

      <div className="flex flex-col gap-5">
        <DetailField label={t('nominationsColDate')}>{date}</DetailField>
        <DetailField label={t('nominationsColKind')}>
          {t(kindKey(entry.kind))}
        </DetailField>
        <DetailField label={t('nominationsColStatus')}>
          {t(statusKey(entry.status))}
        </DetailField>
        {entry.bounty_title ? (
          <DetailField label={t('nominationsColBounty')}>
            {entry.bounty_title}
          </DetailField>
        ) : null}
        <DetailField label={tNom('settingLabel')}>
          {entry.setting?.trim() || '—'}
        </DetailField>
        <DetailField label={tNom('storyLabel')}>
          {entry.story_details}
        </DetailField>
        {entry.why_fjorr?.trim() ? (
          <DetailField label={tNom('whyLabel')}>
            {entry.why_fjorr}
          </DetailField>
        ) : null}
        {entry.proof_or_premise?.trim() ? (
          <DetailField
            label={
              entry.kind === 'fiction'
                ? tNom('premiseLabel')
                : tNom('proofLabel')
            }
          >
            {entry.proof_or_premise}
          </DetailField>
        ) : null}
        {entry.proof_url?.trim() ? (
          <DetailField label={tNom('proofUrlLabel')}>
            <a
              href={entry.proof_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-page-muted underline underline-offset-2 break-all hover:text-page"
            >
              {entry.proof_url}
            </a>
          </DetailField>
        ) : null}
        {entry.status === 'passed' && entry.status_reason ? (
          <DetailField label={t('nominationStatusReason')}>
            {entry.status_reason}
          </DetailField>
        ) : null}
      </div>
    </div>
  );
}

export default function NominationsLedger({
  nominations,
  omitHeader = false,
}: {
  nominations: NominationRow[];
  /** When the page already shows title + body. */
  omitHeader?: boolean;
}) {
  const t = useTranslations('Account');
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (openId == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenId(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openId]);

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="w-full flex flex-col gap-6 text-left">
      {!omitHeader ? (
        <div className="flex flex-col gap-1.5">
          <h2 className="font-sans text-[12px] font-semibold uppercase tracking-wide text-page-faint">
            {t('nominationsTitle')}
          </h2>
          <p className="font-sans text-[13px] text-page-faint leading-snug max-w-2xl">
            {t('nominationsBody')}
          </p>
        </div>
      ) : null}

      {nominations.length === 0 ? (
        <p className="font-sans text-[14px] text-page-faint leading-relaxed">
          {t('nominationsEmpty')}{' '}
          <Link
            href="/nominate"
            className="text-page-muted underline underline-offset-2 hover:text-page transition-colors"
          >
            {t('nominationsEmptyCta')}
          </Link>
        </p>
      ) : (
        <AccountViewportSwitch
          mobile={
          <ul className="flex flex-col divide-y divide-page-faint border-y border-page-faint list-none m-0 p-0">
            {nominations.map((entry) => {
              const date = formatNomDate(entry.created_at, 'monthDay');
              const ref = nominationRefCode(entry.id);
              const open = openId === entry.id;
              return (
                <li key={entry.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    aria-expanded={open}
                    onClick={() => toggle(entry.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggle(entry.id);
                      }
                    }}
                    className="w-full py-3.5 flex flex-col gap-2 text-left cursor-pointer"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-sans text-[13px] font-semibold text-page leading-snug min-w-0">
                        {pitchLabel(entry)}
                      </p>
                      <span className="shrink-0 font-mono text-[11px] text-page-faint tabular-nums">
                        {ref}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusStamp label={t(statusKey(entry.status))} />
                      <span className="min-w-0 flex-1 font-sans text-[11px] text-page-faint truncate">
                        {date}
                        {' · '}
                        {t(kindKey(entry.kind))}
                        {entry.bounty_title
                          ? ` · ${entry.bounty_title}`
                          : ''}
                      </span>
                      <AccordionChevron open={open} />
                    </div>
                  </div>
                  {open ? <NominationExpanded entry={entry} /> : null}
                </li>
              );
            })}
          </ul>
          }
          desktop={
          <div className="w-full">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-page-faint">
                  <th className="w-[1%] whitespace-nowrap pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-page-faint">
                    {t('nominationsColDate')}
                  </th>
                  <th className="w-[1%] whitespace-nowrap pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-page-faint">
                    {t('nominationsColRef')}
                  </th>
                  <th className="pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-page-faint">
                    {t('nominationsColPitch')}
                  </th>
                  <th className="w-[1%] whitespace-nowrap pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-page-faint">
                    {t('nominationsColKind')}
                  </th>
                  <th className="hidden lg:table-cell w-[18%] pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-page-faint">
                    {t('nominationsColBounty')}
                  </th>
                  <th className="w-[1%] whitespace-nowrap pb-2.5 pr-3 font-sans text-[11px] font-medium text-page-faint">
                    {t('nominationsColStatus')}
                  </th>
                  <th
                    className="w-[1%] whitespace-nowrap pb-2.5 pl-1"
                    aria-hidden
                  />
                </tr>
              </thead>
              <tbody>
                {nominations.map((entry) => {
                  const date = formatNomDate(entry.created_at, 'monthDay');
                  const ref = nominationRefCode(entry.id);
                  const open = openId === entry.id;
                  return (
                    <React.Fragment key={entry.id}>
                      <tr
                        className="border-b border-page-faint hover:bg-page-chip transition-colors cursor-pointer"
                        onClick={() => toggle(entry.id)}
                        aria-expanded={open}
                      >
                        <td className="w-[1%] whitespace-nowrap py-3.5 pr-4 xl:pr-6 align-middle">
                          <span className="font-sans text-[13px] text-page-muted">
                            {date}
                          </span>
                        </td>
                        <td className="w-[1%] whitespace-nowrap py-3.5 pr-4 xl:pr-6 align-middle">
                          <span className="font-mono text-[12px] text-page-faint tabular-nums tracking-[0.04em]">
                            {ref}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4 xl:pr-6 align-middle min-w-0">
                          <span className="font-sans text-[13px] font-medium text-page truncate block max-w-md">
                            {pitchLabel(entry)}
                          </span>
                        </td>
                        <td className="w-[1%] whitespace-nowrap py-3.5 pr-4 xl:pr-6 align-middle">
                          <span className="font-sans text-[13px] text-page-muted">
                            {t(kindKey(entry.kind))}
                          </span>
                        </td>
                        <td className="hidden lg:table-cell py-3.5 pr-4 xl:pr-6 align-middle min-w-0">
                          <span className="font-sans text-[13px] text-page-muted truncate block">
                            {entry.bounty_title || '—'}
                          </span>
                        </td>
                        <td className="w-[1%] whitespace-nowrap py-3.5 pr-3 align-middle text-left">
                          <StatusStamp
                            label={t(statusKey(entry.status))}
                          />
                        </td>
                        <td className="w-[1%] whitespace-nowrap py-3.5 pl-1 align-middle">
                          <AccordionChevron open={open} />
                        </td>
                      </tr>
                      {open ? (
                        <tr className="border-b border-page-faint">
                          <td colSpan={7} className="px-0 pt-2 pb-0">
                            <NominationExpanded entry={entry} />
                          </td>
                        </tr>
                      ) : null}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          }
        />
      )}
    </section>
  );
}
