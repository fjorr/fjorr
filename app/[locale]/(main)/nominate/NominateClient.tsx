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

/** Show fewer posters on small screens — no horizontal scroll. */
const NOMINATE_POSTERS: Array<
  | { kind: 'image'; src: string; alt: string; id: string; show: string; n: number }
  | { kind: 'solid'; color: string; id: string; show: string; n: number }
> = [
  {
    kind: 'image',
    src: 'https://media.fjorr.com/assets/fjorr-nominate-poster-breakdancing.avif',
    alt: 'Breakdancing narrative frame',
    id: 'breakdancing',
    show: 'block',
    n: 143,
  },
  {
    kind: 'image',
    src: 'https://media.fjorr.com/assets/fjorr-nominate-poster-naismith.avif',
    alt: 'Naismith basketball narrative frame',
    id: 'naismith',
    show: 'block',
    n: 144,
  },
  {
    kind: 'image',
    src: 'https://media.fjorr.com/assets/fjorr-nominate-poster-ww2.avif',
    alt: 'WWII historical narrative frame',
    id: 'ww2',
    show: 'block',
    n: 145,
  },
  {
    kind: 'image',
    src: 'https://media.fjorr.com/assets/fjorr-nominate-poster-yeti.avif',
    alt: 'Yeti legend narrative frame',
    id: 'yeti',
    show: 'hidden sm:block',
    n: 146,
  },
  { kind: 'solid', color: '#3A3530', id: 'solid-1', show: 'hidden md:block', n: 147 },
  { kind: 'solid', color: '#2A3340', id: 'solid-2', show: 'hidden md:block', n: 148 },
  { kind: 'solid', color: '#3F2E2A', id: 'solid-3', show: 'hidden lg:block', n: 149 },
  { kind: 'solid', color: '#24352C', id: 'solid-4', show: 'hidden lg:block', n: 150 },
];

function formatPosterN(n: number) {
  return `N${String(n).padStart(3, '0')}`;
}

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

      <div className="w-full px-5 sm:px-8 flex gap-[20px] mb-8 sm:mb-10 select-none">
        {NOMINATE_POSTERS.map((poster, index) => (
          <div
            key={poster.id}
            className={`${poster.show} flex-1 min-w-0 opacity-0 animate-sweep-right`}
            style={{ animationDelay: `${100 + index * 60}ms` }}
          >
            <div className="relative w-full aspect-video overflow-hidden rounded-[5px] bg-page-chip">
              {poster.kind === 'image' ? (
                <img
                  src={poster.src}
                  alt={poster.alt}
                  className="absolute inset-0 w-full h-full object-cover opacity-85 hover:opacity-100 hover:scale-[1.02] transition-all duration-700"
                />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: poster.color }}
                  aria-hidden
                />
              )}
            </div>
            <p className="mt-3 font-mono text-[10px] sm:text-[11px] font-medium tracking-[0.08em] text-page-faint tabular-nums">
              {formatPosterN(poster.n)}
            </p>
          </div>
        ))}
      </div>

      <div className="w-full max-w-4xl px-[10%] flex flex-col items-center text-center mt-2">
        {submittedSuccess ? (
          <NominateSuccessView onReset={handleResetForm} />
        ) : (
          <div className="w-full max-w-lg flex flex-col items-center">
            <div className="flex flex-col items-center">
              <p className="font-sans text-lg sm:text-xl font-semibold normal-case tracking-normal text-page select-none opacity-0 animate-slide-up style-delay-headline">
                {t('eyebrow')}
              </p>
              <h1 className="mt-2 sm:mt-2.5 mb-5 sm:mb-6 font-futura tracking-tighter text-page text-5xl sm:text-6xl md:text-7xl !leading-[0.9] max-w-[12ch] opacity-0 animate-slide-up style-delay-headline select-none">
                {t('title')}
              </h1>
              <p className="font-sans font-medium text-[15px] sm:text-[16px] leading-[1.55] text-page max-w-md tracking-normal text-center opacity-0 animate-slide-up style-delay-body">
                {t('description')}
              </p>
            </div>

            <div className="mt-4 mb-10 flex flex-col items-center gap-3 opacity-0 animate-slide-up style-delay-body">
              <Link
                href="/bounties"
                className="font-sans text-[13px] sm:text-[14px] font-semibold text-page-muted hover:text-page transition-colors underline underline-offset-2"
              >
                {t('viewOpenBounties')}
              </Link>
              <Link
                href="/principles"
                className="font-sans text-[13px] sm:text-[14px] font-semibold text-page-muted hover:text-page transition-colors underline underline-offset-2"
              >
                {t('principlesLink')}
              </Link>
            </div>

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
                  <legend className="font-sans text-[13px] font-semibold normal-case tracking-normal text-page-muted mb-1">
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
                        className={`h-10 px-4 rounded-[10px] font-sans text-[13px] font-semibold transition-all ${
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
                  <span className="font-sans text-[13px] font-semibold normal-case tracking-normal text-page-muted">
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
                  <span className="font-sans text-[13px] font-semibold normal-case tracking-normal text-page-muted">
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
                  <span className="font-sans text-[13px] font-semibold normal-case tracking-normal text-page-muted">
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
                  <span className="font-sans text-[13px] font-semibold normal-case tracking-normal text-page-muted">
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
                    <span className="font-sans text-[13px] font-semibold normal-case tracking-normal text-page-muted">
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
                    <span className="font-sans text-[13px] font-semibold normal-case tracking-normal text-page-muted">
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
                        {b.title} · {formatBountyAmount(b.reward_amount, b.currency)}
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

                <p className="w-full font-sans font-medium text-xs leading-[1.5em] text-page-muted tracking-relaxed text-left mt-2 mb-2 select-none">
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
