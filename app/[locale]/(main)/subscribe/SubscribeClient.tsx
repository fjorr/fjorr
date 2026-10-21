'use client';

import React, {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, Check, Copy, X } from 'lucide-react';
import { subscribeToNewsletter, type FormState } from '@/components/intel';
import SheetEnter from '@/components/house/SheetEnter';

type Props = {
  feedUrl: string;
};

const initialState: FormState = { status: 'idle', message: '' };

const MESSAGE_KEYS = new Set([
  'welcome',
  'emailRequired',
  'emailInvalid',
  'configError',
  'alreadyIn',
  'somethingWrong',
]);

export default function SubscribeClient({ feedUrl }: Props) {
  const t = useTranslations('Subscribe');
  const tFooter = useTranslations('Footer');
  const [copied, setCopied] = useState(false);
  const [emailDone, setEmailDone] = useState(false);
  const [errorDismissed, setErrorDismissed] = useState(false);
  const [email, setEmail] = useState('');
  const [state, formAction, isPending] = useActionState(
    subscribeToNewsletter,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);
  const successFired = useRef(false);

  useEffect(() => {
    if (successFired.current) return;
    if (state.status === 'success') {
      successFired.current = true;
      setEmailDone(true);
      return;
    }
    if (state.status === 'error' && state.message === 'alreadyIn') {
      successFired.current = true;
      setEmailDone(true);
    }
  }, [state.message, state.status]);

  useEffect(() => {
    if (state.status === 'error') setErrorDismissed(false);
  }, [state]);

  const onEmailChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setEmail(event.target.value);
      setErrorDismissed(true);
    },
    []
  );

  const displayMessage =
    state.message && MESSAGE_KEYS.has(state.message)
      ? tFooter(state.message as 'welcome')
      : state.message;
  const showError =
    !errorDismissed &&
    state.status === 'error' &&
    state.message !== 'alreadyIn' &&
    Boolean(displayMessage);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[920px] flex-col items-center px-6 md:px-[54px]">
      <SheetEnter className="flex w-full max-w-[600px] flex-col items-center text-center">
        <header className="flex w-full flex-col items-center text-center">
          <h1 className="m-0 max-w-[36rem] text-balance font-[family-name:var(--font-circular)] text-[clamp(2.25rem,5.5vw,3rem)] font-[700] leading-[1.05] tracking-[-0.045em] text-[#0B0B0C]">
            {t('headline')
              .split('\n')
              .map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
          </h1>
          <p className="m-0 mt-8 max-w-[26rem] whitespace-pre-line font-sans text-[16px] font-medium leading-relaxed text-black/55 md:text-[17px]">
            {t('lead')}
          </p>
        </header>
      </SheetEnter>

      <div className="mt-12 flex w-full max-w-[22rem] flex-col gap-3">
        <SheetEnter delay={90}>
          <form
            ref={formRef}
            action={formAction}
            noValidate
            className="w-full"
          >
            <div className="pointer-events-none absolute z-[-10] h-0 w-0 overflow-hidden opacity-0">
              <input
                type="text"
                name="website_source_confirm"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
            <div
              className={`relative flex h-12 items-center rounded-full pl-8 pr-1.5 ${
                showError ? 'bg-red-600' : 'bg-[#F5F5F7]'
              }`}
            >
              <input
                id="subscribe-email"
                type="email"
                name="email"
                value={email}
                autoComplete="email"
                aria-label={t('emailEyebrow')}
                aria-invalid={showError || undefined}
                placeholder={showError ? '' : t('emailEyebrow')}
                disabled={isPending || emailDone}
                onChange={onEmailChange}
                onFocus={() => setErrorDismissed(true)}
                className={`min-w-0 flex-1 border-0 bg-transparent font-sans text-[16px] font-medium outline-none disabled:opacity-50 ${
                  showError
                    ? 'text-transparent caret-transparent'
                    : 'text-[#0B0B0C] placeholder:text-black/35'
                }`}
              />
              {showError ? (
                <span className="pointer-events-none absolute inset-y-0 left-8 right-12 flex items-center truncate font-sans text-[16px] font-medium text-white">
                  {displayMessage}
                </span>
              ) : null}
              <button
                type="submit"
                disabled={isPending || emailDone || showError}
                aria-live="polite"
                aria-label={
                  showError
                    ? displayMessage
                    : emailDone
                      ? t('allSet')
                      : isPending
                        ? tFooter('subscribing')
                        : tFooter('subscribe')
                }
                className={`relative z-[1] inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-opacity disabled:opacity-100 ${
                  showError
                    ? 'cursor-default bg-white/25 hover:opacity-100'
                    : emailDone
                      ? 'bg-[#0071E3] hover:opacity-90'
                      : 'bg-[#0B0B0C] hover:opacity-90'
                }`}
              >
                {showError ? (
                  <X className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
                ) : emailDone ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
                ) : (
                  <ArrowRight
                    className="h-3.5 w-3.5"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                )}
              </button>
            </div>
          </form>
        </SheetEnter>

        <SheetEnter delay={140}>
          <div className="flex h-12 items-center gap-3 rounded-full bg-[#F5F5F7] pl-8 pr-1.5">
            <p className="m-0 shrink-0 font-sans text-[16px] font-medium text-black/35">
              {t('rssEyebrow')}
            </p>
            <p className="m-0 min-w-0 flex-1 truncate font-sans text-[16px] font-medium text-black/55">
              {feedUrl.replace(/^https?:\/\//, '')}
            </p>
            <button
              type="button"
              onClick={handleCopy}
              aria-label={copied ? t('copied') : `${t('copy')} ${feedUrl}`}
              className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90 ${
                copied ? 'bg-[#0071E3]' : 'bg-[#0B0B0C]'
              }`}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
              ) : (
                <Copy className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
              )}
            </button>
          </div>
        </SheetEnter>
      </div>
    </div>
  );
}
