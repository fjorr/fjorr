'use client';

import React, { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import AccountViewportSwitch from '@/components/AccountViewportSwitch';
import type {
  NominationKind,
  NominationRow,
  NominationStatus,
} from '@/lib/nomination-actions';
import { nominationRefCode } from '@/lib/nomination-ref';

function formatNomDate(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, {
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
    <span className="inline-flex items-center rounded-[5px] bg-page-chip px-2.5 py-1 font-sans text-[13px] font-medium tracking-normal text-page">
      {label}
    </span>
  );
}

function RowPlus() {
  return (
    <svg
      className="w-3.5 h-3.5 shrink-0 text-page-faint"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function CloseButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      aria-label={label}
      className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full text-page-muted hover:text-page hover:bg-[color-mix(in_srgb,var(--page-fg)_8%,transparent)] transition-colors"
    >
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        aria-hidden
      >
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    </button>
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
      <span className="font-sans text-[13px] font-semibold normal-case tracking-normal text-page-muted leading-none">
        {label}
      </span>
      <div className="font-sans text-[16px] font-medium text-page leading-relaxed whitespace-pre-wrap">
        {children}
      </div>
    </div>
  );
}

/** Long-form fields only — row meta lives in the open card strip. */
function NominationExpanded({ entry }: { entry: NominationRow }) {
  const t = useTranslations('Account');
  const tNom = useTranslations('Nominate');
  const [copied, setCopied] = useState(false);
  const ref = nominationRefCode(entry.id);

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
    <div className="w-full max-w-[550px] flex flex-col gap-5">
      <div className="flex flex-col gap-5">
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
              onClick={(e) => e.stopPropagation()}
              className="text-page underline underline-offset-2 break-all hover:opacity-80"
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

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          void copyRef();
        }}
        className="self-start font-sans text-[13px] font-medium text-page-muted hover:text-page transition-colors tabular-nums"
      >
        {copied ? t('nominationRefCopied') : ref}
      </button>
    </div>
  );
}

function NominationOpenCard({
  entry,
  onClose,
  closeLabel,
}: {
  entry: NominationRow;
  onClose: () => void;
  closeLabel: string;
}) {
  const t = useTranslations('Account');
  const locale = useLocale();
  const date = formatNomDate(entry.created_at, locale);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClose();
        }
      }}
      className="relative rounded-[12px] bg-page-chip p-10 flex flex-col gap-5 cursor-pointer text-left"
    >
      <div className="absolute top-4 right-4">
        <CloseButton onClick={onClose} label={closeLabel} />
      </div>
      <div className="min-w-0 flex flex-wrap items-center gap-x-3 gap-y-2 pr-8">
        <StatusStamp label={t(statusKey(entry.status))} />
        <span className="font-sans text-[13px] text-page-muted">
          {t(kindKey(entry.kind))}
        </span>
        <span className="font-sans text-[13px] text-page-muted">{date}</span>
        {entry.bounty_title ? (
          <span className="font-sans text-[13px] text-page-muted truncate">
            {entry.bounty_title}
          </span>
        ) : null}
      </div>
      <NominationExpanded entry={entry} />
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
  const locale = useLocale();
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
          {t('nominationsEmpty')}
        </p>
      ) : (
        <AccountViewportSwitch
          mobile={
            <ul className="flex flex-col border-y border-page-faint list-none m-0 p-0">
              {nominations.map((entry, i) => {
                const date = formatNomDate(entry.created_at, locale);
                const ref = nominationRefCode(entry.id);
                const open = openId === entry.id;
                const nextOpen =
                  i < nominations.length - 1 &&
                  nominations[i + 1].id === openId;
                return (
                  <li
                    key={entry.id}
                    className={`py-1.5${
                      !open && !nextOpen && i < nominations.length - 1
                        ? ' border-b border-page-faint'
                        : ''
                    }`}
                  >
                    {open ? (
                      <NominationOpenCard
                        entry={entry}
                        onClose={() => setOpenId(null)}
                        closeLabel={t('close')}
                      />
                    ) : (
                      <div
                        role="button"
                        tabIndex={0}
                        aria-expanded={false}
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
                          <p className="font-sans text-[13px] font-medium text-page leading-snug min-w-0">
                            {pitchLabel(entry)}
                          </p>
                          <span className="shrink-0 font-sans text-[13px] text-page-muted tabular-nums">
                            {ref}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusStamp
                            label={t(statusKey(entry.status))}
                          />
                          <span className="min-w-0 flex-1 font-sans text-[13px] text-page-muted truncate">
                            {date}
                            {' · '}
                            {t(kindKey(entry.kind))}
                            {entry.bounty_title
                              ? ` · ${entry.bounty_title}`
                              : ''}
                          </span>
                          <RowPlus />
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          }
          desktop={
            <div className="w-full">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr
                    className={
                      nominations[0] && openId === nominations[0].id
                        ? undefined
                        : 'border-b border-page-faint'
                    }
                  >
                    <th className="pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-page-faint">
                      {t('nominationsColPitch')}
                    </th>
                    <th className="w-[1%] whitespace-nowrap pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-page-faint">
                      {t('nominationsColStatus')}
                    </th>
                    <th className="w-[1%] whitespace-nowrap pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-page-faint">
                      {t('nominationsColDate')}
                    </th>
                    <th className="w-[1%] whitespace-nowrap pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-page-faint">
                      {t('nominationsColKind')}
                    </th>
                    <th className="hidden lg:table-cell w-[18%] pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-page-faint">
                      {t('nominationsColBounty')}
                    </th>
                    <th className="w-[1%] whitespace-nowrap pb-2.5 pr-3 font-sans text-[11px] font-medium text-page-faint">
                      {t('nominationsColRef')}
                    </th>
                    <th
                      className="w-[1%] whitespace-nowrap pb-2.5 pl-1"
                      aria-hidden
                    />
                  </tr>
                </thead>
                <tbody>
                  {nominations.map((entry, i) => {
                    const date = formatNomDate(entry.created_at, locale);
                    const ref = nominationRefCode(entry.id);
                    const open = openId === entry.id;
                    const nextOpen =
                      i < nominations.length - 1 &&
                      nominations[i + 1].id === openId;
                    return open ? (
                      <tr key={entry.id}>
                        <td colSpan={7} className="py-2">
                          <NominationOpenCard
                            entry={entry}
                            onClose={() => setOpenId(null)}
                            closeLabel={t('close')}
                          />
                        </td>
                      </tr>
                    ) : (
                      <tr
                        key={entry.id}
                        className={`${
                          nextOpen ? '' : 'border-b border-page-faint '
                        }hover:bg-page-chip transition-colors cursor-pointer`}
                        onClick={() => toggle(entry.id)}
                        aria-expanded={false}
                      >
                        <td className="py-3.5 pr-4 xl:pr-6 align-middle min-w-0">
                          <span className="font-sans text-[13px] font-medium text-page truncate block max-w-md">
                            {pitchLabel(entry)}
                          </span>
                        </td>
                        <td className="w-[1%] whitespace-nowrap py-3.5 pr-4 xl:pr-6 align-middle text-left">
                          <StatusStamp
                            label={t(statusKey(entry.status))}
                          />
                        </td>
                        <td className="w-[1%] whitespace-nowrap py-3.5 pr-4 xl:pr-6 align-middle">
                          <span className="font-sans text-[13px] text-page-muted">
                            {date}
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
                        <td className="w-[1%] whitespace-nowrap py-3.5 pr-3 align-middle">
                          <span className="font-sans text-[13px] text-page-muted tabular-nums">
                            {ref}
                          </span>
                        </td>
                        <td className="w-[1%] whitespace-nowrap py-3.5 pl-1 align-middle">
                          <RowPlus />
                        </td>
                      </tr>
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
