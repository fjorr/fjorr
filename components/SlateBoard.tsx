'use client';

import React, { useEffect, useLayoutEffect, useRef, useState, useTransition } from 'react';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { castSlateVote } from '@/lib/slate-actions';
import type { SlateStory } from '@/lib/slate-text';

const STORIES_PER_ROUND = 4;

export default function SlateBoard({
  open,
  stories,
  canVote,
  selectedId,
  cycleDate,
  editionNo,
}: {
  open: boolean;
  stories: SlateStory[];
  canVote: boolean;
  selectedId: string | null;
  cycleDate: string | null;
  editionNo: string;
}) {
  const t = useTranslations('Slate');
  const [selected, setSelected] = useState(selectedId);
  const [voteError, setVoteError] = useState(false);
  const [voting, startVote] = useTransition();
  const round = stories.slice(0, STORIES_PER_ROUND);
  const [index, setIndex] = useState(() => {
    const current = round.findIndex((story) => story.id === selectedId);
    return current >= 0 ? current : 0;
  });
  const listRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [pill, setPill] = useState<{ x: number; width: number } | null>(null);
  const [pillSlides, setPillSlides] = useState(false);
  const [memberNotice, setMemberNotice] = useState(false);

  useLayoutEffect(() => {
    const list = listRef.current;
    const tab = tabRefs.current[index];
    if (!list || !tab) return;
    const listBox = list.getBoundingClientRect();
    const tabBox = tab.getBoundingClientRect();
    setPill({ x: tabBox.left - listBox.left, width: tabBox.width });
  }, [index, round.length]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setPillSlides(true);
      }
    });
    const list = listRef.current;
    if (!list) return () => window.cancelAnimationFrame(frame);
    const place = () => {
      const tab = tabRefs.current[index];
      if (!tab) return;
      const listBox = list.getBoundingClientRect();
      const tabBox = tab.getBoundingClientRect();
      setPill({ x: tabBox.left - listBox.left, width: tabBox.width });
    };
    const observer = new ResizeObserver(place);
    observer.observe(list);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [index]);

  useEffect(() => {
    setMemberNotice(false);
  }, [index]);

  useEffect(() => {
    setSelected(selectedId);
  }, [selectedId]);

  const choose = (id: string) => {
    if (!canVote) {
      setMemberNotice(true);
      return;
    }
    if (voting || id === selected) return;
    const previous = selected;
    setVoteError(false);
    setMemberNotice(false);
    setSelected(id);
    startVote(async () => {
      const result = await castSlateVote(id);
      if (result.ok) return;
      setSelected(previous);
      if (result.code === 'signedOut' || result.code === 'notMember') {
        setMemberNotice(true);
        return;
      }
      setVoteError(true);
    });
  };

  const voted = Boolean(selected);
  const story = round[index] ?? round[0];
  const active = Boolean(story && selected === story.id);
  const voteLabel = active ? t('yourVote') : voted ? t('changeVote') : t('greenlight');
  const showSwitch = round.length > 1;

  return (
    <div className="relative flex w-full flex-1 flex-col">
      {story ? (
        <div className="flex w-full flex-1 flex-col items-center justify-center px-6 text-center">
          <h2 className="font-script m-0 flex min-h-[2.75em] max-w-[36ch] items-start justify-center text-balance text-[14pt] font-bold uppercase leading-snug tracking-normal text-[#0B0B0C] underline decoration-[#0B0B0C] underline-offset-[4px]">
            {story.title}
          </h2>
          {story.logline ? (
            <p className="font-script m-0 mt-5 min-h-[3.1em] max-w-[34rem] text-pretty text-[14pt] font-normal leading-[1.55] text-[#0B0B0C] md:mt-6">
              {story.logline}
            </p>
          ) : null}
          {open ? (
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {memberNotice ? (
                <Link
                  href="/bureaux"
                  className="inline-flex h-9 items-center rounded-full bg-red-600 px-4 font-sans text-[13px] font-semibold text-white"
                >
                  {t('joinToVote')}
                </Link>
              ) : (
                <button
                  type="button"
                  aria-pressed={active}
                  disabled={voting && !active}
                  onClick={() => choose(story.id)}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-full px-4 font-sans text-[13px] font-semibold transition-[background-color,color,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none hover:opacity-90 disabled:opacity-60 ${
                    active ? 'bg-[#0071E3] text-white' : 'bg-[#0B0B0C] text-white'
                  }`}
                >
                  {active ? (
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white">
                      <Check className="h-2.5 w-2.5" strokeWidth={2.75} aria-hidden />
                    </span>
                  ) : null}
                  {voteLabel}
                </button>
              )}
            </div>
          ) : null}
          {voteError ? (
            <p className="m-0 mt-4 font-sans text-[14px] font-medium text-black/45">
              {t('voteError')}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center px-6 text-center">
          <p className="m-0 max-w-[24rem] font-sans text-[17px] font-medium leading-relaxed text-black/45">
            {open ? t('empty') : t('closed')}
          </p>
        </div>
      )}

      <div className="flex flex-col items-center gap-3 px-6 pb-6">
        <div className="flex flex-col items-center gap-1">
          <p className="m-0 font-sans text-[13px] font-bold text-[#0B0B0C] md:text-[14px]">
            {t('headline')} {editionNo}
          </p>
          {cycleDate ? (
            <p className="m-0 font-sans text-[13px] font-medium text-black/45 md:text-[14px]">
              {open ? `${t('explainerClose')} ${cycleDate}` : t('closedOn', { date: cycleDate })}
            </p>
          ) : null}
        </div>
        {showSwitch ? (
          <div
            ref={listRef}
            role="tablist"
            aria-label={t('headline')}
            className="relative inline-flex items-center rounded-full bg-[#F5F5F7] p-1"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute top-1 left-0 h-9 rounded-full bg-[#0B0B0C]"
              style={{
                width: pill?.width ?? 0,
                transform: `translate3d(${pill?.x ?? 0}px, 0, 0)`,
                transition: pillSlides
                  ? 'transform 760ms cubic-bezier(0.2, 1.55, 0.32, 1), width 760ms cubic-bezier(0.2, 1.55, 0.32, 1), background-color 480ms cubic-bezier(0.22, 1, 0.36, 1)'
                  : 'none',
              }}
            />
            {round.map((item, itemIndex) => {
              const on = itemIndex === index;
              const chosen = selected === item.id;
              const n = String(itemIndex + 1).padStart(2, '0');
              return (
                <button
                  key={item.id}
                  ref={(node) => {
                    tabRefs.current[itemIndex] = node;
                  }}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  aria-label={
                    chosen ? `${t('storyNumber', { n })}. ${t('yourVote')}` : t('storyNumber', { n })
                  }
                  onClick={() => setIndex(itemIndex)}
                  className={`relative z-10 inline-flex h-9 shrink-0 items-center rounded-full px-3.5 font-sans text-[14px] font-semibold tabular-nums transition-colors duration-300 md:px-4 ${
                    on
                      ? 'text-white'
                      : chosen
                          ? 'text-[#0071E3]'
                          : 'text-black/40 hover:text-[#0B0B0C]'
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
