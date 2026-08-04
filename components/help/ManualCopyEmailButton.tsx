'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';

const CONTACT_EMAIL = 'control@fjorr.com';

/** Soft contact — copies email instead of opening mailto. */
export default function ManualCopyEmailButton({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  const t = useTranslations('Nav');
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(CONTACT_EMAIL);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 3500);
        } catch (err) {
          console.error('Clipboard copy failed:', err);
        }
      }}
      className={className}
    >
      {copied ? t('emailCopied') : label}
    </button>
  );
}
