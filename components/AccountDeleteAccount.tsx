'use client';

import React, { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { deleteOwnAccount } from '@/lib/profile-actions';

/** Inline confirm delete — same pattern as Bureaux cancel. */
export default function AccountDeleteAccount() {
  const t = useTranslations('Account');
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const result = await deleteOwnAccount();
      if (!result.ok) {
        setDeleteError(result.error);
        setDeleting(false);
        return;
      }
      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : t('errorGeneric'));
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 items-start">
      {confirmDelete ? (
        <div className="flex flex-col gap-2 items-start">
          <p className="font-sans text-[13px] text-page-muted leading-snug">
            {t('deleteAccountConfirm')}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <button
              type="button"
              disabled={deleting}
              onClick={() => void handleDelete()}
              className="font-sans text-[13px] font-semibold text-page underline underline-offset-2 decoration-[color-mix(in_srgb,var(--page-fg)_25%,transparent)] hover:decoration-[color-mix(in_srgb,var(--page-fg)_45%,transparent)] disabled:opacity-40 transition-colors"
            >
              {deleting
                ? t('deleteAccountDeleting')
                : t('deleteAccountConfirmYes')}
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={() => {
                setConfirmDelete(false);
                setDeleteError(null);
              }}
              className="font-sans text-[13px] font-medium text-page-faint hover:text-page-muted disabled:opacity-40 transition-colors"
            >
              {t('deleteAccountConfirmNo')}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={deleting}
          onClick={() => {
            setDeleteError(null);
            setConfirmDelete(true);
          }}
          className="self-start font-sans text-[13px] font-medium text-page-muted underline underline-offset-2 decoration-[color-mix(in_srgb,var(--page-fg)_25%,transparent)] hover:text-page hover:decoration-[color-mix(in_srgb,var(--page-fg)_45%,transparent)] disabled:opacity-40 transition-colors"
        >
          {t('deleteAccount')}
        </button>
      )}
      <p className="font-sans text-[12px] text-page-faint leading-snug max-w-md">
        {t('deleteAccountHint')}
      </p>
      {deleteError ? (
        <p className="font-sans text-[13px] text-red-400/90 text-left">
          {deleteError}
        </p>
      ) : null}
    </div>
  );
}
