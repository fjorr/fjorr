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
import { DialsPanel } from '@/components/BrowseFilterPanels';

export type BrowseControlPanel = 'dials' | null;

/**
 * Mode / type / dials row. Mixes live in the Search|Mixes split bar above.
 */
export default function BrowseControlBar({
  sentinelRef,
}: {
  sentinelRef?: Ref<HTMLDivElement | null>;
}) {
  const tf = useTranslations('MinimalList');
  const { isTimeline } = useDisplayMode();
  const { sort, theme } = useMinimalFilter();
  const [panel, setPanel] = useState<BrowseControlPanel>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const dialsHaveValue = isTimeline
    ? theme !== 'all'
    : sort !== 'newest' || theme !== 'all';

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
      className="relative z-0 w-full max-w-sm flex flex-col items-center gap-3"
    >
      <div className="flex w-full items-center justify-center gap-1.5 sm:gap-2 flex-nowrap">
        <ContentTypeToggle />
        <DisplayModeToggle />

        <div className="inline-flex shrink-0 items-center gap-0.5 rounded-[8px] p-0.5 bg-page-chip">
          <button
            type="button"
            onClick={() => setPanel((p) => (p === 'dials' ? null : 'dials'))}
            className={`h-8 px-2.5 sm:px-3 rounded-[6px] font-sans text-xs font-semibold transition-colors inline-flex items-center gap-1.5 whitespace-nowrap ${
              panel === 'dials' || dialsHaveValue
                ? 'bg-page-chip-active text-page'
                : 'text-page-faint hover:text-page-muted'
            }`}
            aria-expanded={panel === 'dials'}
          >
            {tf('filter')}
            {dialsHaveValue && (
              <span
                className="w-1.5 h-1.5 rounded-full bg-[#0071E3] dark:bg-[#ffd446]"
                aria-hidden
              />
            )}
          </button>
        </div>
      </div>

      {panel === 'dials' && (
        <div className="w-full self-stretch">
          <DialsPanel />
        </div>
      )}

      <QueryStatusBar />
    </div>
  );
}
