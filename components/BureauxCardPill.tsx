'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

const BureauxManage = dynamic(() => import('@/components/BureauxManage'), {
  ssr: false,
});

const PILL =
  'flex h-12 w-full items-center rounded-full bg-[#F5F5F7] pl-8 pr-2 text-left';
const CIRCLE =
  'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#0B0B0C] bg-transparent text-[#0B0B0C] transition-opacity hover:opacity-60';

/** Card on file. The circle opens the card update. */
export default function BureauxCardPill({
  label,
  value,
  returnPath = '/account/bureaux',
}: {
  label: string;
  value: string;
  returnPath?: string;
}) {
  const t = useTranslations('Account');
  const [session, setSession] = useState(0);
  const open = session > 0;

  return (
    <div className="flex w-full flex-col gap-3">
      <div className={PILL}>
        <span className="shrink-0 font-sans text-[16px] font-medium text-black/35">
          {label}
        </span>
        <span className="min-w-0 flex-1 truncate px-3 font-sans text-[16px] font-medium tabular-nums text-[#0B0B0C]">
          {value}
        </span>
        <button
          type="button"
          onClick={() => (open ? setSession(0) : setSession((n) => n + 1))}
          aria-label={open ? t('bureauxCardCancel') : t('bureauxUpdateCard')}
          className={CIRCLE}
        >
          <Plus
            className={`h-3 w-3 transition-transform duration-200 ease-out ${
              open ? 'rotate-45' : ''
            }`}
            strokeWidth={2.25}
            aria-hidden
          />
        </button>
      </div>
      {open ? (
        <BureauxManage key={session} embedded returnPath={returnPath} />
      ) : null}
    </div>
  );
}
