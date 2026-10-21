'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { saveOwnDisplayName, updateOwnEmail } from '@/lib/profile-actions';

const PILL =
  'flex h-12 w-full items-center rounded-full bg-[#F5F5F7] pl-8 pr-2 text-left';
const CIRCLE =
  'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#0B0B0C] bg-transparent text-[#0B0B0C] transition-colors hover:opacity-60 disabled:opacity-40';
const CIRCLE_ACTIVE =
  'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#0B0B0C] bg-[#0B0B0C] text-white transition-colors hover:opacity-90 disabled:opacity-40';
const INPUT =
  'min-w-0 flex-1 border-0 bg-transparent font-sans text-[16px] font-medium text-[#0B0B0C] outline-none placeholder:text-black/35 disabled:opacity-50';

type Field = 'name' | 'email';

function FieldPill({
  label,
  value,
  editing,
  pending,
  draft,
  type,
  autoComplete,
  submitLabel,
  onDraft,
  onStart,
  onCancel,
  onSubmit,
}: {
  label: string;
  value: string;
  editing: boolean;
  pending: boolean;
  draft: string;
  type: 'text' | 'email';
  autoComplete: string;
  submitLabel: string;
  onDraft: (value: string) => void;
  onStart: () => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing]);

  if (!editing) {
    return (
      <button type="button" onClick={onStart} className={PILL}>
        <span className="shrink-0 font-sans text-[16px] font-medium text-black/35">
          {label}
        </span>
        <span className="min-w-0 flex-1 truncate px-3 font-sans text-[16px] font-medium text-[#0B0B0C]">
          {value || '—'}
        </span>
        <span className={CIRCLE} aria-hidden>
          <Plus className="h-3 w-3" strokeWidth={2.25} />
        </span>
      </button>
    );
  }

  return (
    <form
      className={PILL}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <input
        ref={inputRef}
        type={type}
        required
        value={draft}
        disabled={pending}
        autoComplete={autoComplete}
        aria-label={label}
        placeholder={label}
        maxLength={type === 'text' ? 80 : undefined}
        onChange={(e) => onDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
          }
        }}
        className={INPUT}
      />
      <button
        type="submit"
        disabled={pending || !draft.trim()}
        aria-label={submitLabel}
        className={CIRCLE_ACTIVE}
      >
        <ArrowRight className="h-3 w-3" strokeWidth={2.25} aria-hidden />
      </button>
    </form>
  );
}

/**
 * Name and email as subscribe-style pills. Click a pill to edit it;
 * the circle on the right saves.
 */
export default function BureauxAccountActions({
  currentName,
  currentEmail,
}: {
  currentName: string;
  currentEmail: string;
}) {
  const t = useTranslations('Account');
  const router = useRouter();
  const [editing, setEditing] = useState<Field | null>(null);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSentTo, setEmailSentTo] = useState<string | null>(null);

  const start = (field: Field) => {
    setError(null);
    setEmailSentTo(null);
    setDraft(field === 'name' ? currentName : currentEmail);
    setEditing(field);
  };

  const cancel = () => {
    if (pending) return;
    setEditing(null);
    setError(null);
    setDraft('');
  };

  const saveName = () => {
    const next = draft.trim();
    if (!next || next === currentName.trim()) {
      cancel();
      return;
    }
    setError(null);
    setPending(true);
    void (async () => {
      const result = await saveOwnDisplayName({ displayName: next });
      setPending(false);
      if (!result.ok) {
        setError(result.error || t('errorGeneric'));
        return;
      }
      setEditing(null);
      router.refresh();
    })();
  };

  const saveEmail = () => {
    const next = draft.trim();
    if (!next) return;
    setError(null);
    setPending(true);
    void (async () => {
      const result = await updateOwnEmail(next);
      setPending(false);
      if (!result.ok) {
        setError(t(`updateEmailError.${result.error}`));
        return;
      }
      setEmailSentTo(next.toLowerCase());
      setEditing(null);
    })();
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <FieldPill
        label={t('displayName')}
        value={currentName}
        editing={editing === 'name'}
        pending={pending && editing === 'name'}
        draft={draft}
        type="text"
        autoComplete="name"
        submitLabel={pending ? t('saving') : t('save')}
        onDraft={setDraft}
        onStart={() => start('name')}
        onCancel={cancel}
        onSubmit={saveName}
      />
      <FieldPill
        label={t('email')}
        value={currentEmail}
        editing={editing === 'email'}
        pending={pending && editing === 'email'}
        draft={draft}
        type="email"
        autoComplete="email"
        submitLabel={pending ? t('updateEmailSending') : t('updateEmailSubmit')}
        onDraft={setDraft}
        onStart={() => start('email')}
        onCancel={cancel}
        onSubmit={saveEmail}
      />
      {editing === 'email' && !error ? (
        <p className="m-0 px-8 text-left font-sans text-[13px] font-medium leading-snug text-black/45">
          {t('updateEmailHint')}
        </p>
      ) : null}
      {error ? (
        <p className="m-0 px-8 text-left font-sans text-[13px] font-medium leading-snug text-red-600">
          {error}
        </p>
      ) : null}
      {emailSentTo && editing !== 'email' ? (
        <p className="m-0 px-8 text-left font-sans text-[13px] font-medium leading-snug text-black/45">
          {t('updateEmailSent', { email: emailSentTo })}
        </p>
      ) : null}
    </div>
  );
}
