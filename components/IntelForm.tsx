'use client';

import React, {
  useActionState,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useTranslations } from 'next-intl';
import { subscribeToNewsletter, FormState } from './intel';

interface IntelFormProps {
  variant?: 'light' | 'dark';
  isCustomVariant?: boolean;
  /** Sheet-scale: huge centered email + submit below. */
  size?: 'md' | 'lg';
  /** Fired on successful subscribe (or already subscribed). */
  onSuccess?: () => void;
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

const EMAIL_MAX_PX = 140;
const EMAIL_MIN_PX = 22;

/** Huge centered email — full width; scales down so one line always fits. */
function SpecimenEmailInput({
  disabled,
  placeholder,
  ariaLabel,
  onValueChange,
}: {
  disabled?: boolean;
  placeholder: string;
  ariaLabel: string;
  onValueChange?: (value: string) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mirrorRef = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [fontPx, setFontPx] = useState(EMAIL_MAX_PX);

  const fit = useCallback(() => {
    const wrap = wrapRef.current;
    const input = inputRef.current;
    const mirror = mirrorRef.current;
    if (!wrap || !input || !mirror) return;

    const sample = (value || placeholder || 'Email').trim() || 'Email';
    mirror.textContent = sample;

    // Usable width is the input’s content box (full stage width, no inner pad).
    const available = Math.max(0, input.clientWidth || wrap.clientWidth);
    if (available < 8) return;

    let size = EMAIL_MAX_PX;
    mirror.style.fontSize = `${size}px`;
    while (size > EMAIL_MIN_PX && mirror.scrollWidth > available) {
      size -= 1;
      mirror.style.fontSize = `${size}px`;
    }
    // Tiny safety so bold metrics / subpixel never clip the last glyph.
    if (size > EMAIL_MIN_PX && mirror.scrollWidth > available - 2) {
      size = Math.max(EMAIL_MIN_PX, size - 1);
      mirror.style.fontSize = `${size}px`;
    }
    input.style.fontSize = `${size}px`;
    setFontPx(size);
  }, [placeholder, value]);

  useLayoutEffect(() => {
    fit();
    const frame = window.requestAnimationFrame(() => fit());
    const wrap = wrapRef.current;
    const ro =
      typeof ResizeObserver !== 'undefined' && wrap
        ? new ResizeObserver(() => fit())
        : null;
    ro?.observe(wrap!);
    window.addEventListener('resize', fit);
    let cancelled = false;
    void document.fonts?.ready?.then(() => {
      if (!cancelled) fit();
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      ro?.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, [fit]);

  const empty = value.length === 0;
  // Empty: custom bar sized to the type (native caret looks like a needle).
  // Typing: soft native caret again — position tracking isn’t worth the fight.
  const showCustomCaret = focused && empty && !disabled;

  return (
    <div ref={wrapRef} className="relative w-full min-w-0">
      <span
        ref={mirrorRef}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 -z-10 whitespace-nowrap font-interTight font-bold leading-none tracking-tight opacity-0"
      />
      <input
        ref={inputRef}
        type="email"
        name="email"
        autoComplete="email"
        autoFocus
        aria-label={ariaLabel}
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          setValue(next);
          onValueChange?.(next);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`box-border w-full min-w-0 border-0 bg-transparent p-0 text-center font-interTight font-bold leading-[0.9] tracking-tight text-[#0B0B0C] outline-none placeholder:text-black/30 disabled:opacity-50 ${
          empty ? 'caret-transparent' : 'caret-black/50'
        }`}
        style={{ fontSize: `${EMAIL_MAX_PX}px` }}
      />
      {showCustomCaret ? (
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[1px] bg-[#0B0B0C] animate-[blinkCursor_1.05s_steps(1,end)_infinite]"
          style={{
            width: Math.max(3, Math.round(fontPx * 0.038)),
            height: Math.round(fontPx * 0.72),
          }}
        />
      ) : null}
    </div>
  );
}

export function IntelForm({
  variant,
  isCustomVariant = true,
  size = 'md',
  onSuccess,
}: IntelFormProps) {
  const t = useTranslations('Footer');
  const [state, formAction, isPending] = useActionState(subscribeToNewsletter, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [errorDismissed, setErrorDismissed] = useState(false);

  const isDarkBg = variant === 'light';
  const large = size === 'lg';

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

  useEffect(() => {
    if (state.status === 'error') {
      setErrorDismissed(false);
    }
  }, [state]);

  const clearErrorOnEdit = useCallback(() => {
    setErrorDismissed(true);
  }, []);

  const successFired = useRef(false);
  useEffect(() => {
    if (!onSuccess || successFired.current) return;
    if (state.status === 'success') {
      successFired.current = true;
      onSuccess();
      return;
    }
    if (state.status === 'error' && state.message === 'alreadyIn') {
      successFired.current = true;
      onSuccess();
    }
  }, [onSuccess, state.message, state.status]);

  const displayMessage =
    state.message && MESSAGE_KEYS.has(state.message)
      ? t(state.message as 'welcome')
      : state.message;

  if (large) {
    // Parent owns the success beat — keep errors here only.
    const showError =
      !errorDismissed &&
      state.status === 'error' &&
      state.message !== 'alreadyIn' &&
      displayMessage;

    return (
      <div className="flex w-full min-w-0 flex-col items-center justify-center">
        <form
          ref={formRef}
          action={formAction}
          noValidate
          className="flex w-full min-w-0 flex-col items-center gap-6 md:gap-7"
        >
          <div className="pointer-events-none absolute z-[-10] h-0 w-0 overflow-hidden opacity-0">
            <input
              type="text"
              name="website_source_confirm"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <SpecimenEmailInput
            disabled={isPending}
            placeholder=""
            ariaLabel={t('emailPlaceholder')}
            onValueChange={clearErrorOnEdit}
          />

          <button
            type="submit"
            disabled={isPending}
            aria-live="polite"
            className={`inline-flex h-10 items-center justify-center rounded-full px-5 font-sans text-[14px] font-semibold tracking-tight text-white transition-[background-color,opacity] duration-150 hover:opacity-85 disabled:opacity-40 ${
              showError ? 'bg-red-600' : 'bg-[#0B0B0C]'
            }`}
          >
            {isPending ? t('subscribing') : showError ? displayMessage : t('subscribe')}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-64 flex-col items-center justify-center min-h-[48px]">
      {state.status !== 'success' && (
        <form
          ref={formRef}
          action={formAction}
          noValidate
          className="group relative flex w-full items-center animate-fadeIn"
        >
          <div className="pointer-events-none absolute z-[-10] h-0 w-0 overflow-hidden opacity-0">
            <input type="text" name="website_source_confirm" tabIndex={-1} autoComplete="off" />
          </div>

          <input
            type="email"
            name="email"
            autoComplete="email"
            aria-label={t('emailPlaceholder')}
            placeholder={t('emailPlaceholder')}
            disabled={isPending}
            className={`h-12 w-full rounded-[8px] pl-5 pr-12 font-sans text-[14px] font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-current/30 disabled:opacity-50 ${
              isCustomVariant
                ? `${textColor} focus:border-current/30 ${
                    variant === 'light'
                      ? 'bg-white/10 placeholder-white/40'
                      : 'bg-black/5 placeholder-black/40'
                  }`
                : 'border border-transparent bg-black/5 text-black placeholder-black/40 focus:border-black/20 dark:bg-white/5 dark:text-white dark:placeholder-white/60 dark:focus:border-white/20'
            }`}
          />

          <button
            type="submit"
            disabled={isPending}
            className={`absolute right-4 top-1/2 flex -translate-y-1/2 items-center justify-center transition-all duration-200 hover:opacity-100 group-hover:translate-x-0.5 disabled:pointer-events-none disabled:opacity-40 ${subTextColor}`}
            aria-label={t('subscribeAria')}
          >
            {isPending ? (
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
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
                className="h-5 w-5"
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
          className={`animate-fadeIn text-center font-sans text-[14px] font-semibold transition-colors ${
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
