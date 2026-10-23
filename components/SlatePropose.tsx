'use client';

import React, { useEffect, useRef, useState, useTransition } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { submitSlatePrompt } from '@/lib/slate-actions';
import { PROMPT_MAX, PROMPT_MIN, TITLE_MAX, promptLength } from '@/lib/slate-text';

const MORPH =
  '[transition:height_700ms_cubic-bezier(0.22,1,0.36,1),border-radius_700ms_cubic-bezier(0.22,1,0.36,1),background-color_480ms_cubic-bezier(0.22,1,0.36,1)]';

function roundOpens(iso: string | null, locale: string) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  try {
    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    })
      .format(date)
      .replace(/\./g, '');
  } catch {
    return '';
  }
}

export default function SlatePropose({
  open,
  canVote,
  promptsLeft,
  endsAt,
}: {
  open: boolean;
  canVote: boolean;
  promptsLeft: number;
  endsAt: string | null;
}) {
  const t = useTranslations('Slate');
  const locale = useLocale();
  const [memberError, setMemberError] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [left, setLeft] = useState(promptsLeft);
  const [savedTitle, setSavedTitle] = useState<string | null>(null);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [sending, startSend] = useTransition();
  const [fieldOpen, setFieldOpen] = useState(false);
  const [reduced, setReduced] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const titleLength = promptLength(title);
  const length = promptLength(body);

  useEffect(() => {
    setLeft(promptsLeft);
  }, [promptsLeft]);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || fieldOpen) return;
    if (reduced) {
      video.pause();
      return;
    }
    void video.play().catch(() => {});
  }, [fieldOpen, reduced]);

  const openField = () => {
    if (fieldOpen) return;
    videoRef.current?.pause();
    const el = shellRef.current;
    if (!el || reduced) {
      setFieldOpen(true);
      window.setTimeout(() => titleRef.current?.focus(), 0);
      return;
    }
    el.style.height = `${el.getBoundingClientRect().height}px`;
    setFieldOpen(true);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (shellRef.current) shellRef.current.style.height = '48px';
      });
    });
    window.setTimeout(() => titleRef.current?.focus(), 460);
  };

  const nominateAnother = () => {
    setSavedTitle(null);
    setPromptError(null);
    setMemberError(false);
    setFieldOpen(true);
    window.setTimeout(() => titleRef.current?.focus(), 0);
  };

  const sendPrompt = () => {
    if (!canVote) {
      setMemberError(true);
      return;
    }
    if (sending || left <= 0) return;
    if (titleLength === 0 || length < PROMPT_MIN) {
      setPromptError(t('invalid'));
      return;
    }
    setPromptError(null);
    startSend(async () => {
      const result = await submitSlatePrompt(title, body);
      if (result.ok) {
        setSavedTitle(title.replace(/\s+/g, ' ').trim());
        setTitle('');
        setBody('');
        if (typeof result.remaining === 'number') setLeft(result.remaining);
        else setLeft((n) => Math.max(0, n - 1));
        return;
      }
      if (result.code === 'signedOut' || result.code === 'notMember') {
        setMemberError(true);
        return;
      }
      if (result.code === 'limit') {
        setLeft(0);
        return;
      }
      if (result.code === 'invalid') {
        setPromptError(t('invalid'));
        return;
      }
      setPromptError(t('promptError'));
    });
  };

  const centered = (open && left <= 0) || Boolean(savedTitle);

  return (
    <div
      className={`mx-auto flex w-full max-w-[26rem] flex-1 flex-col items-center text-center ${
        centered ? 'justify-center' : 'md:[justify-content:safe_center]'
      }`}
    >
      {open && left <= 0 ? (
        <div role="status" className="flex w-full flex-col items-center text-center">
          <h1 className="m-0 text-balance font-[family-name:var(--font-circular-black)] text-[clamp(2.75rem,6vw,3.75rem)] font-[900] leading-[0.98] tracking-[-0.03em] text-[#0B0B0C]">
            {t('limitHeadline')}
          </h1>
          <p className="m-0 mt-5 text-balance font-sans text-[16px] font-medium leading-relaxed text-black/55 md:text-[17px]">
            {t('limitBody', { date: roundOpens(endsAt, locale) })}
          </p>
        </div>
      ) : savedTitle ? (
        <>
          <div role="status" className="flex w-full flex-col items-center text-center">
            <h1 className="m-0 text-balance font-[family-name:var(--font-circular-black)] text-[clamp(2.75rem,6vw,3.75rem)] font-[900] leading-[0.98] tracking-[-0.03em] text-[#0B0B0C]">
              {savedTitle}
            </h1>
            <p className="m-0 mt-4 font-sans text-[22px] font-semibold leading-tight tracking-[-0.02em] text-[#0B0B0C] md:text-[26px]">
              {t('nominated')}
            </p>
            <p className="m-0 mt-5 text-balance font-sans text-[16px] font-medium leading-relaxed text-black/55 md:text-[17px]">
              {t.rich('nominatedNext', {
                account: (chunks) => (
                  <Link
                    href="/account/nominations"
                    className="whitespace-nowrap text-[#0B0B0C] underline decoration-[1px] underline-offset-[3px]"
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </div>
          {left > 0 ? (
            <button
              type="button"
              onClick={nominateAnother}
              className="mt-6 border-0 bg-transparent p-0 font-sans text-[15px] font-medium text-black/45 transition-colors hover:text-[#0B0B0C]"
            >
              {t('nominateAnother')}
            </button>
          ) : null}
        </>
      ) : (
        <>
      <h1 className="m-0 font-[family-name:var(--font-circular-black)] text-[clamp(2rem,4vw,2.75rem)] font-[900] leading-[1.02] tracking-[-0.03em] text-[#0B0B0C]">
        {t('proposeHeadline')}
      </h1>
      <p className="m-0 mt-4 text-balance font-sans text-[16px] font-medium leading-relaxed text-black/55 md:text-[17px]">
        {t('proposeLead')}
      </p>

      {open ? (
          <form
            className="mt-10 w-full text-left"
            onSubmit={(event) => {
              event.preventDefault();
              sendPrompt();
            }}
          >
            <div
              ref={shellRef}
              className={`relative w-full overflow-hidden motion-reduce:transition-none ${
                fieldOpen
                  ? 'h-12 rounded-full bg-[#F5F5F7]'
                  : 'aspect-square rounded-[22px] bg-black'
              } ${reduced ? '' : MORPH}`}
            >
              <button
                type="button"
                onClick={openField}
                aria-label={t('titlePlaceholder')}
                tabIndex={fieldOpen ? -1 : 0}
                className={`absolute inset-0 border-0 p-0 transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                  fieldOpen ? 'pointer-events-none opacity-0' : 'cursor-pointer opacity-100'
                }`}
              >
                <video
                  ref={videoRef}
                  src="/nominate-mask.mp4"
                  poster="/nominate-mask.jpg"
                  muted
                  loop
                  playsInline
                  preload="auto"
                  aria-hidden
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute bottom-3.5 right-3.5 z-[1] inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#0B0B0C]"
                >
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} />
                </span>
              </button>
              <div
                className={`absolute inset-0 transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                  fieldOpen ? 'opacity-100 delay-200' : 'pointer-events-none opacity-0'
                }`}
              >
                <label className="sr-only" htmlFor="slate-title">
                  {t('titlePlaceholder')}
                </label>
                <input
                  ref={titleRef}
                  id="slate-title"
                  value={title}
                  maxLength={TITLE_MAX}
                  placeholder={t('titlePlaceholder')}
                  tabIndex={fieldOpen ? 0 : -1}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    if (promptError) setPromptError(null);
                  }}
                  className="h-full w-full border-0 bg-transparent pl-5 pr-16 font-sans text-[16px] font-medium text-[#0B0B0C] outline-none placeholder:text-black/35"
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 right-5 -translate-y-1/2 font-sans text-[13px] font-medium tabular-nums text-black/35"
                >
                  {t('titleCounter', { n: titleLength })}
                </span>
              </div>
            </div>
            <div
              className={`grid transition-[grid-template-rows,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                fieldOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
              inert={fieldOpen ? undefined : true}
            >
              <div className="overflow-hidden">
                <div className="relative mt-4">
                  <textarea
                    id="slate-prompt"
                    value={body}
                    maxLength={PROMPT_MAX}
                    rows={8}
                    placeholder={t('placeholder')}
                    aria-invalid={memberError || undefined}
                    tabIndex={fieldOpen ? 0 : -1}
                    onChange={(event) => {
                      setBody(event.target.value);
                      if (promptError) setPromptError(null);
                      if (memberError) setMemberError(false);
                    }}
                    className={`story-scroll min-h-64 w-full resize-none rounded-[22px] border-0 px-5 pt-4 pb-12 font-sans text-[16px] font-medium leading-relaxed outline-none ${
                      memberError
                        ? 'bg-red-600 text-transparent caret-transparent placeholder:text-transparent'
                        : 'bg-[#F5F5F7] text-[#0B0B0C] placeholder:text-black/35'
                    }`}
                  />
                  {memberError ? (
                    <>
                      <p
                        role="alert"
                        className="pointer-events-none absolute inset-x-5 top-4 m-0 pr-10 font-sans text-[16px] font-medium leading-relaxed text-white"
                      >
                        {t('joinToast')}{' '}
                        <Link
                          href="/bureaux"
                          className="pointer-events-auto underline underline-offset-2"
                        >
                          {t('joinLink')}
                        </Link>
                      </p>
                      <button
                        type="button"
                        aria-label={t('clear')}
                        onClick={() => setMemberError(false)}
                        className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/25 text-white"
                      >
                        <X className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
                      </button>
                    </>
                  ) : (
                    <span
                      aria-hidden
                      className={`pointer-events-none absolute right-3 bottom-3 inline-flex h-6 items-center rounded-full bg-white/75 px-2.5 font-sans text-[13px] font-medium tabular-nums shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.05] backdrop-blur-md ${
                        length < PROMPT_MIN ? 'text-red-600' : 'text-black/45'
                      }`}
                    >
                      {t('counter', { n: length })}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    {length < PROMPT_MIN ? (
                      <p className="m-0 font-sans text-[13px] font-medium leading-snug text-black/35">
                        {t('storyMin')}
                      </p>
                    ) : null}
                    <p className="m-0 font-sans text-[13px] font-medium leading-snug text-black/35">
                      {t('sourceHint')}
                    </p>
                  </div>
                  <button
                    type="submit"
                    tabIndex={fieldOpen ? 0 : -1}
                    disabled={sending || titleLength === 0 || length === 0}
                    className="inline-flex h-9 shrink-0 items-center rounded-full bg-[#0B0B0C] px-4 font-sans text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                  >
                    {sending ? t('pending') : t('submit')}
                  </button>
                </div>
                {promptError ? (
                  <p className="m-0 mt-3 text-center font-sans text-[14px] font-medium text-black/45">
                    {promptError}
                  </p>
                ) : null}
              </div>
            </div>
          </form>
      ) : (
        <p className="m-0 mt-10 font-sans text-[16px] font-medium text-black/55">{t('closed')}</p>
      )}
        </>
      )}
    </div>
  );
}
