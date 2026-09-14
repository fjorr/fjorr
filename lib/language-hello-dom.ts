import { parseLocale, type AppLocale } from '@/i18n/config';

/** Native greeting — confirmation beat speaks in the language you just chose. */
export const LANGUAGE_HELLO: Record<AppLocale, string> = {
  en: 'Hello',
  es: 'Hola',
  fr: 'Bonjour',
  it: 'Ciao',
  de: 'Hallo',
  pt: 'Olá',
  sv: 'Hej',
  hi: 'नमस्ते',
  ko: '안녕하세요',
  ja: 'こんにちは',
  'zh-tw': '你好',
};

const ROOT_ID = 'fjorr-lang-hello';
const STORAGE_KEY = 'fjorr-lang-hello';

export type LanguageHelloPending = {
  locale: AppLocale;
  at: number;
};

export function peekLanguageHello(): LanguageHelloPending | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { locale?: string; at?: number };
    if (!parsed?.locale || !parsed.at || Date.now() - parsed.at > 5000) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return { locale: parseLocale(parsed.locale), at: parsed.at };
  } catch {
    return null;
  }
}

/**
 * Imperative Hello cover — lives on document.body outside the [locale] React
 * tree so router.replace(locale) remounts don’t wipe it mid-fade.
 * Full viewport so page chrome and scroll content never peek through.
 */
export function showLanguageHello(locale: AppLocale) {
  if (typeof document === 'undefined') return;

  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ locale, at: Date.now() })
    );
  } catch {
    /* private mode */
  }

  paintHello(locale);
}

function paintHello(locale: AppLocale) {
  let root = document.getElementById(ROOT_ID);
  if (!root) {
    root = document.createElement('div');
    root.id = ROOT_ID;
    document.body.appendChild(root);
  }

  root.setAttribute('role', 'status');
  root.setAttribute('aria-live', 'polite');
  root.setAttribute('aria-label', LANGUAGE_HELLO[locale]);
  root.className = [
    'fixed inset-0 z-[80] flex items-center justify-center',
    'bg-white text-[#0B0B0C]',
  ].join(' ');
  root.style.cssText = '';
  root.classList.remove('lang-hello-exit');

  root.innerHTML = '';
  const word = document.createElement('span');
  word.className =
    'px-6 text-center font-interTight text-[clamp(3.25rem,12vw,8rem)] font-bold leading-none tracking-[-0.03em]';
  word.textContent = LANGUAGE_HELLO[locale];
  root.appendChild(word);
}

/** Opacity-only exit, then remove. Resolves when the cover is gone. */
export function fadeLanguageHello(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve();
      return;
    }

    const root = document.getElementById(ROOT_ID);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* private mode */
    }

    if (!root) {
      resolve();
      return;
    }

    if (root.classList.contains('lang-hello-exit')) {
      resolve();
      return;
    }

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      root.removeEventListener('animationend', onEnd);
      root.remove();
      resolve();
    };

    const onEnd = (event: AnimationEvent) => {
      if (event.target !== root) return;
      finish();
    };

    root.classList.add('lang-hello-exit');

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      finish();
      return;
    }

    root.addEventListener('animationend', onEnd);
    window.setTimeout(finish, 500);
  });
}

export function clearLanguageHello() {
  if (typeof document === 'undefined') return;
  document.getElementById(ROOT_ID)?.remove();
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* private mode */
  }
}

/** Ensure cover exists after remount; preserves original `at` timestamp. */
export function resumeLanguageHello(): AppLocale | null {
  const pending = peekLanguageHello();
  if (!pending) return null;
  if (!document.getElementById(ROOT_ID)) {
    paintHello(pending.locale);
  }
  return pending.locale;
}
