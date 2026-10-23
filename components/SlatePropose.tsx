'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { submitSlatePrompt } from '@/lib/slate-actions';
import { promptLength } from '@/lib/slate-text';

const PROMPT_MAX = 280;

export default function SlatePropose({
  open,
  canVote,
  promptsLeft,
}: {
  open: boolean;
  canVote: boolean;
  promptsLeft: number;
}) {
  const t = useTranslations('Slate');
  const [toast, setToast] = useState(false);
  const [body, setBody] = useState('');
  const [left, setLeft] = useState(promptsLeft);
  const [logged, setLogged] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [sending, startSend] = useTransition();
  const length = promptLength(body);

  useEffect(() => {
    setLeft(promptsLeft);
  }, [promptsLeft]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(false), 4200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const sendPrompt = () => {
    if (!canVote) {
      setToast(true);
      return;
    }
    if (sending || left <= 0) return;
    setPromptError(null);
    startSend(async () => {
      const result = await submitSlatePrompt(body);
      if (result.ok) {
        setBody('');
        setLogged(true);
        if (typeof result.remaining === 'number') setLeft(result.remaining);
        else setLeft((n) => Math.max(0, n - 1));
        return;
      }
      if (result.code === 'signedOut' || result.code === 'notMember') {
        setToast(true);
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

  return (
    <div className="flex w-full max-w-[26rem] flex-col items-center text-center">
      <Link
        href="/slate"
        className="font-sans text-[13px] font-medium text-black/45 underline decoration-black/25 underline-offset-[3px]"
      >
        {t('headline')}
      </Link>
      <h1 className="m-0 mt-6 font-[family-name:var(--font-circular-black)] text-[clamp(2rem,4vw,2.75rem)] font-[900] leading-[1.02] tracking-[-0.03em] text-[#0B0B0C]">
        {t('proposeHeadline')}
      </h1>
      <p className="m-0 mt-4 font-sans text-[16px] font-medium leading-relaxed text-black/55 md:text-[17px]">
        {t('proposeLead')}
      </p>

      {open ? (
        left <= 0 ? (
          <p className="m-0 mt-10 font-sans text-[16px] font-medium text-black/55">
            {logged ? t('logged') : t('limit')}
          </p>
        ) : (
          <form
            className="mt-10 w-full text-left"
            onSubmit={(event) => {
              event.preventDefault();
              sendPrompt();
            }}
          >
            {logged ? (
              <p className="m-0 mb-4 text-center font-sans text-[15px] font-medium text-black/55">
                {t('logged')}
              </p>
            ) : null}
            <label className="sr-only" htmlFor="slate-prompt">
              {t('proposeHeadline')}
            </label>
            <textarea
              id="slate-prompt"
              value={body}
              maxLength={PROMPT_MAX}
              rows={5}
              placeholder={t('placeholder')}
              onChange={(event) => {
                setBody(event.target.value);
                if (promptError) setPromptError(null);
              }}
              className="w-full resize-none rounded-[22px] border-0 bg-[#F5F5F7] px-5 py-4 font-sans text-[16px] font-medium leading-relaxed text-[#0B0B0C] outline-none placeholder:text-black/35"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="font-sans text-[13px] font-medium text-black/35">
                {t('counter', { n: length })}
              </span>
              <button
                type="submit"
                disabled={sending || length === 0}
                className="inline-flex h-9 items-center rounded-full bg-[#0B0B0C] px-4 font-sans text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {sending ? t('pending') : t('submit')}
              </button>
            </div>
            {promptError ? (
              <p className="m-0 mt-3 text-center font-sans text-[14px] font-medium text-black/45">
                {promptError}
              </p>
            ) : null}
          </form>
        )
      ) : (
        <p className="m-0 mt-10 font-sans text-[16px] font-medium text-black/55">{t('closed')}</p>
      )}

      {toast ? (
        <div
          role="status"
          className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#0B0B0C] px-4 py-2 font-sans text-[13px] font-medium text-white shadow-[0_8px_30px_rgba(0,0,0,0.18)]"
        >
          <span>{t('joinToast')}</span>
          <Link href="/bureaux" className="underline underline-offset-2">
            {t('joinLink')}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
