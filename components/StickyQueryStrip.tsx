'use client';

import React, { useEffect, useRef, useState, type RefObject } from 'react';
import { useTranslations } from 'next-intl';
import { useDisplayMode } from '@/components/DisplayModeProvider';
import {
  useMinimalFilter,
  useQueryStatusLabels,
} from '@/components/MinimalFilterContext';
import { DialsPanel, MixesPanel } from '@/components/BrowseFilterPanels';
import { nextDisplayMode } from '@/lib/display-mode';

/** Navbar occupies 56px; leave 10px air before the sticky glass. */
const STICKY_TOP_PX = 66;

type Panel = 'mixes' | 'dials' | null;

/**
 * Compact sticky query strip — appears under the navbar once the in-flow
 * controls leave the viewport. Chips toggle mode/type or open Mixes / Dials.
 * Open panels match search-bar width and sit centered below the strip.
 */
export default function StickyQueryStrip({
  sentinelRef,
}: {
  sentinelRef: RefObject<HTMLElement | null>;
}) {
  const tf = useTranslations('MinimalList');
  const td = useTranslations('DisplayMode');
  const { mode, setMode, isTimeline } = useDisplayMode();
  const { mix, theme, sort, contentType, setContentType } = useMinimalFilter();
  const {
    modeLabel,
    typeLabel,
    mixLabel,
    dialLabels,
    filtersActive,
    clearFilters,
  } = useQueryStatusLabels();

  const [stuck, setStuck] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { threshold: 0, rootMargin: `-${STICKY_TOP_PX}px 0px 0px 0px` }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [sentinelRef]);

  useEffect(() => {
    if (!stuck) setPanel(null);
  }, [stuck]);

  useEffect(() => {
    if (!panel) return;
    const onPointerDown = (event: MouseEvent) => {
      if (stripRef.current && !stripRef.current.contains(event.target as Node)) {
        setPanel(null);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPanel(null);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [panel]);

  const dialsActive = isTimeline
    ? theme !== 'all'
    : sort !== 'newest' || theme !== 'all';

  if (!stuck) return null;

  return (
    <div
      className="fixed left-0 right-0 z-40 px-4 flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200"
      style={{ top: STICKY_TOP_PX }}
    >
      <div
        ref={stripRef}
        className="pointer-events-auto w-full max-w-sm flex flex-col items-center gap-2"
      >
        <div
          className="flex items-center justify-center gap-1 px-4 py-2.5 rounded-[10px] border border-page-faint w-fit max-w-full menu-surface"
          style={{
            backgroundColor:
              'color-mix(in srgb, var(--page-bg-color, #1F1F1F) 72%, transparent)',
            backdropFilter: 'blur(24px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
            transform: 'translateZ(0)',
          }}
        >
          <Chip
            onClick={() =>
              setContentType(contentType === 'film' ? 'artifact' : 'film')
            }
            title={td('toggleType')}
          >
            {typeLabel}
          </Chip>
          <Dot />
          <Chip
            onClick={() => setMode(nextDisplayMode(mode))}
            title={td('toggleMode')}
          >
            {modeLabel}
          </Chip>
          <Dot />
          <Chip
            active={panel === 'mixes' || mix !== 'all'}
            onClick={() => {
              setPanel((p) => (p === 'mixes' ? null : 'mixes'));
            }}
            title={tf('mixes')}
          >
            {mixLabel}
          </Chip>
          <Dot />
          <Chip
            active={panel === 'dials' || dialsActive}
            onClick={() => setPanel((p) => (p === 'dials' ? null : 'dials'))}
            muted={!dialsActive && panel !== 'dials'}
            title={tf('filter')}
          >
            <span className="sm:hidden">{tf('filter')}</span>
            <span className="hidden sm:inline">
              {dialLabels.length > 0 ? dialLabels.join(' · ') : tf('filter')}
            </span>
          </Chip>
          {filtersActive && (
            <>
              <Dot />
              <button
                type="button"
                onClick={() => {
                  clearFilters();
                  setPanel(null);
                }}
                className="shrink-0 font-sans text-[11px] font-semibold text-[#FF385C] hover:text-[#FF5A5F] transition-colors px-1"
              >
                {tf('clear')}
              </button>
            </>
          )}
        </div>

        {panel === 'mixes' && (
          <MixesPanel onDone={() => setPanel(null)} />
        )}
        {panel === 'dials' && <DialsPanel />}
      </div>
    </div>
  );
}
function Dot() {
  return <span className="text-page-faint font-sans text-[11px] select-none">·</span>;
}

function Chip({
  children,
  onClick,
  active,
  disabled,
  muted,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  muted?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`shrink-0 max-w-[9rem] truncate font-sans text-[11px] font-semibold transition-colors px-1 ${
        disabled
          ? 'text-page-faint cursor-not-allowed opacity-50'
          : active
            ? 'text-page'
            : muted
              ? 'text-page-faint hover:text-page-muted'
              : 'text-page-muted hover:text-page'
      }`}
    >
      {children}
    </button>
  );
}
