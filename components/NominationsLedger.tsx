'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
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
    <span className="inline-flex items-center rounded-[5px] bg-[color-mix(in_srgb,white_9%,transparent)] px-2 py-[3px] font-mono text-[11px] font-medium tracking-[0.04em] text-white/90">
      {label}
    </span>
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
    <div className="flex flex-col gap-1 text-left">
      <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-white/35">
        {label}
      </span>
      <div className="font-sans text-[14px] text-white/80 leading-relaxed whitespace-pre-wrap">
        {children}
      </div>
    </div>
  );
}

function NominationExpanded({
  entry,
  onClose,
}: {
  entry: NominationRow;
  onClose: () => void;
}) {
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
    <div className="w-full max-w-3xl pt-1 pb-5 flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => void copyRef()}
          className="font-mono text-[12px] font-medium tracking-[0.06em] text-white/55 hover:text-white/80 transition-colors tabular-nums"
        >
          {copied ? t('nominationRefCopied') : ref}
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('nominationDetailClose')}
          className="font-mono text-[16px] leading-none text-white/35 hover:text-white/70 bg-transparent border-0 outline-none cursor-pointer p-0 transition-colors select-none"
        >
          ×
        </button>
      </div>

      <div className="flex flex-col gap-5">
        <DetailField label={t('nominationsColDate')}>{date}</DetailField>
        <DetailField label={t('nominationsColKind')}>
          {t(kindKey(entry.kind))}
        </DetailField>
        <DetailField label={t('nominationsColStatus')}>
          <StatusStamp label={t(statusKey(entry.status))} />
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
              className="text-white/70 underline underline-offset-2 break-all hover:text-white"
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
          <h2 className="font-sans text-[12px] font-semibold uppercase tracking-wide text-white/35">
            {t('nominationsTitle')}
          </h2>
          <p className="font-sans text-[13px] text-white/40 leading-snug max-w-2xl">
            {t('nominationsBody')}
          </p>
        </div>
      ) : null}

      {nominations.length === 0 ? (
        <p className="font-sans text-[14px] text-white/45 leading-relaxed">
          {t('nominationsEmpty')}{' '}
          <Link
            href="/nominate"
            className="text-white/70 underline underline-offset-2 hover:text-white transition-colors"
          >
            {t('nominationsEmptyCta')}
          </Link>
        </p>
      ) : (
        <>
          {/* Mobile */}
          <ul className="md:hidden flex flex-col divide-y divide-white/10 border-y border-white/10 list-none m-0 p-0">
            {nominations.map((entry) => {
              const date = formatNomDate(entry.created_at, 'monthDay');
              const ref = nominationRefCode(entry.id);
              const open = openId === entry.id;
              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => toggle(entry.id)}
                    aria-expanded={open}
                    className={`w-full py-3.5 flex flex-col gap-2 text-left transition-colors ${
                      open ? 'bg-white/[0.02]' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-sans text-[13px] font-semibold text-white/90 leading-snug min-w-0">
                        {pitchLabel(entry)}
                      </p>
                      <span className="shrink-0 font-mono text-[11px] text-white/35 tabular-nums">
                        {ref}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusStamp label={t(statusKey(entry.status))} />
                      <span className="font-sans text-[11px] text-white/40">
                        {date}
                        {' · '}
                        {t(kindKey(entry.kind))}
                        {entry.bounty_title
                          ? ` · ${entry.bounty_title}`
                          : ''}
                      </span>
                    </div>
                  </button>
                  {open ? (
                    <NominationExpanded
                      entry={entry}
                      onClose={() => setOpenId(null)}
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>

          {/* Desktop */}
          <div className="hidden md:block w-full">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="w-[1%] whitespace-nowrap pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-white/35">
                    {t('nominationsColDate')}
                  </th>
                  <th className="w-[1%] whitespace-nowrap pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-white/35">
                    {t('nominationsColRef')}
                  </th>
                  <th className="pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-white/35">
                    {t('nominationsColPitch')}
                  </th>
                  <th className="w-[1%] whitespace-nowrap pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-white/35">
                    {t('nominationsColKind')}
                  </th>
                  <th className="hidden lg:table-cell w-[18%] pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-white/35">
                    {t('nominationsColBounty')}
                  </th>
                  <th className="w-[1%] whitespace-nowrap pb-2.5 font-sans text-[11px] font-medium text-white/35">
                    {t('nominationsColStatus')}
                  </th>
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
                        className={`border-b border-white/10 transition-colors cursor-pointer ${
                          open
                            ? 'bg-white/[0.02]'
                            : 'hover:bg-white/[0.02]'
                        }`}
                        onClick={() => toggle(entry.id)}
                        aria-expanded={open}
                      >
                        <td className="w-[1%] whitespace-nowrap py-3.5 pr-4 xl:pr-6 align-middle">
                          <span className="font-sans text-[13px] text-white/55">
                            {date}
                          </span>
                        </td>
                        <td className="w-[1%] whitespace-nowrap py-3.5 pr-4 xl:pr-6 align-middle">
                          <span className="font-mono text-[12px] text-white/45 tabular-nums tracking-[0.04em]">
                            {ref}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4 xl:pr-6 align-middle min-w-0">
                          <span className="font-sans text-[13px] font-medium text-white/85 truncate block max-w-md">
                            {pitchLabel(entry)}
                          </span>
                        </td>
                        <td className="w-[1%] whitespace-nowrap py-3.5 pr-4 xl:pr-6 align-middle">
                          <span className="font-sans text-[13px] text-white/50">
                            {t(kindKey(entry.kind))}
                          </span>
                        </td>
                        <td className="hidden lg:table-cell py-3.5 pr-4 xl:pr-6 align-middle min-w-0">
                          <span className="font-sans text-[13px] text-white/50 truncate block">
                            {entry.bounty_title || '—'}
                          </span>
                        </td>
                        <td className="w-[1%] whitespace-nowrap py-3.5 align-middle">
                          <StatusStamp label={t(statusKey(entry.status))} />
                        </td>
                      </tr>
                      {open ? (
                        <tr className="border-b border-white/10 bg-white/[0.015]">
                          <td colSpan={6} className="px-0 pt-2 pb-0">
                            <NominationExpanded
                              entry={entry}
                              onClose={() => setOpenId(null)}
                            />
                          </td>
                        </tr>
                      ) : null}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
