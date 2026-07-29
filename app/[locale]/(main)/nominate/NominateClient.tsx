'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import NominateSuccessView from '@/components/NominateSuccessView';
import {
  submitNomination,
  type BountyRow,
  type NominationKind,
} from '@/lib/nomination-actions';

type FieldErrorKey =
  | 'storyRequired'
  | 'whyRequired'
  | 'settingRequired'
  | 'proofRequired'
  | 'premiseRequired'
  | 'kindRequired'
  | 'proofUrlInvalid'
  | 'bountyInvalid'
  | 'signInRequired'
  | 'submitError';

type FieldKey =
  | 'story'
  | 'why'
  | 'setting'
  | 'proof'
  | 'proofUrl'
  | 'kind'
  | 'bounty'
  | 'form';

interface ValidationErrors {
  story?: FieldErrorKey;
  why?: FieldErrorKey;
  setting?: FieldErrorKey;
  proof?: FieldErrorKey;
  proofUrl?: FieldErrorKey;
  kind?: FieldErrorKey;
  bounty?: FieldErrorKey;
  form?: FieldErrorKey;
}

const KINDS: NominationKind[] = ['true', 'fiction'];

function formatBountyAmount(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  } catch {
    return `$${Math.round(cents / 100)}`;
  }
}

function fieldClass(hasError: boolean) {
  return `w-full rounded-xl px-5 py-4 bg-page-chip font-sans font-semibold text-[15px] text-page placeholder-page-muted border focus:outline-none transition-all duration-300 ${
    hasError
      ? 'border-red-500/50 focus:border-red-500'
      : 'border-page-faint focus:border-[color-mix(in_srgb,var(--page-fg)_22%,transparent)] focus:bg-[var(--page-chip-hover)]'
  }`;
}

export default function NominateClient({
  signedIn,
  bounties,
  initialBountyId = '',
}: {
  signedIn: boolean;
  bounties: BountyRow[];
  initialBountyId?: string;
}) {
  const t = useTranslations('Nominate');
  const [kind, setKind] = useState<NominationKind>('true');
  const [story, setStory] = useState('');
  const [why, setWhy] = useState('');
  const [setting, setSetting] = useState('');
  const [proof, setProof] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [bountyId, setBountyId] = useState(initialBountyId);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const clearError = (key: FieldKey) => {
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const openSignIn = () => {
    const next = bountyId
      ? `/nominate?bounty=${encodeURIComponent(
          bounties.find((b) => b.id === bountyId)?.slug || bountyId
        )}`
      : '/nominate';
    window.dispatchEvent(
      new CustomEvent('fjorr_open_signin', {
        detail: { nextPath: next },
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signedIn) {
      openSignIn();
      return;
    }

    const localErrors: ValidationErrors = {};
    if (!story.trim()) localErrors.story = 'storyRequired';
    if (!why.trim()) localErrors.why = 'whyRequired';
    if (!setting.trim()) localErrors.setting = 'settingRequired';
    if (!proof.trim()) {
      localErrors.proof = kind === 'true' ? 'proofRequired' : 'premiseRequired';
    }
    if (!KINDS.includes(kind)) localErrors.kind = 'kindRequired';

    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      return;
    }

    setSubmitting(true);
    const result = await submitNomination({
      story,
      kind,
      whyFjorr: why,
      setting,
      proofOrPremise: proof,
      proofUrl: proofUrl || undefined,
      bountyId: bountyId || null,
    });
    setSubmitting(false);

    if (result.ok) {
      setSubmittedSuccess(true);
      return;
    }

    const map: Record<string, FieldKey> = {
      storyRequired: 'story',
      whyRequired: 'why',
      settingRequired: 'setting',
      proofRequired: 'proof',
      premiseRequired: 'proof',
      kindRequired: 'kind',
      proofUrlInvalid: 'proofUrl',
      bountyInvalid: 'bounty',
      signInRequired: 'form',
      submitError: 'form',
    };
    const field = map[result.error] || 'form';
    setErrors({ [field]: result.error as FieldErrorKey });
  };

  const handleResetForm = () => {
    setKind('true');
    setStory('');
    setWhy('');
    setSetting('');
    setProof('');
    setProofUrl('');
    setBountyId(initialBountyId);
    setErrors({});
    setSubmittedSuccess(false);
  };

  const proofLabel =
    kind === 'true' ? t('proofLabel') : t('premiseLabel');
  const proofPlaceholder =
    kind === 'true' ? t('proofPlaceholder') : t('premisePlaceholder');

  return (
    <div className="w-full min-h-screen bg-[var(--page-bg)] text-page pt-5 pb-24 flex flex-col items-center overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ContactPage',
            name: 'Nominate | Fjorr',
            description: t('description'),
            url: 'https://www.fjorr.com/nominate',
          }),
        }}
      />

      <div className="w-full flex flex-nowrap justify-center gap-1.5 mb-24 sm:mb-32 select-none">
        <div className="flex flex-col gap-2.5 w-[33%] md:w-[25%] shrink-0 opacity-0 animate-sweep-right style-delay-100">
          <div className="bg-page-chip relative w-full overflow-hidden">
            <img
              src="https://media.fjorr.com/assets/fjorr-nominate-poster-breakdancing.avif"
              className="w-full h-auto object-contain block opacity-85 hover:opacity-100 hover:scale-[1.01] transition-all duration-700"
              alt="Breakdancing narrative frame"
            />
          </div>
          <div className="film-metadata-horizontal text-[9px] text-page-faint tracking-[0.2em] font-mono uppercase font-medium px-4 truncate">
            {t('nominationLabel', { number: 143 })}
          </div>
        </div>

        <div className="flex flex-col gap-2.5 w-[33%] md:w-[25%] shrink-0 opacity-0 animate-sweep-right style-delay-180">
          <div className="bg-page-chip relative w-full overflow-hidden">
            <img
              src="https://media.fjorr.com/assets/fjorr-nominate-poster-naismith.avif"
              className="w-full h-auto object-contain block opacity-85 hover:opacity-100 hover:scale-[1.01] transition-all duration-700"
              alt="Naismith basketball narrative frame"
            />
          </div>
          <div className="film-metadata-horizontal text-[9px] text-page-faint tracking-[0.2em] font-mono uppercase font-medium px-4 truncate">
            {t('nominationLabel', { number: 144 })}
          </div>
        </div>

        <div className="flex flex-col gap-2.5 w-[33%] md:w-[25%] shrink-0 opacity-0 animate-sweep-right style-delay-250">
          <div className="bg-page-chip relative w-full overflow-hidden">
            <img
              src="https://media.fjorr.com/assets/fjorr-nominate-poster-ww2.avif"
              className="w-full h-auto object-contain block opacity-85 hover:opacity-100 hover:scale-[1.01] transition-all duration-700"
              alt="WWII historical narrative frame"
            />
          </div>
          <div className="film-metadata-horizontal text-[9px] text-page-faint tracking-[0.2em] font-mono uppercase font-medium px-4 truncate">
            {t('nominationLabel', { number: 145 })}
          </div>
        </div>

        <div className="flex-col gap-2.5 w-[25%] shrink-0 opacity-0 animate-sweep-right style-delay-320 hidden md:flex">
          <div className="bg-page-chip relative w-full overflow-hidden">
            <img
              src="https://media.fjorr.com/assets/fjorr-nominate-poster-yeti.avif"
              className="w-full h-auto object-contain block opacity-85 hover:opacity-100 hover:scale-[1.01] transition-all duration-700"
              alt="Yeti legend narrative frame"
            />
          </div>
          <div className="film-metadata-horizontal text-[9px] text-page-faint tracking-[0.2em] font-mono uppercase font-medium px-4 truncate">
            {t('nominationLabel', { number: 146 })}
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl px-[10%] flex flex-col items-center text-center mt-4">
        {submittedSuccess ? (
          <NominateSuccessView onReset={handleResetForm} />
        ) : (
          <div className="w-full max-w-xl flex flex-col items-center">
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-extrabold uppercase tracking-tighter text-page leading-[52px] sm:leading-[64px] md:leading-[76px] font-futura mb-6 opacity-0 animate-slide-up style-delay-headline whitespace-pre-line select-none">
              {t('title')}
            </h1>

            <p className="font-sans font-medium text-[15px] sm:text-[16px] leading-[1.6em] text-page-muted max-w-[280px] sm:max-w-md tracking-tight text-center mb-10 opacity-0 animate-slide-up style-delay-body">
              {t('description')}
            </p>

            {!signedIn ? (
              <div className="w-full max-w-sm flex flex-col items-center gap-5 opacity-0 animate-slide-up style-delay-form">
                <p className="font-sans font-medium text-[14px] leading-relaxed text-page-muted tracking-tight">
                  {t('membersOnlyBody')}
                </p>
                <button
                  type="button"
                  onClick={openSignIn}
                  className="px-10 h-14 bg-[var(--page-fg)] text-[var(--page-bg)] font-sans font-bold text-[15px] tracking-tight rounded-full shadow-2xl hover:opacity-90 active:scale-95 transition-all duration-150"
                >
                  {t('signInToNominate')}
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                noValidate
                className="w-full flex flex-col text-left opacity-0 animate-slide-up style-delay-form gap-4"
              >
                <fieldset className="flex flex-col gap-2">
                  <legend className="font-sans text-[12px] font-semibold uppercase tracking-wide text-page-faint mb-1">
                    {t('kindLabel')}
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {KINDS.map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => {
                          setKind(k);
                          clearError('kind');
                          clearError('proof');
                        }}
                        className={`h-10 px-4 rounded-full font-sans text-[13px] font-semibold transition-all ${
                          kind === k
                            ? 'bg-[var(--page-fg)] text-[var(--page-bg)]'
                            : 'bg-page-chip text-page-muted border border-page-faint hover:bg-[var(--page-chip-hover)]'
                        }`}
                      >
                        {k === 'true' ? t('kindTrue') : t('kindFiction')}
                      </button>
                    ))}
                  </div>
                  {errors.kind && (
                    <span className="font-sans font-bold text-[14px] text-red-500 tracking-tight">
                      {t(errors.kind)}
                    </span>
                  )}
                </fieldset>

                <label className="flex flex-col gap-2">
                  <span className="font-sans text-[12px] font-semibold uppercase tracking-wide text-page-faint">
                    {t('storyLabel')}
                  </span>
                  <textarea
                    value={story}
                    onChange={(e) => {
                      setStory(e.target.value);
                      clearError('story');
                    }}
                    placeholder={t('storyPlaceholder')}
                    rows={10}
                    className={`${fieldClass(!!errors.story)} min-h-64 resize-y`}
                  />
                  {errors.story && (
                    <span className="font-sans font-bold text-[14px] text-red-500 tracking-tight">
                      {t(errors.story)}
                    </span>
                  )}
                </label>

                <label className="flex flex-col gap-2">
                  <span className="font-sans text-[12px] font-semibold uppercase tracking-wide text-page-faint">
                    {t('whyLabel')}
                  </span>
                  <textarea
                    value={why}
                    onChange={(e) => {
                      setWhy(e.target.value);
                      clearError('why');
                    }}
                    placeholder={t('whyPlaceholder')}
                    rows={3}
                    className={`${fieldClass(!!errors.why)} min-h-24 resize-none`}
                  />
                  {errors.why && (
                    <span className="font-sans font-bold text-[14px] text-red-500 tracking-tight">
                      {t(errors.why)}
                    </span>
                  )}
                </label>

                <label className="flex flex-col gap-2">
                  <span className="font-sans text-[12px] font-semibold uppercase tracking-wide text-page-faint">
                    {t('settingLabel')}
                  </span>
                  <input
                    type="text"
                    value={setting}
                    onChange={(e) => {
                      setSetting(e.target.value);
                      clearError('setting');
                    }}
                    placeholder={t('settingPlaceholder')}
                    className={fieldClass(!!errors.setting)}
                  />
                  {errors.setting && (
                    <span className="font-sans font-bold text-[14px] text-red-500 tracking-tight">
                      {t(errors.setting)}
                    </span>
                  )}
                </label>

                <label className="flex flex-col gap-2">
                  <span className="font-sans text-[12px] font-semibold uppercase tracking-wide text-page-faint">
                    {proofLabel}
                  </span>
                  <textarea
                    value={proof}
                    onChange={(e) => {
                      setProof(e.target.value);
                      clearError('proof');
                    }}
                    placeholder={proofPlaceholder}
                    rows={3}
                    className={`${fieldClass(!!errors.proof)} min-h-24 resize-none`}
                  />
                  {errors.proof && (
                    <span className="font-sans font-bold text-[14px] text-red-500 tracking-tight">
                      {t(errors.proof)}
                    </span>
                  )}
                </label>

                {kind === 'true' && (
                  <label className="flex flex-col gap-2">
                    <span className="font-sans text-[12px] font-semibold uppercase tracking-wide text-page-faint">
                      {t('proofUrlLabel')}
                    </span>
                    <input
                      type="url"
                      value={proofUrl}
                      onChange={(e) => {
                        setProofUrl(e.target.value);
                        clearError('proofUrl');
                      }}
                      placeholder={t('proofUrlPlaceholder')}
                      className={fieldClass(!!errors.proofUrl)}
                    />
                    {errors.proofUrl && (
                      <span className="font-sans font-bold text-[14px] text-red-500 tracking-tight">
                        {t(errors.proofUrl)}
                      </span>
                    )}
                  </label>
                )}

                <label className="flex flex-col gap-2">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-sans text-[12px] font-semibold uppercase tracking-wide text-page-faint">
                      {t('bountyLabel')}
                    </span>
                    <Link
                      href="/bounties"
                      className="font-sans text-[12px] font-semibold text-page-muted hover:text-page transition-colors shrink-0"
                    >
                      {t('viewOpenBounties')}
                    </Link>
                  </span>
                  <select
                    value={bountyId}
                    onChange={(e) => {
                      setBountyId(e.target.value);
                      clearError('bounty');
                    }}
                    className={`${fieldClass(!!errors.bounty)} appearance-none`}
                  >
                    <option value="">{t('bountyGeneral')}</option>
                    {bounties.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title} · {formatBountyAmount(b.amount_cents, b.currency)}
                      </option>
                    ))}
                  </select>
                  {bountyId ? (
                    <span className="font-sans text-[13px] text-page-muted leading-snug">
                      {bounties.find((b) => b.id === bountyId)?.brief}
                    </span>
                  ) : (
                    <span className="font-sans text-[13px] text-page-muted leading-snug">
                      {t('bountyHint')}
                    </span>
                  )}
                  {errors.bounty && (
                    <span className="font-sans font-bold text-[14px] text-red-500 tracking-tight">
                      {t(errors.bounty)}
                    </span>
                  )}
                </label>

                {errors.form && (
                  <span className="font-sans font-bold text-[14px] text-red-500 tracking-tight text-center">
                    {t(errors.form)}
                  </span>
                )}

                <p className="font-sans font-medium text-xs leading-[1.5em] text-page-faint tracking-relaxed text-center max-w-sm mx-auto mt-2 mb-2 select-none">
                  {t('disclaimer')}
                </p>

                <div className="w-full flex justify-center pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-10 h-14 bg-[var(--page-fg)] text-[var(--page-bg)] font-sans font-bold text-[15px] tracking-tight rounded-full shadow-2xl hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all duration-150"
                  >
                    {submitting ? t('submitting') : t('submit')}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .film-metadata-horizontal {
          font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }

        .style-delay-100 { animation-delay: 100ms; }
        .style-delay-180 { animation-delay: 180ms; }
        .style-delay-250 { animation-delay: 250ms; }
        .style-delay-320 { animation-delay: 320ms; }
        
        .style-delay-headline { animation-delay: 500ms !important; }
        .style-delay-body     { animation-delay: 750ms !important; }
        .style-delay-form     { animation-delay: 1000ms !important; }

        @keyframes imageSweepRight {
          from {
            opacity: 0;
            transform: translateX(-12px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes layoutSlideUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-sweep-right {
          animation: imageSweepRight 950ms cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        .animate-slide-up {
          animation: layoutSlideUp 850ms cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
      `,
        }}
      />
    </div>
  );
}
