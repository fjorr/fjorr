'use client';

import React, { useEffect, useRef, useState, type Ref } from 'react';
import { useTranslations } from 'next-intl';
import DisplayModeToggle from '@/components/DisplayModeToggle';
import ContentTypeToggle from '@/components/ContentTypeToggle';
import {
  QueryStatusBar,
  useMinimalFilter,
} from '@/components/MinimalFilterContext';
import { useDisplayMode } from '@/components/DisplayModeProvider';
import { DialsPanel, MixesPanel } from '@/components/BrowseFilterPanels';

export type BrowseControlPanel = 'mixes' | 'dials' | null;

/**
 * Mode / type / mixes / dials row + shared panel matching search bar width.
 */
export default function BrowseControlBar({
  sentinelRef,
}: {
  sentinelRef?: Ref<HTMLDivElement | null>;
}) {
  const tf = useTranslations('MinimalList');
  const { isTimeline } = useDisplayMode();
  const { mix, contentType, sort, theme } = useMinimalFilter();
  const [panel, setPanel] = useState<BrowseControlPanel>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const mixesDisabled = contentType === 'artifact';
  const dialsHaveValue = isTimeline
    ? theme !== 'all'
    : sort !== 'newest' || theme !== 'all';

  useEffect(() => {
    if (mixesDisabled && panel === 'mixes') setPanel(null);
  }, [mixesDisabled, panel]);

  useEffect(() => {
    if (!panel) return;
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
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

  const toggle = (next: Exclude<BrowseControlPanel, null>) => {
    setPanel((current) => (current === next ? null : next));
  };

  return (
    <div
      ref={(node) => {
        rootRef.current = node;
        if (typeof sentinelRef === 'function') sentinelRef(node);
        else if (sentinelRef && 'current' in sentinelRef) {
          (sentinelRef as React.MutableRefObject<HTMLDivElement | null>).current =
            node;
        }
      }}
      className="relative z-0 w-full max-w-sm flex flex-col items-center gap-3.5"
    >
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <DisplayModeToggle />
        <ContentTypeToggle />

        <button
          type="button"
          disabled={mixesDisabled}
          onClick={() => {
            if (mixesDisabled) return;
            toggle('mixes');
          }}
          className={`h-8 px-3 rounded-[6px] font-sans text-xs font-semibold transition-colors inline-flex items-center gap-1.5 ${
            mixesDisabled
              ? 'bg-white/[0.03] text-white/25 cursor-not-allowed'
              : panel === 'mixes' || mix !== 'all'
                ? 'bg-white/15 text-white'
                : 'bg-white/5 text-white/55 hover:text-white/80 hover:bg-white/10'
          }`}
          aria-expanded={panel === 'mixes'}
          aria-disabled={mixesDisabled}
        >
          {tf('mixes')}
          {!mixesDisabled && mix !== 'all' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#ffd446]" aria-hidden />
          )}
        </button>

        <button
          type="button"
          onClick={() => toggle('dials')}
          className={`h-8 px-3 rounded-[6px] font-sans text-xs font-semibold transition-colors inline-flex items-center gap-1.5 ${
            panel === 'dials' || dialsHaveValue
              ? 'bg-white/15 text-white'
              : 'bg-white/5 text-white/55 hover:text-white/80 hover:bg-white/10'
          }`}
          aria-expanded={panel === 'dials'}
        >
          {tf('filter')}
          {dialsHaveValue && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#ffd446]" aria-hidden />
          )}
        </button>
      </div>

      {panel === 'mixes' && !mixesDisabled && (
        <MixesPanel onDone={() => setPanel(null)} />
      )}
      {panel === 'dials' && <DialsPanel />}

      <QueryStatusBar />
    </div>
  );
}
