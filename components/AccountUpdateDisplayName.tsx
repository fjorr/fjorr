'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { saveOwnDisplayName } from '@/lib/profile-actions';

const FIELD_LABEL =
  'font-sans text-[13px] font-semibold normal-case tracking-normal text-page-muted';

const PILL =
  'self-start h-11 px-5 rounded-full bg-white text-black font-sans text-[13px] font-semibold hover:bg-white/90 disabled:opacity-40 transition-colors';

export default function AccountUpdateDisplayName({
  currentName,
  onOpen,
  onClose,
}: {
  currentName: string;
  onOpen?: () => void;
  onClose?: () => void;
}) {
  const t = useTranslations('Account');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setError(null);
          setName(currentName);
          setOpen(true);
          onOpen?.();
        }}
        className={PILL}
      >
        {t('updateDisplayName')}
      </button>
    );
  }

  return (
    <form
      className="basis-full w-full max-w-md flex flex-col gap-3 items-start"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        setPending(true);
        void (async () => {
          const result = await saveOwnDisplayName({ displayName: name });
          setPending(false);
          if (!result.ok) {
            setError(result.error || t('errorGeneric'));
            return;
          }
          setOpen(false);
          onClose?.();
          router.refresh();
        })();
      }}
    >
      <label className="w-full flex flex-col gap-2">
        <span className={FIELD_LABEL}>{t('displayName')}</span>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('displayNamePlaceholder')}
          disabled={pending}
          maxLength={80}
          autoComplete="name"
          className="w-full h-11 rounded-[10px] bg-page-chip px-4 font-sans text-[15px] text-page placeholder:text-page-faint focus:outline-none disabled:opacity-50"
        />
      </label>
      {error ? (
        <p className="font-sans text-[13px] text-red-400/90">{error}</p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending || !name.trim()}
          className="h-11 px-5 rounded-full bg-[var(--page-fg)] text-[var(--page-bg)] font-sans text-[13px] font-bold hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          {pending ? t('saving') : t('save')}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setOpen(false);
            setError(null);
            setName(currentName);
            onClose?.();
          }}
          className="h-11 px-5 rounded-full border border-page-faint font-sans text-[13px] font-semibold text-page-muted hover:text-page disabled:opacity-40 transition-colors"
        >
          {t('updateDisplayNameCancel')}
        </button>
      </div>
    </form>
  );
}
