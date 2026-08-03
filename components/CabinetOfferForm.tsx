'use client';

import React, { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  submitCabinetOffer,
  type CabinetScoutKind,
} from '@/lib/cabinet-offer-actions';

const DISCIPLINES = [
  'archivists',
  'cinematographers',
  'composers',
  'curators',
  'directors',
  'editors',
  'producers',
  'researchers',
  'sound designers',
  'writers',
  'other',
] as const;

type FieldKey = 'name' | 'discipline' | 'email' | 'reel' | 'note' | 'form';
type ErrorKey =
  | 'nameRequired'
  | 'disciplineRequired'
  | 'emailRequired'
  | 'emailInvalid'
  | 'reelRequired'
  | 'reelInvalid'
  | 'noteRequired'
  | 'noteTooLong'
  | 'rateLimited'
  | 'submitError'
  | 'signInRequired'
  | 'bureauxRequired';

type FieldErrors = Partial<Record<FieldKey, ErrorKey>>;

const MIN_NOTE = 40;
const MAX_NOTE = 800;

function fieldClass(hasError: boolean) {
  return `w-full rounded-xl px-5 py-4 bg-page-chip font-sans font-semibold text-[15px] text-page placeholder-page-muted border focus:outline-none transition-all duration-300 ${
    hasError
      ? 'border-red-500/50 focus:border-red-500'
      : 'border-page-faint focus:border-[color-mix(in_srgb,var(--page-fg)_22%,transparent)] focus:bg-[var(--page-chip-hover)]'
  }`;
}

function isValidHttpUrl(raw: string) {
  try {
    const u = new URL(raw);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function CabinetOfferForm({
  bureauxActive = false,
  defaultEmail = '',
}: {
  bureauxActive?: boolean;
  defaultEmail?: string;
}) {
  const t = useTranslations('Cabinet');
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [kind, setKind] = useState<CabinetScoutKind>('offer');
  const [name, setName] = useState('');
  const [discipline, setDiscipline] = useState<string>(DISCIPLINES[4]);
  const [email, setEmail] = useState(defaultEmail);
  const [reelUrl, setReelUrl] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [done, setDone] = useState(false);

  const labelClass =
    'font-sans text-[13px] font-semibold normal-case tracking-normal text-page-muted';
  const kindBtn = (active: boolean) =>
    `h-10 px-4 rounded-[10px] font-sans text-[13px] font-semibold transition-all ${
      active
        ? 'bg-[var(--page-fg)] text-[var(--page-bg)]'
        : 'bg-page-chip text-page-muted border border-page-faint hover:bg-[var(--page-chip-hover)]'
    }`;
  const ctaBtn =
    'px-10 h-14 inline-flex items-center justify-center bg-[var(--page-fg)] text-[var(--page-bg)] font-sans font-bold text-[15px] tracking-tight rounded-full shadow-2xl hover:opacity-90 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none';
  const errorClass =
    'font-sans font-bold text-[14px] text-red-500 tracking-tight';

  const clearError = (key: FieldKey) => {
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const setKindAndEmail = (next: CabinetScoutKind) => {
    setKind(next);
    setErrors({});
    if (next === 'offer') {
      setEmail(defaultEmail);
    } else if (email === defaultEmail) {
      setEmail('');
    }
  };

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (name.trim().length < 2) next.name = 'nameRequired';
    if (!DISCIPLINES.includes(discipline as (typeof DISCIPLINES)[number])) {
      next.discipline = 'disciplineRequired';
    }
    const emailTrim = email.trim();
    if (!emailTrim) next.email = 'emailRequired';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      next.email = 'emailInvalid';
    }
    const reelTrim = reelUrl.trim();
    if (!reelTrim) next.reel = 'reelRequired';
    else if (!isValidHttpUrl(reelTrim)) next.reel = 'reelInvalid';
    const noteTrim = note.trim();
    if (noteTrim.length < MIN_NOTE) next.note = 'noteRequired';
    else if (noteTrim.length > MAX_NOTE) next.note = 'noteTooLong';
    return next;
  };

  if (done) {
    return (
      <div className="w-full max-w-md rounded-[12px] bg-page-chip px-5 py-4 text-center">
        <p className="m-0 font-sans text-[15px] font-semibold text-page leading-snug">
          {t('scoutSuccess')}
        </p>
      </div>
    );
  }

  if (!bureauxActive) {
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="font-sans text-[14px] leading-relaxed text-page-muted tracking-tight max-w-xs">
          {t('scoutBureauxRequired')}
        </p>
        <Link href="/bureaux" className={ctaBtn}>
          {t('ctaScoutBureaux')}
        </Link>
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={ctaBtn}>
        {t('ctaScout')}
      </button>
    );
  }

  return (
    <div className="w-full max-w-md text-left flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className={`${labelClass} mb-1`}>{t('kindLabel')}</legend>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { value: 'offer' as const, label: t('kindOffer') },
              { value: 'suggest' as const, label: t('kindSuggest') },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setKindAndEmail(opt.value)}
              className={kindBtn(kind === opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          const local = validate();
          if (Object.keys(local).length > 0) {
            setErrors(local);
            return;
          }
          setErrors({});
          startTransition(async () => {
            const result = await submitCabinetOffer({
              kind,
              name,
              discipline,
              email,
              reelUrl,
              note,
            });
            if (!result.ok) {
              const map: Record<string, FieldKey> = {
                nameRequired: 'name',
                disciplineRequired: 'discipline',
                emailRequired: 'email',
                emailInvalid: 'email',
                reelRequired: 'reel',
                reelInvalid: 'reel',
                noteRequired: 'note',
                noteTooLong: 'note',
                rateLimited: 'form',
                submitError: 'form',
                signInRequired: 'form',
                bureauxRequired: 'form',
              };
              const field = map[result.error] || 'form';
              setErrors({ [field]: result.error as ErrorKey });
              return;
            }
            setDone(true);
          });
        }}
      >
        <label className="flex flex-col gap-2">
          <span className={labelClass}>
            {kind === 'suggest' ? t('suggestName') : t('offerName')}
          </span>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearError('name');
            }}
            className={fieldClass(!!errors.name)}
            autoComplete={kind === 'offer' ? 'name' : 'off'}
          />
          {errors.name ? (
            <span className={errorClass}>{t(`offerError.${errors.name}`)}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2">
          <span className={labelClass}>{t('offerDiscipline')}</span>
          <div className="relative">
            <select
              value={discipline}
              onChange={(e) => {
                setDiscipline(e.target.value);
                clearError('discipline');
              }}
              className={`${fieldClass(!!errors.discipline)} h-auto py-3.5 appearance-none pr-12 cursor-pointer`}
            >
              {DISCIPLINES.map((d) => (
                <option key={d} value={d} className="bg-page">
                  {t(`offerDisciplines.${d}`)}
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-page-muted"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
          {errors.discipline ? (
            <span className={errorClass}>
              {t(`offerError.${errors.discipline}`)}
            </span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2">
          <span className={labelClass}>
            {kind === 'suggest' ? t('suggestEmail') : t('offerEmail')}
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearError('email');
            }}
            className={fieldClass(!!errors.email)}
            autoComplete={kind === 'offer' ? 'email' : 'off'}
          />
          {errors.email ? (
            <span className={errorClass}>{t(`offerError.${errors.email}`)}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2">
          <span className={labelClass}>{t('offerReel')}</span>
          <input
            type="url"
            value={reelUrl}
            onChange={(e) => {
              setReelUrl(e.target.value);
              clearError('reel');
            }}
            placeholder={t('offerReelPlaceholder')}
            className={fieldClass(!!errors.reel)}
          />
          {errors.reel ? (
            <span className={errorClass}>{t(`offerError.${errors.reel}`)}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2">
          <span className={labelClass}>
            {kind === 'suggest' ? t('suggestNote') : t('offerNote')}
          </span>
          <textarea
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              clearError('note');
            }}
            placeholder={
              kind === 'suggest'
                ? t('suggestNotePlaceholder')
                : t('offerNotePlaceholder')
            }
            rows={4}
            className={`${fieldClass(!!errors.note)} resize-none min-h-[6.5rem]`}
          />
          {errors.note ? (
            <span className={errorClass}>{t(`offerError.${errors.note}`)}</span>
          ) : null}
        </label>

        {errors.form ? (
          <p className={`${errorClass} text-center`}>
            {t(`offerError.${errors.form}`)}
          </p>
        ) : null}

        <div className="flex items-center justify-center gap-4">
          <button type="submit" disabled={pending} className={ctaBtn}>
            {pending ? t('offerSubmitting') : t('offerSubmit')}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setErrors({});
            }}
            className="font-sans text-[14px] font-semibold text-page-muted hover:text-page transition-colors"
          >
            {t('offerCancel')}
          </button>
        </div>
      </form>
    </div>
  );
}
