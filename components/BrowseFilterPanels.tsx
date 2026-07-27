'use client';

import React, { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useDisplayMode } from '@/components/DisplayModeProvider';
import {
  capitalizeLabel,
  useMinimalFilter,
} from '@/components/MinimalFilterContext';

const COMING_SOON_MIX_SLUG = 'coming-soon';

const panelShellClass =
  'w-full rounded-[10px] border border-page-faint bg-page-elevated menu-surface shadow-[0_16px_48px_rgba(0,0,0,0.18)] px-[30px] py-5 flex flex-col gap-3 max-h-[min(60vh,420px)] overflow-y-auto text-page';

function OptionChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 px-3 rounded-[6px] font-sans text-[12px] font-semibold transition-colors ${
        active
          ? 'bg-page-chip-active text-page'
          : 'bg-page-chip text-page-muted hover:text-page hover:bg-page-chip-hover'
      }`}
    >
      {children}
    </button>
  );
}

/** Mix list for the shared browse control panel — denser, menu-style. */
export function MixesPanel({ onDone }: { onDone?: () => void }) {
  const tf = useTranslations('MinimalList');
  const { mix, setMix, mixes } = useMinimalFilter();

  const listItems = useMemo(() => {
    const comingSoonLabel = capitalizeLabel(tf('comingSoon'));
    const fromDb = mixes
      .filter((m) => m.slug !== COMING_SOON_MIX_SLUG)
      .map((m) => ({ ...m, name: capitalizeLabel(m.name) }));
    return [
      { slug: 'all' as const, name: capitalizeLabel(tf('allMixes')) },
      { slug: COMING_SOON_MIX_SLUG, name: comingSoonLabel },
      ...fromDb.map((m) => ({ slug: m.slug, name: m.name })),
    ];
  }, [mixes, tf]);

  return (
    <nav
      className="w-full max-h-[min(42vh,260px)] overflow-y-auto overscroll-contain rounded-[10px] border border-page-faint bg-page-elevated menu-surface shadow-[0_16px_48px_rgba(0,0,0,0.18)] px-[30px] py-5 flex flex-col gap-1.5 text-page"
      aria-label={tf('mixes')}
    >
      {listItems.map((item) => {
        const active = mix === item.slug;
        if (active) {
          return (
            <span
              key={item.slug}
              aria-current="true"
              className="font-sans text-[15px] font-semibold tracking-tight text-page-faint cursor-default select-none leading-tight py-0.5"
            >
              {item.name}
            </span>
          );
        }
        return (
          <button
            key={item.slug}
            type="button"
            onClick={() => {
              setMix(item.slug);
              onDone?.();
            }}
            className="text-left font-sans text-[15px] font-semibold tracking-tight text-page leading-tight py-0.5 transition-opacity hover:opacity-70"
          >
            {item.name}
          </button>
        );
      })}
    </nav>
  );
}

/** Sort / theme dials for the shared browse control panel. */
export function DialsPanel() {
  const tf = useTranslations('MinimalList');
  const { isTimeline } = useDisplayMode();
  const {
    sort,
    setSort,
    theme,
    setTheme,
    themes,
    contentType,
    clearFilters,
  } = useMinimalFilter();

  const dialsActive = isTimeline
    ? theme !== 'all'
    : sort !== 'newest' || theme !== 'all';

  return (
    <div className={panelShellClass}>
      {!isTimeline && (
        <div className="flex flex-col gap-2">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-wide text-page-faint">
            {tf('sort')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <OptionChip active={sort === 'newest'} onClick={() => setSort('newest')}>
              {tf('newest')}
            </OptionChip>
            <OptionChip active={sort === 'az'} onClick={() => setSort('az')}>
              {tf('az')}
            </OptionChip>
            {contentType === 'film' && (
              <OptionChip active={sort === 'runtime'} onClick={() => setSort('runtime')}>
                {tf('runtime')}
              </OptionChip>
            )}
          </div>
        </div>
      )}

      {contentType === 'film' && (
        <div className="flex flex-col gap-2">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-wide text-page-faint">
            {tf('theme')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <OptionChip active={theme === 'all'} onClick={() => setTheme('all')}>
              {tf('allThemes')}
            </OptionChip>
            {themes.map((option) => (
              <OptionChip
                key={option.slug}
                active={theme === option.slug}
                onClick={() => setTheme(option.slug)}
              >
                {option.name.charAt(0).toUpperCase() + option.name.slice(1)}
              </OptionChip>
            ))}
          </div>
        </div>
      )}

      {dialsActive && (
        <button
          type="button"
          onClick={() => clearFilters()}
          className="self-start font-sans text-[12px] font-semibold text-page-faint hover:text-page-muted transition-colors"
        >
          {tf('clear')}
        </button>
      )}
    </div>
  );
}
