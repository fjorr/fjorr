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
  'w-full rounded-[10px] border border-white/10 bg-[#1F1F1F]/95 backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.45)] p-4 flex flex-col gap-3 max-h-[min(60vh,420px)] overflow-y-auto';

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
          ? 'bg-white/15 text-white'
          : 'bg-white/5 text-white/55 hover:text-white/85 hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}

function OptionRow({
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
      className={`text-left w-full h-10 px-3 rounded-[6px] font-sans text-[13px] font-semibold transition-colors ${
        active
          ? 'bg-white/15 text-white'
          : 'text-white/55 hover:text-white/85 hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}

/** Mix list for the shared browse control panel. */
export function MixesPanel({ onDone }: { onDone?: () => void }) {
  const tf = useTranslations('MinimalList');
  const { mix, setMix, mixes } = useMinimalFilter();

  const listItems = useMemo(() => {
    const comingSoonLabel = capitalizeLabel(tf('comingSoon'));
    const fromDb = mixes
      .filter((m) => m.slug !== COMING_SOON_MIX_SLUG)
      .map((m) => ({ ...m, name: capitalizeLabel(m.name) }));
    return [
      { slug: COMING_SOON_MIX_SLUG, name: comingSoonLabel, filmIds: [] as string[] },
      ...fromDb,
    ];
  }, [mixes, tf]);

  return (
    <div className={panelShellClass}>
      <OptionRow
        active={mix === 'all'}
        onClick={() => {
          setMix('all');
          onDone?.();
        }}
      >
        {capitalizeLabel(tf('allMixes'))}
      </OptionRow>
      {listItems.map((item) => (
        <OptionRow
          key={item.slug}
          active={mix === item.slug}
          onClick={() => {
            setMix(item.slug);
            onDone?.();
          }}
        >
          {item.name}
        </OptionRow>
      ))}
    </div>
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
          <p className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/35">
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
          <p className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/35">
            {tf('theme')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <OptionChip active={theme === 'all'} onClick={() => setTheme('all')}>
              {tf('allThemes')}
            </OptionChip>
            {themes.map((name) => (
              <OptionChip
                key={name}
                active={theme === name}
                onClick={() => setTheme(name)}
              >
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </OptionChip>
            ))}
          </div>
        </div>
      )}

      {dialsActive && (
        <button
          type="button"
          onClick={() => clearFilters()}
          className="self-start font-sans text-[12px] font-semibold text-white/40 hover:text-white/70 transition-colors"
        >
          {tf('clear')}
        </button>
      )}
    </div>
  );
}
