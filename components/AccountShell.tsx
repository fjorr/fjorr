import React from 'react';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';

/** Shared frame for own-account pages — dark, quiet, one job. */
export default async function AccountShell({
  children,
  showBack = false,
}: {
  children: React.ReactNode;
  showBack?: boolean;
}) {
  const t = await getTranslations('Account');

  return (
    <div className="w-full min-h-[70vh] bg-[#1F1F1F] flex flex-col items-center px-6 py-24 gap-10">
      {showBack ? (
        <div className="w-full max-w-sm">
          <Link
            href="/account"
            className="font-sans text-[13px] font-semibold text-white/40 hover:text-white/70 transition-colors"
          >
            {t('backToAccount')}
          </Link>
        </div>
      ) : null}
      {children}
    </div>
  );
}
