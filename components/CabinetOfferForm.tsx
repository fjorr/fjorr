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
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const field =
    'w-full rounded-[10px] bg-page-chip px-4 py-3 font-sans text-[14px] text-page placeholder:text-page-faint focus:outline-none focus:bg-page-chip-active transition-colors border border-transparent';
  const select =
    'w-full h-11 rounded-[10px] bg-page-chip px-3 font-sans text-[14px] text-page focus:outline-none focus:bg-page-chip-active transition-colors border-0';

  const setKindAndEmail = (next: CabinetScoutKind) => {
    setKind(next);
    setError(null);
    if (next === 'offer') {
      setEmail(defaultEmail);
    } else if (email === defaultEmail) {
      setEmail('');
    }
  };

  if (done) {
    return (
      <p className="font-sans text-[14px] font-semibold text-page leading-snug text-center">
        {t('scoutSuccess')}
      </p>
    );
  }

  if (!bureauxActive) {
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="font-sans text-[13px] text-page-faint leading-snug max-w-xs">
          {t('scoutBureauxRequired')}
        </p>
        <Link
          href="/bureaux"
          className="h-12 px-6 inline-flex items-center justify-center bg-[var(--page-fg)] text-[var(--page-bg)] font-semibold text-[14px] rounded-full hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-xl font-sans"
        >
          {t('ctaScoutBureaux')}
        </Link>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-12 px-6 py-2.5 bg-[var(--page-fg)] text-[var(--page-bg)] font-semibold text-[14px] rounded-full hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-xl font-sans"
      >
        {t('ctaScout')}
      </button>
    );
  }

  return (
    <div className="w-full max-w-md text-left flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-page-faint">
          {t('scoutFormTitle')}
        </h2>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="font-sans text-[13px] text-page-faint hover:text-page-muted transition-colors"
        >
          {t('offerCancel')}
        </button>
      </div>

      <div className="flex gap-2">
        {(
          [
            { value: 'offer' as const, label: t('kindOffer') },
            { value: 'suggest' as const, label: t('kindSuggest') },
          ] as const
        ).map((opt) => {
          const active = kind === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setKindAndEmail(opt.value)}
              className={`flex-1 h-10 rounded-full font-sans text-[13px] font-semibold transition-colors ${
                active
                  ? 'bg-page-chip-active text-page'
                  : 'bg-page-chip text-page-muted hover:text-page'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <form
        className="flex flex-col gap-3.5"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
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
              setError(t(`offerError.${result.error}`));
              return;
            }
            setDone(true);
          });
        }}
      >
        <div className="flex flex-col gap-1.5">
          <label className="font-sans text-[11px] font-semibold uppercase tracking-wide text-page-faint">
            {kind === 'suggest' ? t('suggestName') : t('offerName')}
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={field}
            autoComplete={kind === 'offer' ? 'name' : 'off'}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-sans text-[11px] font-semibold uppercase tracking-wide text-page-faint">
            {t('offerDiscipline')}
          </label>
          <select
            value={discipline}
            onChange={(e) => setDiscipline(e.target.value)}
            className={select}
          >
            {DISCIPLINES.map((d) => (
              <option key={d} value={d} className="bg-page">
                {t(`offerDisciplines.${d}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-sans text-[11px] font-semibold uppercase tracking-wide text-page-faint">
            {kind === 'suggest' ? t('suggestEmail') : t('offerEmail')}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={field}
            autoComplete={kind === 'offer' ? 'email' : 'off'}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-sans text-[11px] font-semibold uppercase tracking-wide text-page-faint">
            {t('offerReel')}
          </label>
          <input
            type="url"
            value={reelUrl}
            onChange={(e) => setReelUrl(e.target.value)}
            placeholder={t('offerReelPlaceholder')}
            className={field}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-sans text-[11px] font-semibold uppercase tracking-wide text-page-faint">
            {kind === 'suggest' ? t('suggestNote') : t('offerNote')}
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              kind === 'suggest'
                ? t('suggestNotePlaceholder')
                : t('offerNotePlaceholder')
            }
            rows={4}
            className={`${field} resize-none min-h-[6.5rem]`}
            required
          />
        </div>

        {error ? (
          <p className="font-sans text-[13px] text-page-muted leading-snug">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="self-start h-11 px-6 rounded-full bg-[var(--page-fg)] text-[var(--page-bg)] font-sans text-[14px] font-bold hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          {pending ? t('offerSubmitting') : t('offerSubmit')}
        </button>
      </form>
    </div>
  );
}
