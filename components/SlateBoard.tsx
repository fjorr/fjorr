'use client';

import React, { useEffect, useLayoutEffect, useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { Check, Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import SheetEnter from '@/components/house/SheetEnter';
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
  const [noteOpen, setNoteOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
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
    setNoteOpen(false);
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

  const showSwitch = open && round.length > 1;

  return (
    <>
      <div
        aria-hidden
        onClick={() => setAboutOpen(false)}
        className={`fixed inset-0 z-40 bg-black/55 backdrop-blur-[8px] transition-opacity duration-300 motion-reduce:backdrop-blur-none motion-reduce:transition-none ${
          aboutOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <SheetEnter className="flex w-full flex-col items-center text-center">
        <h1 className="m-0 font-[family-name:var(--font-circular-black)] text-[clamp(2rem,4vw,2.75rem)] font-[900] leading-none tracking-[-0.035em] text-white">
          {t('headline')}
          {open ? <span className="ml-[0.28em]">{editionNo}</span> : null}
        </h1>
      </SheetEnter>
      {cycleDate ? (
        <SheetEnter delay={60} className="flex w-full justify-center">
          <p className="m-0 mt-3 inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 font-sans text-[15px] font-medium leading-none text-white/55 md:text-[17px]">
            {t('explainerClose')}
            <span className="inline-flex translate-y-[-1px] items-center rounded-[6px] bg-[#E8E8EA] px-2 py-1 font-sans text-[15px] font-semibold leading-none text-[#0B0B0C] md:text-[17px]">
              {cycleDate}
            </span>
            {open && round.length > 0 ? (
              <button
                type="button"
                aria-expanded={aboutOpen}
                aria-controls="slate-about"
                onClick={() => setAboutOpen((openAbout) => !openAbout)}
                className="ml-1 inline-flex translate-y-[-1px] items-center gap-1.5 font-sans text-[15px] font-medium text-white/55 md:text-[17px]"
              >
                {t('howItWorks')}
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-current md:h-[18px] md:w-[18px]">
                  <Plus className="h-2.5 w-2.5" strokeWidth={2.25} aria-hidden />
                </span>
              </button>
            ) : null}
          </p>
        </SheetEnter>
      ) : null}
      {open && story ? (
        <div className="mt-4 w-full md:mt-10">
          <SheetEnter delay={120} className="relative z-50 w-full">
          <div
            id="slate-about"
            className={`relative z-50 mx-auto aspect-[3/4] w-full max-w-[1000px] overflow-hidden rounded-[28px] md:aspect-[16/9] md:rounded-[36px] ${
              aboutOpen ? 'bg-[#2C2C2E]' : 'bg-[#2A2A2C]'
            }`}
          >
            {aboutOpen ? (
              <div className="absolute inset-0 flex items-center justify-center px-8 md:px-16">
                <button
                  type="button"
                  aria-label={t('aboutClose')}
                  onClick={() => setAboutOpen(false)}
                  className="absolute top-4 right-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition-colors hover:text-white md:top-5 md:right-5"
                >
                  <X className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </button>
                <div className="flex max-w-[36rem] flex-col items-center text-center">
                  <h2 className="m-0 font-[family-name:var(--font-circular-black)] text-[clamp(1.75rem,3vw,2.25rem)] font-[900] leading-[1.05] tracking-[-0.03em] text-white">
                    {t('aboutTitle')}
                  </h2>
                  <p className="m-0 mt-5 text-pretty font-sans text-[16px] font-medium leading-relaxed text-white/80 md:text-[18px]">
                    {t('aboutBody')}
                  </p>
                  <p className="m-0 mt-4 text-pretty font-sans text-[16px] font-medium leading-relaxed text-white/80 md:text-[18px]">
                    {t('aboutNote')}
                  </p>
                  <Link
                    href="/nominate"
                    className="mt-6 inline-flex h-9 items-center rounded-full bg-[#F2F2F2] px-4 font-sans text-[13px] font-semibold text-[#0B0B0C] transition-opacity hover:opacity-90"
                  >
                    {t('proposePill')}
                  </Link>
                </div>
              </div>
            ) : story.imageUrl ? (
              <Image
                key={story.id}
                src={story.imageUrl}
                alt=""
                fill
                priority
                sizes="(min-width: 1000px) 1000px, 100vw"
                className="object-cover"
              />
            ) : null}
          </div>
          </SheetEnter>

          <SheetEnter delay={200} className="w-full">
          {showSwitch ? (
            <div className="mt-4 flex justify-center md:mt-6">
              <div
                ref={listRef}
                role="tablist"
                aria-label={t('headline')}
                className="relative inline-flex shrink-0 items-center rounded-full bg-[#2C2C2E] p-1"
              >
                <span
                  aria-hidden
                  className={`pointer-events-none absolute top-1 left-0 h-9 rounded-full ${
                    active ? 'bg-[#0071E3]' : 'bg-white'
                  }`}
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
                        chosen
                          ? `${t('storyNumber', { n })}. ${t('yourVote')}`
                          : t('storyNumber', { n })
                      }
                      onClick={() => setIndex(itemIndex)}
                      className={`relative z-10 inline-flex h-9 shrink-0 items-center rounded-full px-3.5 font-sans text-[14px] font-semibold tabular-nums transition-colors duration-300 md:px-4 ${
                        on && chosen
                          ? 'text-white'
                          : on
                            ? 'text-[#0B0B0C]'
                            : chosen
                              ? 'text-[#64D2FF]'
                              : 'text-white/55 hover:text-white'
                      }`}
                    >
                      <span className="relative">{n}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="mx-auto mt-4 flex w-full max-w-[36rem] flex-col items-center text-center md:mt-6">
            <p className="m-0 text-pretty font-sans text-[16px] font-medium leading-relaxed text-white/55 md:text-[17px]">
              <span className="font-semibold text-white">{story.title}.</span>{' '}
              {story.logline}
            </p>
            {story.treatment ? (
              <div className="mt-3 flex w-full flex-col items-center">
                <button
                  type="button"
                  aria-expanded={noteOpen}
                  aria-controls="slate-story-note"
                  onClick={() => setNoteOpen((openNote) => !openNote)}
                  className="font-sans text-[15px] font-medium text-white underline decoration-white/30 underline-offset-[3px]"
                >
                  {noteOpen ? t('showLess') : t('learnMore')}
                </button>
                <div
                  className={`grid w-full transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
                    noteOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div id="slate-story-note" aria-hidden={!noteOpen} className="overflow-hidden">
                    <p className="m-0 mt-3 whitespace-pre-line text-pretty text-left font-sans text-[15px] font-medium leading-relaxed text-white/55 md:text-[16px]">
                      {story.treatment}
                    </p>
                    {story.source === 'member' && story.memberNumber != null ? (
                      <p className="m-0 mt-3 font-sans text-[13px] font-medium text-white/40">
                        {t('creditMember', { number: story.memberNumber })}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex flex-col items-center md:mt-6">
            {memberNotice ? (
              <Link
                href="/bureaux"
                className="inline-flex h-9 max-w-full items-center rounded-full bg-red-600 px-4 text-center font-sans text-[13px] font-semibold text-white"
              >
                {t('membersOnly')} {t('joinNow')}
              </Link>
            ) : (
              <button
                type="button"
                aria-pressed={active}
                disabled={voting && !active}
                onClick={() => choose(story.id)}
                className={`inline-flex h-9 max-w-full items-center gap-1.5 rounded-full px-4 text-center font-sans text-[13px] font-semibold transition-[background-color,color,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none hover:opacity-90 disabled:opacity-60 ${
                  active ? 'bg-[#0071E3] text-white' : 'bg-white text-[#0B0B0C]'
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
            <p className="m-0 mt-3 text-center font-sans text-[13px] font-medium text-white/40">
              {t('rules')}
            </p>
          </div>
          </SheetEnter>
        </div>
      ) : (
        <SheetEnter delay={120} className="flex w-full justify-center">
          <p className="m-0 mt-10 max-w-[24rem] text-center font-sans text-[16px] font-medium leading-relaxed text-white/45">
            {open ? t('empty') : t('closed')}
          </p>
        </SheetEnter>
      )}

      {voteError ? (
        <p className="m-0 mt-4 text-center font-sans text-[14px] font-medium text-white/45">
          {t('voteError')}
        </p>
      ) : null}
    </>
  );
}
