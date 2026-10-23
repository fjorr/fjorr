'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import SheetEnter from '@/components/house/SheetEnter';

export type AccountRecord = {
  id: string;
  title: string;
  meta: string;
  stamp?: string;
  href?: string;
  body?: string;
};

function RecordPill({ record }: { record: AccountRecord }) {
  const [open, setOpen] = useState(false);
  const story = record.body?.trim() ?? '';
  const className = open
    ? `flex w-full flex-col gap-4 rounded-[22px] bg-[#F5F5F7] py-5 pr-6 text-left text-[#0B0B0C] sm:pr-7 ${
        story ? 'pl-9 sm:pl-10' : 'px-6 sm:px-7'
      }`
    : `flex h-16 w-full items-center rounded-full bg-[#F5F5F7] pr-2 text-left text-[#0B0B0C] sm:pr-2.5 ${
        story ? 'pl-9 sm:pl-10' : 'pl-6 sm:pl-7'
      }`;
  const plus = story ? (
    <span
      aria-hidden
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#0B0B0C] text-[#0B0B0C]"
    >
      <Plus
        className={`h-2.5 w-2.5 transition-transform duration-200 ease-out motion-reduce:transition-none ${
          open ? 'rotate-45' : ''
        }`}
        strokeWidth={2}
      />
    </span>
  ) : null;
  const body = (
    <>
      <span className="flex min-w-0 w-full items-center gap-3">
        {plus}
        <span className="flex min-w-0 flex-1 items-baseline gap-2.5">
          <span className="truncate font-sans text-[15px] font-semibold tracking-tight text-[#0B0B0C] sm:text-[16px]">
            {record.title}
          </span>
          {record.meta ? (
            <span className="shrink-0 font-sans text-[13px] font-medium text-black/40 sm:text-[14px]">
              {record.meta}
            </span>
          ) : null}
        </span>
        {record.stamp ? (
          <span className="inline-flex h-11 shrink-0 items-center justify-center truncate rounded-full bg-white px-4 font-sans text-[13px] font-semibold leading-none text-[#0B0B0C]">
            {record.stamp}
          </span>
        ) : null}
      </span>
      {open && story ? (
        <p className="m-0 whitespace-pre-wrap text-left font-sans text-[15px] font-medium leading-relaxed text-black/70">
          {story}
        </p>
      ) : null}
    </>
  );

  if (story) {
    return (
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`${className} border-0 transition-opacity duration-200 hover:opacity-80`}
      >
        {body}
      </button>
    );
  }

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
