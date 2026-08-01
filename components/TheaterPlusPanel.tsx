'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { fetchOwnBureauxActive } from '@/lib/bureaux-client';
import { submitFilmNote } from '@/lib/film-note-actions';
import { formatTimestamp } from '@/lib/film-note-time';

/** Compact Plus note strip — lives under Rams scrubber in Plus mode. */
export default function TheaterPlusPanel({
  filmId,
  atSeconds,
  isLight = false,
}: {
  filmId: string;
  filmSlug?: string;
  /** Live playhead — stamp is locked to this. */
  atSeconds: number;
  isLight?: boolean;
}) {
  const t = useTranslations('Plus');
  const [bureauxActive, setBureauxActive] = useState<boolean | null>(null);
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>(
    'idle'
  );
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const muted = isLight ? 'text-[#0B0B0C]/55' : 'text-[#F5F5F7]/55';
  const ink = isLight ? 'text-[#0B0B0C]' : 'text-[#F5F5F7]';
  const fieldBg = isLight ? 'bg-[#0B0B0C]/06' : 'bg-[#F5F5F7]/08';
  const fieldBorder = isLight ? 'border-[#0B0B0C]/12' : 'border-[#F5F5F7]/12';

  useEffect(() => {
    let mounted = true;
    fetchOwnBureauxActive().then((active) => {
      if (mounted) setBureauxActive(active);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bureauxActive) return;
    setStatus('sending');
    setErrorKey(null);

    const result = await submitFilmNote({
      filmId,
      body,
      atSeconds: atSeconds > 0 ? Math.floor(atSeconds) : null,
    });

    if (!result.ok) {
      setStatus('error');
      setErrorKey(result.error);
      return;
    }

    setBody('');
    setStatus('sent');
  };

  if (bureauxActive === null) {
    return (
      <p className={`font-sans text-[12px] ${muted} w-full text-center`}>
        {t('loading')}
      </p>
    );
  }

  if (!bureauxActive) {
    return (
      <div className="w-full flex flex-col items-center gap-3 pt-1">
        <p
          className={`font-sans text-[13px] leading-snug text-center max-w-[20rem] ${muted}`}
        >
          {t('modeInvite')}
        </p>
        <Link
          href="/bureaux"
          className={`h-9 px-4 inline-flex items-center justify-center rounded-full font-sans text-[12px] font-bold ${
            isLight
              ? 'bg-[#0B0B0C] text-[#F5F5F7]'
              : 'bg-[#F5F5F7] text-[#0B0B0C]'
          }`}
        >
          {t('joinToNote')}
        </Link>
      </div>
    );
  }

  if (status === 'sent') {
    return (
      <div className="w-full flex flex-col items-center gap-2 pt-1">
        <p className={`font-sans text-[13px] ${ink}`}>{t('sentQuiet')}</p>
        <Link
          href="/account/plus"
          className={`font-sans text-[12px] underline underline-offset-2 ${muted} hover:opacity-100 opacity-90`}
        >
          {t('viewLogs')}
        </Link>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className={`font-mono text-[11px] uppercase tracking-[0.05em] bg-transparent border-0 cursor-pointer p-0 ${muted}`}
        >
          {t('sendAnother')}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full flex flex-col gap-2.5 pt-1"
      data-ui-control="true"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className={`font-mono text-[12px] tabular-nums ${ink}`}>
          {t('atTime', { time: formatTimestamp(atSeconds) })}
        </span>
        <span className={`font-sans text-[11px] ${muted}`}>{t('stampLocked')}</span>
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder={t('bodyPlaceholder')}
        className={`w-full rounded-lg px-3 py-2.5 font-sans text-[13px] leading-snug resize-none border ${fieldBg} ${fieldBorder} ${ink} placeholder:opacity-40 focus:outline-none focus:border-opacity-40`}
      />

      {status === 'error' && errorKey ? (
        <p className="font-sans text-[12px] font-semibold text-red-500">
          {t(errorKey as 'submitError')}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === 'sending'}
        className={`self-center h-9 px-5 rounded-full font-sans text-[12px] font-bold disabled:opacity-40 ${
          isLight
            ? 'bg-[#0B0B0C] text-[#F5F5F7]'
            : 'bg-[#F5F5F7] text-[#0B0B0C]'
        }`}
      >
        {status === 'sending' ? t('sending') : t('submit')}
      </button>
    </form>
  );
}
