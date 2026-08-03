'use client';

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import AccountViewportSwitch from '@/components/AccountViewportSwitch';
import type {
  CabinetOfferRow,
  CabinetOfferStatus,
} from '@/lib/cabinet-offer-actions';

function formatOfferDate(iso: string, locale: string) {
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
    <span className="inline-flex items-center rounded-[5px] bg-page-chip px-2.5 py-1 font-sans text-[13px] font-medium tracking-normal text-page">
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
  const locale = useLocale();

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
          {t('cabinetEmpty')}
        </p>
      ) : (
        <AccountViewportSwitch
          mobile={
            <ul className="flex flex-col divide-y divide-page-faint border-y border-page-faint list-none m-0 p-0">
              {offers.map((entry) => {
                const date = formatOfferDate(entry.created_at, locale);
                return (
                  <li key={entry.id} className="py-3.5 flex flex-col gap-2">
                    <p className="font-sans text-[13px] font-medium text-page leading-snug min-w-0">
                      {entry.name}
                    </p>
                    <div className="flex items-center gap-3">
                      <StatusStamp label={t(statusKey(entry.status))} />
                      <span className="min-w-0 flex-1 font-sans text-[13px] text-page-muted truncate">
                        {date}
                        {' · '}
                        {disciplineLabel(entry.discipline, tCab)}
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
                    <th className="pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-page-faint">
                      {t('cabinetColName')}
                    </th>
                    <th className="w-[1%] whitespace-nowrap pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-page-faint">
                      {t('cabinetColStatus')}
                    </th>
                    <th className="w-[1%] whitespace-nowrap pb-2.5 pr-4 xl:pr-6 font-sans text-[11px] font-medium text-page-faint">
                      {t('cabinetColDate')}
                    </th>
                    <th className="pb-2.5 font-sans text-[11px] font-medium text-page-faint">
                      {t('cabinetColDiscipline')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-page-faint"
                    >
                      <td className="py-3.5 pr-4 xl:pr-6 align-middle min-w-0">
                        <span className="font-sans text-[13px] font-medium text-page truncate block max-w-md">
                          {entry.name}
                        </span>
                      </td>
                      <td className="w-[1%] whitespace-nowrap py-3.5 pr-4 xl:pr-6 align-middle text-left">
                        <StatusStamp label={t(statusKey(entry.status))} />
                      </td>
                      <td className="w-[1%] whitespace-nowrap py-3.5 pr-4 xl:pr-6 align-middle">
                        <span className="font-sans text-[13px] text-page-muted">
                          {formatOfferDate(entry.created_at, locale)}
                        </span>
                      </td>
                      <td className="py-3.5 align-middle min-w-0">
                        <span className="font-sans text-[13px] text-page-muted truncate block">
                          {disciplineLabel(entry.discipline, tCab)}
                        </span>
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
