'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { fetchOwnBureauxActive } from '@/lib/bureaux-client';
import { submitFilmNote } from '@/lib/film-note-actions';
import { formatTimestamp } from '@/lib/film-note-time';

/** Short desk ticket from note id — matches Plus Logs. */
function noteTicket(id: string): string {
  const hex = id.replace(/-/g, '').slice(0, 8).toUpperCase();
  return `+M-${hex}`;
}

/**
 * Plus Machine craft desk under the Rams scrubber.
 * Title → note field → timecode + actions.
 */
export default function TheaterPlusPanel({
  filmId,
  atSeconds,
  isLight = false,
  onExit,
}: {
  filmId: string;
  filmSlug?: string;
  /** Live playhead — stamp follows the scrubber pin. */
  atSeconds: number;
  isLight?: boolean;
  onExit?: () => void;
}) {
  const t = useTranslations('Plus');
  const [bureauxActive, setBureauxActive] = useState<boolean | null>(null);
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>(
    'idle'
  );
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [sentTicket, setSentTicket] = useState<string | null>(null);

  const ink = isLight ? 'text-[#0B0B0C]' : 'text-[#F5F5F7]';
  const muted = isLight ? 'text-[#0B0B0C]/50' : 'text-[#F5F5F7]/50';
  const plusAccent = isLight ? 'text-[#1B6FBF]' : 'text-[#8FE0F2]';
  const fieldBg = isLight ? 'bg-[#E8E8EA]' : 'bg-[#2A2A2C]';
  const placeholder = isLight
    ? 'placeholder:text-[#0B0B0C]/40'
    : 'placeholder:text-[#F5F5F7]/40';
  const controlType =
    'font-interTight text-[15px] font-bold tracking-normal leading-none whitespace-nowrap';
  const sendBtn = isLight
    ? 'bg-[#0B0B0C] text-[#F5F5F7] hover:opacity-90'
    : 'bg-[#F5F5F7] text-[#0B0B0C] hover:opacity-90';
  const textBtn = `bg-transparent border-0 outline-none p-0 cursor-pointer ${controlType} ${ink} opacity-90 hover:opacity-100 transition-opacity`;

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
    setSentTicket(noteTicket(result.id));
    setStatus('sent');
  };

  if (bureauxActive === null) {
    return (
      <p className={`w-full font-sans text-[12px] ${muted}`}>{t('loading')}</p>
    );
  }

  if (!bureauxActive) {
    return (
      <div className="w-full flex flex-col gap-3">
        <span className={`font-interTight text-[16px] font-bold tracking-tight ${ink}`}>
          {t('logsTitle')}
        </span>
        <p className={`font-sans text-[14px] leading-snug ${muted}`}>
          {t('modeInvite')}
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/bureaux"
            className={`h-9 px-4 inline-flex items-center justify-center rounded-[8px] ${controlType} ${sendBtn}`}
          >
            {t('joinToNote')}
          </Link>
          {onExit ? (
            <button type="button" onClick={onExit} className={textBtn}>
              {t('craftClose')}
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  if (status === 'sent') {
    return (
      <div className="w-full flex flex-col gap-3">
        <span className={`font-interTight text-[16px] font-bold tracking-tight ${ink}`}>
          {t('logsTitle')}
        </span>
        <div
          className={`w-full rounded-[12px] px-4 py-3.5 flex flex-wrap items-center justify-between gap-3 ${fieldBg}`}
        >
          <div className="flex items-baseline gap-3 min-w-0">
            <p className={`font-sans text-[15px] font-medium ${ink}`}>
              {t('sentQuiet')}
            </p>
            {sentTicket ? (
              <span
                className={`font-mono text-[13px] tabular-nums tracking-wide ${plusAccent}`}
              >
                {sentTicket}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <Link href="/account/plus" className={textBtn}>
              {t('viewLogs')}
            </Link>
            <button
              type="button"
              onClick={() => {
                setStatus('idle');
                setSentTicket(null);
              }}
              className={textBtn}
            >
              {t('sendAnother')}
            </button>
            {onExit ? (
              <button type="button" onClick={onExit} className={textBtn}>
                {t('craftClose')}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  const stamp = formatTimestamp(atSeconds);

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full flex flex-col gap-3"
      data-ui-control="true"
    >
      <span className={`font-interTight text-[16px] font-bold tracking-tight ${ink}`}>
        {t('logsTitle')}
      </span>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        maxLength={1000}
        placeholder={t('bodyPlaceholder')}
        aria-label={t('atTime', { time: stamp })}
        className={`w-full min-h-[7.5rem] rounded-[12px] px-4 py-3.5 font-sans text-[16px] font-medium leading-relaxed resize-none border-0 ${fieldBg} ${ink} ${placeholder} focus:outline-none focus:ring-0`}
      />

      {status === 'error' && errorKey ? (
        <p className="font-sans text-[12px] text-red-500/90">
          {t(errorKey as 'submitError')}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`font-mono text-[15px] font-medium uppercase tracking-[0.06em] leading-none ${muted}`}
          >
            {t('craftTimecode')}
          </span>
          <span
            className={`font-mono text-[15px] font-medium tabular-nums tracking-tight leading-none ${plusAccent}`}
          >
            {stamp}
          </span>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <Link href="/manual/plus" className={textBtn}>
            {t('craftInfo')}
          </Link>
          {onExit ? (
            <button type="button" onClick={onExit} className={textBtn}>
              {t('craftClose')}
            </button>
          ) : null}
          <button
            type="submit"
            disabled={status === 'sending'}
            className={`h-9 px-4 inline-flex items-center justify-center rounded-[8px] ${controlType} disabled:opacity-40 transition-opacity ${sendBtn}`}
          >
            {status === 'sending' ? t('sending') : t('submit')}
          </button>
        </div>
      </div>
    </form>
  );
}
