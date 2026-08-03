'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import AccountUpdateDisplayName from '@/components/AccountUpdateDisplayName';
import AccountUpdateEmail from '@/components/AccountUpdateEmail';

const BureauxManage = dynamic(() => import('@/components/BureauxManage'), {
  ssr: false,
});

/** Update name / email / card — only one form open at a time. */
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
  const [panel, setPanel] = useState<'none' | 'name' | 'email' | 'card'>('none');

  return (
    <div className="flex flex-wrap items-start gap-3">
      {panel === 'none' || panel === 'name' ? (
        <AccountUpdateDisplayName
          currentName={currentName}
          onOpen={() => setPanel('name')}
          onClose={() => setPanel('none')}
        />
      ) : null}
      {panel === 'none' || panel === 'email' ? (
        <AccountUpdateEmail
          currentEmail={currentEmail}
          onOpen={() => setPanel('email')}
          onClose={() => setPanel('none')}
        />
      ) : null}
      {showCardUpdate && (panel === 'none' || panel === 'card') ? (
        <BureauxManage
          returnPath={returnPath}
          onOpen={() => setPanel('card')}
          onClose={() => setPanel('none')}
        />
      ) : null}
    </div>
  );
}
