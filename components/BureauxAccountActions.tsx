'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import AccountUpdateDisplayName from '@/components/AccountUpdateDisplayName';
import AccountUpdateEmail from '@/components/AccountUpdateEmail';

const BureauxManage = dynamic(() => import('@/components/BureauxManage'), {
  ssr: false,
});

type Panel = 'name' | 'email' | 'card';

/**
 * Membership edits — segmented control (not the same language as cancel/delete).
 */
export default function BureauxAccountActions({
  currentName,
  currentEmail,
  showCardUpdate,
  returnPath = '/account/bureaux',
}: {
  currentName: string;
  currentEmail: string;
  showCardUpdate: boolean;
  returnPath?: string;
}) {
  const t = useTranslations('Account');
  const [panel, setPanel] = useState<Panel | null>(null);

  const tabs: { id: Panel; label: string }[] = [
    { id: 'name', label: t('displayName') },
    { id: 'email', label: t('email') },
    ...(showCardUpdate ? [{ id: 'card' as const, label: t('bureauxCard') }] : []),
  ];

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div
        role="tablist"
        aria-label={t('bureauxTitle')}
        className="flex items-center gap-0.5 rounded-full bg-black/[0.05] p-1"
      >
        {tabs.map((tab) => {
          const active = panel === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setPanel(active ? null : tab.id)}
              className={`rounded-full border-0 px-4 py-1.5 font-sans text-[13px] font-semibold transition-colors ${
                active
                  ? 'bg-white text-[#0B0B0C]'
                  : 'bg-transparent text-black/40 hover:text-black/60'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {panel === 'name' ? (
        <AccountUpdateDisplayName
          key="name"
          currentName={currentName}
          embedded
          onClose={() => setPanel(null)}
        />
      ) : null}
      {panel === 'email' ? (
        <AccountUpdateEmail
          key="email"
          currentEmail={currentEmail}
          embedded
          onClose={() => setPanel(null)}
        />
      ) : null}
      {panel === 'card' && showCardUpdate ? (
        <BureauxManage
          key="card"
          returnPath={returnPath}
          embedded
          onClose={() => setPanel(null)}
        />
      ) : null}
    </div>
  );
}
