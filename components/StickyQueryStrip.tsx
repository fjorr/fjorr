'use client';

import React, { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useTranslations } from 'next-intl';
import { useDisplayMode } from '@/components/DisplayModeProvider';
import {
  capitalizeLabel,
  useMinimalFilter,
  useQueryStatusLabels,
} from '@/components/MinimalFilterContext';

const COMING_SOON_MIX_SLUG = 'coming-soon';
/** Navbar occupies 70px; leave 10px air before the sticky glass. */
const STICKY_TOP_PX = 80;

type Panel = 'mixes' | 'dials' | null;

/**
 * Compact sticky query strip — appears under the navbar once the in-flow
 * controls leave the viewport. Chips toggle mode/type or open Mixes / Dials.
 */
export default function StickyQueryStrip({
  sentinelRef,
}: {
  sentinelRef: RefObject<HTMLElement | null>;
}) {
  const tf = useTranslations('MinimalList');
  const { mode, setMode } = useDisplayMode();
  const {
    mix,
    setMix,
    mixes,
    sort,
    setSort,
    theme,
    setTheme,
    themes,
    contentType,
    setContentType,
    clearFilters,
  } = useMinimalFilter();
  const {
    modeLabel,
    typeLabel,
    mixLabel,
    dialLabels,
    queryActive,
    clearAll,
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

  const mixItems = useMemo(() => {
    const comingSoonLabel = capitalizeLabel(tf('comingSoon'));
    const fromDb = mixes
      .filter((m) => m.slug !== COMING_SOON_MIX_SLUG)
      .map((m) => ({ ...m, name: capitalizeLabel(m.name) }));
    return [
      { slug: COMING_SOON_MIX_SLUG, name: comingSoonLabel, filmIds: [] as string[] },
      ...fromDb,
    ];
  }, [mixes, tf]);

  const mixesDisabled = contentType === 'artifact';
  const dialsActive = sort !== 'newest' || theme !== 'all';

  if (!stuck) return null;

  return (
    <div
      className="fixed left-0 right-0 z-40 px-4 flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200"
      style={{ top: STICKY_TOP_PX }}
    >
      <div ref={stripRef} className="relative pointer-events-auto w-fit max-w-[calc(100vw-2rem)]">
        <div
          className="flex items-center justify-center gap-1 px-4 py-2.5 rounded-[10px] border border-white/10 bg-[#1F1F1F]/78 backdrop-blur-[28px] shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
          style={{ WebkitBackdropFilter: 'blur(28px) saturate(1.4)' }}
        >
          <Chip
            onClick={() => setMode(mode === 'minimal' ? 'cinematic' : 'minimal')}
            title="Toggle display mode"
          >
            {modeLabel}
          </Chip>
          <Dot />
          <Chip
            onClick={() =>
              setContentType(contentType === 'film' ? 'artifact' : 'film')
            }
            title="Toggle content type"
          >
            {typeLabel}
          </Chip>
          <Dot />
          <Chip
            active={panel === 'mixes' || mix !== 'all'}
            disabled={mixesDisabled}
            onClick={() => {
              if (mixesDisabled) return;
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
            {dialLabels.length > 0 ? dialLabels.join(' · ') : tf('filter')}
          </Chip>
          {queryActive && (
            <>
              <Dot />
              <button
                type="button"
                onClick={() => {
                  clearAll();
                  setPanel(null);
                }}
                className="shrink-0 font-sans text-[11px] font-semibold text-[#FF385C] hover:text-[#FF5A5F] transition-colors px-1"
              >
                {tf('clear')}
              </button>
            </>
          )}
        </div>

      {panel === 'mixes' && !mixesDisabled && (
        <div className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+8px)] z-30 w-[min(100vw-2.5rem,280px)] rounded-[10px] border border-white/10 bg-[#1F1F1F]/95 backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.45)] p-3 flex flex-col gap-1 max-h-[min(60vh,360px)] overflow-y-auto">
          <PanelOption
            active={mix === 'all'}
            onClick={() => {
              setMix('all');
              setPanel(null);
            }}
          >
            {capitalizeLabel(tf('allMixes'))}
          </PanelOption>
          {mixItems.map((item) => (
            <PanelOption
              key={item.slug}
              active={mix === item.slug}
              onClick={() => {
                setMix(item.slug);
                setPanel(null);
              }}
            >
              {item.name}
            </PanelOption>
          ))}
        </div>
      )}

      {panel === 'dials' && (
        <div className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+8px)] z-30 w-[min(100vw-2.5rem,320px)] rounded-[10px] border border-white/10 bg-[#1F1F1F]/95 backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.45)] p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/35">
              {tf('sort')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              <OptionPill active={sort === 'newest'} onClick={() => setSort('newest')}>
                {tf('newest')}
              </OptionPill>
              <OptionPill active={sort === 'az'} onClick={() => setSort('az')}>
                {tf('az')}
              </OptionPill>
              {contentType === 'film' && (
                <OptionPill
                  active={sort === 'runtime'}
                  onClick={() => setSort('runtime')}
                >
                  {tf('runtime')}
                </OptionPill>
              )}
            </div>
          </div>

          {contentType === 'film' && (
            <div className="flex flex-col gap-2">
              <p className="font-sans text-[11px] font-semibold uppercase tracking-wide text-white/35">
                {tf('theme')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                <OptionPill active={theme === 'all'} onClick={() => setTheme('all')}>
                  {tf('allThemes')}
                </OptionPill>
                {themes.map((name) => (
                  <OptionPill
                    key={name}
                    active={theme === name}
                    onClick={() => setTheme(name)}
                  >
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </OptionPill>
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
      )}
      </div>
    </div>
  );
}

function Dot() {
  return <span className="text-white/25 font-sans text-[11px] select-none">·</span>;
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
          ? 'text-white/25 cursor-not-allowed'
          : active
            ? 'text-white'
            : muted
              ? 'text-white/35 hover:text-white/70'
              : 'text-white/55 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

function PanelOption({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left h-9 px-3 rounded-[6px] font-sans text-[13px] font-semibold transition-colors ${
        active
          ? 'bg-white/15 text-white'
          : 'text-white/55 hover:text-white/85 hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}

function OptionPill({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 px-3 rounded-[6px] font-sans text-[12px] font-semibold transition-colors ${
        active
          ? 'bg-white/20 text-white'
          : 'bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}
