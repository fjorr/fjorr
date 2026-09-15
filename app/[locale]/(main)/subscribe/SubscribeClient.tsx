'use client';

import React, {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useTranslations } from 'next-intl';
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
      <SheetEnter className="flex w-full max-w-[36rem] flex-col items-center text-center">
        <header className="flex w-full flex-col items-center text-center">
          <p className="m-0 font-sans text-[12px] font-semibold uppercase tracking-[0.14em] text-black/40">
            {t('eyebrow')}
          </p>
          <h1 className="m-0 mt-4 text-balance font-futura text-[clamp(2.5rem,7vw,3.75rem)] leading-[0.92] tracking-tighter text-[#0B0B0C]">
            {t('headline')}
          </h1>
          <p className="m-0 mt-5 max-w-[28ch] font-sans text-[16px] font-medium leading-relaxed text-black/55 md:text-[17px]">
            {t('lead')}
          </p>
        </header>
      </SheetEnter>

      <div className="mt-12 grid w-full grid-cols-1 gap-4 md:mt-14 md:grid-cols-2 md:gap-5">
        <SheetEnter delay={90}>
          <section
            className="flex h-full flex-col rounded-[16px] bg-[#F5F5F7] p-6 md:p-7"
            aria-labelledby="subscribe-email-heading"
          >
          <h2
            id="subscribe-email-heading"
            className="m-0 font-interTight text-[20px] font-bold tracking-tight text-[#0B0B0C]"
          >
            {t('emailEyebrow')}
          </h2>
          <p className="m-0 mt-3 font-sans text-[15px] font-medium leading-snug text-black/50">
            {t('emailLead')}
          </p>
          <div className="mt-6 flex flex-1 flex-col justify-end">
              <form
                ref={formRef}
                action={formAction}
                noValidate
                className="flex w-full flex-col gap-3"
              >
                <div className="pointer-events-none absolute z-[-10] h-0 w-0 overflow-hidden opacity-0">
                  <input
                    type="text"
                    name="website_source_confirm"
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>
                <input
                  type="email"
                  name="email"
                  value={email}
                  autoComplete="email"
                  aria-label={tFooter('emailPlaceholder')}
                  placeholder={tFooter('emailPlaceholder')}
                  disabled={isPending || emailDone}
                  onChange={onEmailChange}
                  className="h-12 w-full rounded-[10px] border-0 bg-white px-4 font-sans text-[15px] font-medium text-[#0B0B0C] placeholder:text-black/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/15 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isPending || emailDone}
                  aria-live="polite"
                  className={`inline-flex h-12 w-full items-center justify-center rounded-full px-6 font-sans text-[14px] font-bold text-white transition-[background-color,opacity] duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-100 ${
                    emailDone
                      ? 'bg-[#0071E3] hover:opacity-100 active:scale-100'
                      : showError
                        ? 'bg-red-600'
                        : 'bg-[#0B0B0C]'
                  }`}
                >
                  {emailDone
                    ? t('allSet')
                    : isPending
                      ? tFooter('subscribing')
                      : showError
                        ? displayMessage
                        : tFooter('subscribe')}
                </button>
              </form>
          </div>
          </section>
        </SheetEnter>

        <SheetEnter delay={160}>
          <section
            className="flex h-full flex-col rounded-[16px] bg-[#F5F5F7] p-6 md:p-7"
            aria-labelledby="subscribe-rss-heading"
          >
            <h2
              id="subscribe-rss-heading"
              className="m-0 font-interTight text-[20px] font-bold tracking-tight text-[#0B0B0C]"
            >
              {t('rssEyebrow')}
            </h2>
            <p className="m-0 mt-3 font-sans text-[15px] font-medium leading-snug text-black/50">
              {t('rssLead')}
            </p>
            <div className="mt-6 flex flex-1 flex-col justify-end gap-3">
              <p className="m-0 break-all rounded-[10px] bg-white px-4 py-3 font-mono text-[12px] font-medium leading-snug text-[#0B0B0C] md:text-[13px]">
                {feedUrl}
              </p>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#0B0B0C] px-6 font-sans text-[14px] font-bold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
              >
                {copied ? t('copied') : t('copy')}
              </button>
            </div>
          </section>
        </SheetEnter>
      </div>
    </div>
  );
}
