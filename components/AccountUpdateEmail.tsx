'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { updateOwnEmail } from '@/lib/profile-actions';

const FIELD_LABEL =
  'font-sans text-[13px] font-semibold normal-case tracking-normal text-page-muted';

const PILL =
  'self-start h-11 px-5 rounded-full bg-white text-black font-sans text-[13px] font-semibold hover:bg-white/90 disabled:opacity-40 transition-colors';

export default function AccountUpdateEmail({
  currentEmail,
  onOpen,
  onClose,
}: {
  currentEmail: string;
  onOpen?: () => void;
  onClose?: () => void;
}) {
  const t = useTranslations('Account');
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (sentTo) {
    return (
      <p className="font-sans text-[13px] text-page-muted leading-snug max-w-md">
        {t('updateEmailSent', { email: sentTo })}
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setError(null);
          setEmail('');
          setOpen(true);
          onOpen?.();
        }}
        className={PILL}
      >
        {t('updateEmail')}
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
          const result = await updateOwnEmail(email);
          setPending(false);
          if (!result.ok) {
            setError(t(`updateEmailError.${result.error}`));
            return;
          }
          setSentTo(email.trim().toLowerCase());
          setOpen(false);
          onClose?.();
        })();
      }}
    >
      <p className="font-sans text-[13px] text-page-muted leading-snug">
        {t('updateEmailHint')}
      </p>
      <label className="w-full flex flex-col gap-2">
        <span className={FIELD_LABEL}>{t('updateEmailLabel')}</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={currentEmail || t('emailPlaceholder')}
          disabled={pending}
          autoComplete="email"
          className="w-full h-11 rounded-[10px] bg-page-chip px-4 font-sans text-[15px] text-page placeholder:text-page-faint focus:outline-none disabled:opacity-50"
        />
      </label>
      {error ? (
        <p className="font-sans text-[13px] text-red-400/90">{error}</p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending || !email.trim()}
          className="h-11 px-5 rounded-full bg-[var(--page-fg)] text-[var(--page-bg)] font-sans text-[13px] font-bold hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          {pending ? t('updateEmailSending') : t('updateEmailSubmit')}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setOpen(false);
            setError(null);
            setEmail('');
            onClose?.();
          }}
          className="h-11 px-5 rounded-full border border-page-faint font-sans text-[13px] font-semibold text-page-muted hover:text-page disabled:opacity-40 transition-colors"
        >
          {t('updateEmailCancel')}
        </button>
      </div>
    </form>
  );
}
