'use client';

import React from 'react';
import { Link } from '@/i18n/navigation';
import SheetEnter from '@/components/house/SheetEnter';

export type AccountRecord = {
  id: string;
  title: string;
  meta: string;
  stamp: string;
  href?: string;
};

function RecordPill({ record }: { record: AccountRecord }) {
  const className =
    'flex h-16 w-full items-center gap-4 rounded-full bg-[#F5F5F7] pl-6 pr-2 text-[#0B0B0C] sm:pl-7 sm:pr-2.5';
  const body = (
    <>
      <span className="flex min-w-0 flex-1 items-baseline gap-2.5">
        <span className="truncate text-left font-sans text-[15px] font-semibold tracking-tight text-[#0B0B0C] sm:text-[16px]">
          {record.title}
        </span>
        {record.meta ? (
          <span className="shrink-0 font-sans text-[13px] font-medium text-black/40 sm:text-[14px]">
            {record.meta}
          </span>
        ) : null}
      </span>
      <span className="inline-flex h-11 max-w-[46%] shrink-0 items-center justify-center truncate rounded-full bg-white px-4 font-sans text-[13px] font-semibold leading-none text-[#0B0B0C]">
        {record.stamp}
      </span>
    </>
  );

  if (!record.href) {
    return <div className={className}>{body}</div>;
  }

  return (
    <Link
      href={record.href}
      className={`${className} transition-opacity duration-200 hover:opacity-70`}
    >
      {body}
    </Link>
  );
}

export default function AccountRecordBoard({
  title,
  lead,
  empty,
  emptyCta,
  emptyHref,
  actionLabel,
  actionHref,
  records,
}: {
  title: string;
  lead: string;
  empty: string;
  emptyCta: string;
  emptyHref: string;
  actionLabel?: string;
  actionHref?: string;
  records: AccountRecord[];
}) {
  const pageHeader = (
    <header className="flex w-full flex-col items-center gap-3 text-center">
      <h1 className="m-0 select-none font-[family-name:var(--font-circular-black)] text-3xl font-[900] leading-[1.05] tracking-[-0.03em] text-[#0B0B0C] sm:text-4xl">
        {title}
      </h1>
      <p className="m-0 max-w-[28rem] font-sans text-[16px] font-medium leading-relaxed text-black/45">
        {lead}
      </p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-2 inline-flex h-10 items-center justify-center rounded-full bg-[#0B0B0C] px-5 font-sans text-[14px] font-semibold text-white transition-opacity hover:opacity-85"
        >
          {actionLabel}
        </Link>
      ) : null}
    </header>
  );

  if (records.length === 0) {
    return (
      <div className="flex w-full flex-col items-center gap-10">
        {pageHeader}
        <div className="flex flex-col items-center gap-6 py-6 text-center">
          <p className="m-0 max-w-[28ch] font-sans text-[16px] font-medium leading-relaxed text-black/45">
            {empty}
          </p>
          {actionHref && actionLabel ? null : (
            <Link
              href={emptyHref}
              className="inline-flex h-10 items-center justify-center rounded-full bg-[#0B0B0C] px-5 font-sans text-[14px] font-semibold text-white transition-opacity hover:opacity-85"
            >
              {emptyCta}
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-8">
      {pageHeader}
      <SheetEnter className="flex w-full max-w-[36rem] flex-col">
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0" aria-label={title}>
          {records.map((record) => (
            <li key={record.id}>
              <RecordPill record={record} />
            </li>
          ))}
        </ul>
      </SheetEnter>
    </div>
  );
}
