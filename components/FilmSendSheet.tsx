'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { absoluteUrl } from '@/lib/site';
import {
  fetchOwnShareIdentity,
  shareViaMemberNumber,
} from '@/lib/own-member-client';
import { formatCueClock } from '@/lib/vtt';
import { filmSharePath } from '@/lib/voyage-via';
import { storySettingDisplay } from '@/lib/story-year';

type FilmSendSheetProps = {
  open: boolean;
  onClose: () => void;
  film: {
    id?: string | null;
    name?: string | null;
    slug: string;
    teaser?: string | null;
    runtime?: number | null;
    blok_tall?: string | null;
    hero_tall?: string | null;
    storyDate?: string | null;
    location?: string | string[] | { name?: string } | null;
  };
  /** Last known playback / cue time in seconds (shows timestamp copy when >= 1). */
  shareSeconds?: number | null;
};

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

function formatLocation(
  raw: string | string[] | { name?: string } | null | undefined
): string | null {
  if (!raw) return null;
  if (typeof raw === 'string') return raw.trim() || null;
  if (Array.isArray(raw)) {
    const parts = raw.map((v) => String(v).trim()).filter(Boolean);
    return parts.length ? parts.join(', ') : null;
  }
  if (typeof raw === 'object' && raw.name) return String(raw.name).trim() || null;
  return null;
}

const LINK_CLASS =
  'block w-full border-0 bg-transparent p-0 text-center font-sans text-[15px] font-semibold tracking-tight text-white no-underline transition-opacity hover:opacity-55';

/**
 * Share sheet — language-card shell, identity header, text action list.
 */
export default function FilmSendSheet({
  open,
  onClose,
  film,
  shareSeconds = null,
}: FilmSendSheetProps) {
  const t = useTranslations('Film');
  const panelRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [memberNumber, setMemberNumber] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      const identity = await fetchOwnShareIdentity();
      if (!cancelled) setMemberNumber(shareViaMemberNumber(identity));
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const filmUrl = useMemo(
    () => absoluteUrl(filmSharePath({ slug: film.slug, memberNumber })),
    [film.slug, memberNumber]
  );
  const embedUrl = useMemo(
    () => absoluteUrl(`/embed/film/${film.slug}`),
    [film.slug]
  );

  const timeSeconds =
    typeof shareSeconds === 'number' &&
    Number.isFinite(shareSeconds) &&
    shareSeconds >= 1
      ? Math.floor(shareSeconds)
      : null;

  const timeUrl =
    timeSeconds != null
      ? absoluteUrl(
          filmSharePath({
            slug: film.slug,
            memberNumber,
            atSeconds: timeSeconds,
          })
        )
      : null;
  const timeLabel = timeSeconds != null ? formatCueClock(timeSeconds) : null;

  const momentText =
    timeUrl && timeLabel
      ? t('sendMomentText', {
          title: film.name || 'Fjorr',
          time: timeLabel,
        })
      : null;
  const momentPayload =
    momentText && timeUrl ? `${momentText}\n${timeUrl}` : null;

  const shareUrl = timeUrl || filmUrl;
  const shareMessage =
    momentPayload ||
    (film.teaser
      ? `${film.name || 'Fjorr'}\n${film.teaser}\n${shareUrl}`
      : `${film.name || 'Fjorr'}\n${shareUrl}`);
  const emailSubject = t('sendEmailSubject', {
    title: film.name || 'Fjorr',
  });
  const smsHref = `sms:?&body=${encodeURIComponent(shareMessage)}`;
  const emailHref = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(shareMessage)}`;

  const setting = storySettingDisplay(film.storyDate);
  const place = formatLocation(film.location);
  const metaLine = [setting, place].filter(Boolean).join(' ') || null;

  const embedSnippet = `<iframe src="${embedUrl}" title="${(film.name || 'Fjorr').replace(/"/g, '&quot;')} — Fjorr" width="100%" height="100%" style="aspect-ratio:16/9;width:100%;border:0;border-radius:12px;overflow:hidden" allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe>`;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.body.dataset.fjorrOverlay = 'send';
    document.addEventListener('keydown', onKey);
    return () => {
      if (document.body.dataset.fjorrOverlay === 'send') {
        delete document.body.dataset.fjorrOverlay;
      }
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setCopied(null);
  }, [open]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  const markCopied = (key: string) => {
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1600);
  };

  const handleCopy = async (key: string, text: string) => {
    try {
      await copyText(text);
      markCopied(key);
    } catch {
      // ignore
    }
  };

  return createPortal(
    <div
      className="pointer-events-auto fixed inset-0 z-[100050] flex items-center justify-center p-5"
      onClick={onClose}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div className="absolute inset-0 bg-black/55" aria-hidden />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('send')}
        className="relative flex w-[min(72vw,16.5rem)] flex-col rounded-[22px] px-6 pb-10 pt-10 duration-200 animate-in fade-in zoom-in-95 md:w-[18rem] md:rounded-[28px] md:px-7 md:pb-12 md:pt-12"
        style={{ backgroundColor: '#0B0B0C' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <p className="m-0 font-sans text-[13px] font-medium leading-none tracking-tight text-white/45">
            {t('send')}
          </p>
          <p className="m-0 mt-2.5 font-interTight text-[22px] font-bold leading-none tracking-tight text-white md:text-[24px]">
            {film.name}
          </p>
          {metaLine || timeLabel ? (
            <p className="m-0 mt-2 max-w-[14rem] font-sans text-[12px] font-medium leading-snug text-white/40">
              {timeLabel
                ? [metaLine, t('sendMomentMeta', { time: timeLabel })]
                    .filter(Boolean)
                    .join(' · ')
                : metaLine}
            </p>
          ) : null}
        </div>

        {momentPayload && timeLabel ? (
          <button
            type="button"
            onClick={() => handleCopy('moment', momentPayload)}
            className={`${LINK_CLASS} mt-8`}
          >
            {copied === 'moment'
              ? t('sendCopied')
              : t('sendMoment', { time: timeLabel })}
          </button>
        ) : null}

        <div
          className={`flex flex-col items-center gap-4 ${momentPayload && timeLabel ? 'mt-4' : 'mt-8'}`}
        >
          <button
            type="button"
            onClick={() => handleCopy('link', filmUrl)}
            className={LINK_CLASS}
          >
            {copied === 'link' ? t('sendCopied') : t('sendCopyLink')}
          </button>
          <a href={emailHref} onClick={onClose} className={LINK_CLASS}>
            {t('sendEmail')}
          </a>
          <a href={smsHref} onClick={onClose} className={LINK_CLASS}>
            {t('sendMessages')}
          </a>
          <button
            type="button"
            onClick={() => handleCopy('embed', embedSnippet)}
            className={LINK_CLASS}
          >
            {copied === 'embed' ? t('sendCopied') : t('sendCopyEmbed')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
