'use client';

import React, { useActionState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { subscribeToNewsletter, FormState } from './intel';

interface IntelFormProps {
  variant?: 'light' | 'dark';
  isCustomVariant?: boolean;
}

const initialState: FormState = {
  status: 'idle',
  message: '',
};

const MESSAGE_KEYS = new Set([
  'welcome',
  'emailRequired',
  'emailInvalid',
  'configError',
  'alreadyIn',
  'somethingWrong',
]);

export function IntelForm({ variant, isCustomVariant = true }: IntelFormProps) {
  const t = useTranslations('Footer');
  const [state, formAction, isPending] = useActionState(subscribeToNewsletter, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  const isDarkBg = variant === 'light';

  const textColor = isCustomVariant
    ? isDarkBg
      ? 'text-white'
      : 'text-black'
    : 'text-black dark:text-white';

  const subTextColor = isCustomVariant
    ? isDarkBg
      ? 'text-white/60'
      : 'text-black/60'
    : 'text-black/40 dark:text-white/60';

  useEffect(() => {
    if (state.status === 'success' && formRef.current) {
      formRef.current.reset();
    }
  }, [state.status]);

  const displayMessage =
    state.message && MESSAGE_KEYS.has(state.message)
      ? t(state.message as 'welcome')
      : state.message;

  return (
    <div className="w-full max-w-64 flex flex-col items-center justify-center min-h-[48px]">
      {state.status !== 'success' && (
        <form
          ref={formRef}
          action={formAction}
          className="w-full relative group flex items-center animate-fadeIn"
        >
          <div className="absolute opacity-0 pointer-events-none z-[-10] h-0 w-0 overflow-hidden">
            <input type="text" name="website_source_confirm" tabIndex={-1} autoComplete="off" />
          </div>

          <input
            type="text"
            name="email"
            placeholder={t('emailPlaceholder')}
            disabled={isPending}
            className={`w-full rounded-[8px] h-12 pl-5 pr-12 font-sans font-semibold text-[14px] focus:outline-none transition-all duration-200 disabled:opacity-50
              ${
                isCustomVariant
                  ? `${textColor} focus:border-current/30 ${
                      variant === 'light'
                        ? 'bg-white/10 placeholder-white/40'
                        : 'bg-black/5 placeholder-black/40'
                    }`
                  : 'bg-black/5 dark:bg-white/5 text-black dark:text-white placeholder-black/40 dark:placeholder-white/60 border border-transparent focus:border-black/20 dark:focus:border-white/20'
              }
            `}
          />

          <button
            type="submit"
            disabled={isPending}
            className={`absolute right-4 top-1/2 -translate-y-1/2 hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none ${subTextColor}`}
            aria-label={t('subscribeAria')}
          >
            {isPending ? (
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                viewBox="0 0 640 640"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M569 337C578.4 327.6 578.4 312.4 569 303.1L401 135C391.6 125.6 376.4 125.6 367.1 135C357.8 144.4 357.7 159.6 367.1 168.9L494.1 295.9L88 295.9C74.7 295.9 64 306.6 64 319.9C64 333.2 74.7 343.9 88 343.9L494.1 343.9L367.1 470.9C357.7 480.3 357.7 495.5 367.1 504.8C376.5 514.1 391.7 514.2 401 504.8L569 337z" />
              </svg>
            )}
          </button>
        </form>
      )}

      {displayMessage && (
        <p
          className={`text-[14px] font-sans font-semibold animate-fadeIn transition-colors text-center ${
            state.status === 'success'
              ? `py-3 ${isCustomVariant ? (isDarkBg ? 'text-blue-400' : 'text-blue-600') : 'text-blue-500'}`
              : 'mt-3 text-red-500'
          }`}
        >
          {displayMessage}
        </p>
      )}
    </div>
  );
}
