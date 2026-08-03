'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import AccountViewportSwitch from '@/components/AccountViewportSwitch';
import type {
  CabinetOfferRow,
  CabinetOfferStatus,
  CabinetScoutKind,
} from '@/lib/cabinet-offer-actions';

function formatOfferDate(iso: string, style: 'short' | 'monthDay' = 'short') {
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

function statusKey(status: CabinetOfferStatus) {
  switch (status) {
    case 'member':
      return 'cabinetStatusMember' as const;
    case 'paused':
      return 'cabinetStatusPaused' as const;
    case 'prospect':
    default:
      return 'cabinetStatusReceived' as const;
  }
}

function kindKey(kind: CabinetScoutKind) {
  return kind === 'suggest' ? 'cabinetKindSuggest' : 'cabinetKindOffer';
}

const DISCIPLINE_KEYS = [
  'archivists',
  'cinematographers',
  'composers',
  'curators',
  'directors',
  'editors',
  'producers',
  'researchers',
  'sound designers',
  'writers',
  'other',
] as const;

function disciplineLabel(
  discipline: string,
  tCab: (key: `offerDisciplines.${(typeof DISCIPLINE_KEYS)[number]}`) => string
) {
  if ((DISCIPLINE_KEYS as readonly string[]).includes(discipline)) {
    return tCab(
      `offerDisciplines.${discipline as (typeof DISCIPLINE_KEYS)[number]}`
    );
  }
  return discipline;
}

function StatusStamp({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-[5px] bg-page-chip px-2 py-[3px] font-mono text-[11px] font-medium tracking-[0.04em] text-page">
      {label}
    </span>
  );
}

/** Quiet account ledger — names this member put forward. No notes, no CRM. */
export default function CabinetOffersLedger({
  offers,
  omitHeader = false,
}: {
  offers: CabinetOfferRow[];
  omitHeader?: boolean;
}) {
  const t = useTranslations('Account');
  const tCab = useTranslations('Cabinet');

  return (
    <section className="w-full flex flex-col gap-6 text-left">
      {!omitHeader ? (
        <div className="flex flex-col gap-1.5">
          <h2 className="font-sans text-[12px] font-semibold uppercase tracking-wide text-page-faint">
            {t('cabinetTitle')}
          </h2>
          <p className="font-sans text-[13px] text-page-faint leading-snug max-w-2xl">
            {t('cabinetBody')}
          </p>
        </div>
      ) : null}

      {offers.length === 0 ? (
        <p className="font-sans text-[14px] text-page-faint leading-relaxed">
          {t('cabinetEmpty')}{' '}
          <Link
            href="/cabinet"
            className="text-page-muted underline underline-offset-2 hover:text-page transition-colors"
          >
            {t('cabinetEmptyCta')}
          </Link>
        </p>
      ) : (
        <AccountViewportSwitch
          mobile={
            <ul className="flex flex-col divide-y divide-page-faint border-y border-page-faint list-none m-0 p-0">
              {offers.map((entry) => {
                const date = formatOfferDate(entry.created_at, 'monthDay');
                return (
                  <li key={entry.id} className="py-3.5 flex flex-col gap-2">
                    <p className="font-sans text-[14px] font-semibold text-page leading-snug">
                      {entry.name}
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <StatusStamp label={t(statusKey(entry.status))} />
                      <span className="font-sans text-[11px] text-page-faint">
                        {date}
                        {' · '}
                        {disciplineLabel(entry.discipline, tCab)}
                        {' · '}
                        {t(kindKey(entry.kind))}
                      </span>
                    </div>
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
                    <th className="pb-2.5 pr-4 font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-page-faint">
                      {t('cabinetColDate')}
                    </th>
                    <th className="pb-2.5 pr-4 font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-page-faint">
                      {t('cabinetColName')}
                    </th>
                    <th className="pb-2.5 pr-4 font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-page-faint">
                      {t('cabinetColDiscipline')}
                    </th>
                    <th className="pb-2.5 pr-4 font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-page-faint">
                      {t('cabinetColKind')}
                    </th>
                    <th className="pb-2.5 font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-page-faint">
                      {t('cabinetColStatus')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-page-faint">
                  {offers.map((entry) => (
                    <tr key={entry.id}>
                      <td className="py-3.5 pr-4 align-middle whitespace-nowrap">
                        <span className="font-sans text-[13px] text-page-muted tabular-nums">
                          {formatOfferDate(entry.created_at)}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 align-middle">
                        <span className="font-sans text-[14px] font-semibold text-page">
                          {entry.name}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 align-middle">
                        <span className="font-sans text-[13px] text-page-muted">
                          {disciplineLabel(entry.discipline, tCab)}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 align-middle">
                        <span className="font-sans text-[13px] text-page-muted">
                          {t(kindKey(entry.kind))}
                        </span>
                      </td>
                      <td className="py-3.5 align-middle">
                        <StatusStamp label={t(statusKey(entry.status))} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          }
        />
      )}
    </section>
  );
}
