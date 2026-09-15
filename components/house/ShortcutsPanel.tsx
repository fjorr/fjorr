'use client';

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/ui/Icons';
import SheetEnter from '@/components/house/SheetEnter';

export type ShortcutAction =
  | 'browse'
  | 'shuffle'
  | 'play'
  | 'info'
  | 'search'
  | 'close';

type Props = {
  onAction: (action: ShortcutAction) => void;
  onClose: () => void;
};

type CommandSlide = {
  kind: 'command';
  id: ShortcutAction;
  keys: string;
  labelKey:
    | 'keysBrowse'
    | 'keysShuffle'
    | 'keysPlay'
    | 'keysInfo'
    | 'keysSearch'
    | 'keysClose';
  descKey:
    | 'keysBrowseDesc'
    | 'keysShuffleDesc'
    | 'keysPlayDesc'
    | 'keysInfoDesc'
    | 'keysSearchDesc'
    | 'keysCloseDesc';
};

type IntroSlide = { kind: 'intro' };

type Slide = IntroSlide | CommandSlide;

const COMMANDS: CommandSlide[] = [
  {
    kind: 'command',
    id: 'browse',
    keys: 'arrows',
    labelKey: 'keysBrowse',
    descKey: 'keysBrowseDesc',
  },
  {
    kind: 'command',
    id: 'shuffle',
    keys: 'S',
    labelKey: 'keysShuffle',
    descKey: 'keysShuffleDesc',
  },
  {
    kind: 'command',
    id: 'play',
    keys: 'Space',
    labelKey: 'keysPlay',
    descKey: 'keysPlayDesc',
  },
  {
    kind: 'command',
    id: 'info',
    keys: 'I',
    labelKey: 'keysInfo',
    descKey: 'keysInfoDesc',
  },
  {
    kind: 'command',
    id: 'search',
    keys: '⌘K',
    labelKey: 'keysSearch',
    descKey: 'keysSearchDesc',
  },
  {
    kind: 'command',
    id: 'close',
    keys: 'Esc',
    labelKey: 'keysClose',
    descKey: 'keysCloseDesc',
  },
];

const KEY_MAX_PX = 140;
const KEY_MIN_PX = 48;

/** Soft grey keycap — fixed height so slides don’t jump. */
function KeyCap({
  children,
  square = false,
}: {
  children: React.ReactNode;
  square?: boolean;
}) {
  return (
    <span
      className={
        square
          ? 'inline-flex h-[140px] w-[140px] shrink-0 items-center justify-center rounded-[22px] bg-[#E8E8ED] text-[#0B0B0C] md:h-[180px] md:w-[180px] md:rounded-[28px]'
          : 'inline-flex h-[140px] min-w-[140px] shrink-0 items-center justify-center rounded-[22px] bg-[#E8E8ED] px-8 text-[#0B0B0C] md:h-[180px] md:min-w-[180px] md:rounded-[28px] md:px-10'
      }
    >
      {children}
    </span>
  );
}

/** Huge Lucide arrows — each in its own square keycap. */
function SpecimenArrows() {
  return (
    <span className="flex items-center justify-center gap-3 md:gap-4">
      <KeyCap square>
        <ArrowLeft
          className="h-[72px] w-[72px] shrink-0 md:h-[100px] md:w-[100px]"
          strokeWidth={2.25}
          absoluteStrokeWidth
          aria-hidden
        />
      </KeyCap>
      <KeyCap square>
        <ArrowRight
          className="h-[72px] w-[72px] shrink-0 md:h-[100px] md:w-[100px]"
          strokeWidth={2.25}
          absoluteStrokeWidth
          aria-hidden
        />
      </KeyCap>
    </span>
  );
}

/** Huge command glyph in a keycap — one line, scales down only if needed. */
function SpecimenKey({
  text,
  asKey = true,
}: {
  text: string;
  /** Bare text when false; command glyphs get a keycap. */
  asKey?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);

  const fit = useCallback(() => {
    const el = ref.current;
    const measure = measureRef.current;
    if (!el || !measure) return;

    el.style.fontSize = `${KEY_MAX_PX}px`;
    let size = KEY_MAX_PX;
    while (size > KEY_MIN_PX && el.scrollWidth > measure.clientWidth) {
      size -= 2;
      el.style.fontSize = `${size}px`;
    }
  }, []);

  useLayoutEffect(() => {
    fit();
    const measure = measureRef.current;
    const ro =
      typeof ResizeObserver !== 'undefined' && measure
        ? new ResizeObserver(() => fit())
        : null;
    if (measure) ro?.observe(measure);
    window.addEventListener('resize', fit);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, [text, fit]);

  const glyph = (
    <span
      ref={ref}
      className="inline-block max-w-full whitespace-nowrap font-interTight font-bold leading-none tracking-tight text-[#0B0B0C]"
    >
      {text}
    </span>
  );

  // Single-letter keys (S, I) get a square keycap so they aren't pencil-narrow.
  const square = asKey && [...text].length === 1;

  return (
    <span
      ref={measureRef}
      className="flex w-full max-w-[min(92vw,720px)] items-center justify-center px-4 text-center"
    >
      {asKey ? <KeyCap square={square}>{glyph}</KeyCap> : glyph}
    </span>
  );
}

function specimenForCommand(command: CommandSlide) {
  return command.id === 'browse' ? (
    <SpecimenArrows />
  ) : (
    <SpecimenKey text={command.keys} />
  );
}

/** Intro — full-bleed key row that runs off both edges of the sheet. */
function IntroKeyRow() {
  const caps = useMemo(() => {
    const nodes: React.ReactNode[] = [];
    for (const command of COMMANDS) {
      if (command.id === 'browse') {
        nodes.push(
          <KeyCap key={`${command.id}-left`} square>
            <ArrowLeft
              className="h-[56px] w-[56px] shrink-0 md:h-[72px] md:w-[72px]"
              strokeWidth={2.25}
              absoluteStrokeWidth
              aria-hidden
            />
          </KeyCap>,
          <KeyCap key={`${command.id}-right`} square>
            <ArrowRight
              className="h-[56px] w-[56px] shrink-0 md:h-[72px] md:w-[72px]"
              strokeWidth={2.25}
              absoluteStrokeWidth
              aria-hidden
            />
          </KeyCap>
        );
        continue;
      }
      nodes.push(
        <KeyCap
          key={command.id}
          square={[...command.keys].length === 1}
        >
          <span className="whitespace-nowrap font-interTight text-[56px] font-bold leading-none tracking-tight text-[#0B0B0C] md:text-[72px]">
            {command.keys}
          </span>
        </KeyCap>
      );
    }
    return nodes;
  }, []);

  return (
    <div className="relative w-full overflow-hidden" aria-hidden>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-12 bg-gradient-to-r from-white to-transparent md:w-20" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-12 bg-gradient-to-l from-white to-transparent md:w-20" />
      <div className="relative left-1/2 flex w-max -translate-x-1/2 items-center gap-2.5 py-1 md:gap-3.5">
        {caps}
      </div>
    </div>
  );
}

/** Fixed specimen + copy slots so flipping slides doesn’t shift the nav. */
function SlideBody({
  specimen,
  title,
  body,
  onClick,
  intro = false,
}: {
  specimen: React.ReactNode;
  title?: string;
  body: string;
  onClick?: () => void;
  /** Intro lead is larger, with intentional line breaks. */
  intro?: boolean;
}) {
  const copy = (
    <>
      <span className="flex h-[160px] w-full items-center justify-center md:h-[200px]">
        {specimen}
      </span>
      <span className="mt-5 flex min-h-[5.75rem] w-full max-w-[min(92vw,28rem)] flex-col items-center justify-start gap-2 text-center md:mt-6 md:min-h-[6.25rem]">
        {title ? (
          <span className="font-sans text-[18px] font-semibold leading-tight tracking-tight text-[#0B0B0C] md:text-[20px]">
            {title}
          </span>
        ) : null}
        <span
          className={
            intro
              ? 'max-w-[20rem] whitespace-pre-line font-sans text-[18px] font-normal leading-snug tracking-tight text-black/45 md:max-w-[22rem] md:text-[20px]'
              : 'max-w-[17.5rem] text-balance font-sans text-[15px] font-normal leading-snug tracking-tight text-black/45 md:max-w-[18.5rem] md:text-[16px]'
          }
        >
          {body}
        </span>
      </span>
    </>
  );

  if (!onClick) {
    return (
      <div className="flex w-full max-w-[min(92vw,720px)] flex-col items-center text-center">
        {copy}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full max-w-[min(92vw,720px)] flex-col items-center border-0 bg-transparent p-0 text-center"
    >
      {copy}
    </button>
  );
}

/**
 * Shortcuts — intro, then one command at a time, centered.
 * Huge keycap glyph + label under; arrows below.
 */
export default function ShortcutsPanel({ onAction, onClose }: Props) {
  const t = useTranslations('Film');
  const slides: Slide[] = [{ kind: 'intro' }, ...COMMANDS];
  const [index, setIndex] = useState(0);
  const current = slides[Math.min(index, Math.max(slides.length - 1, 0))];

  const canPrev = index > 0;
  const canNext = index < slides.length - 1;

  const go = useCallback(
    (direction: -1 | 1) => {
      setIndex((i) => {
        const next = i + direction;
        if (next < 0 || next >= slides.length) return i;
        return next;
      });
    },
    [slides.length]
  );

  const runCurrent = useCallback(() => {
    if (!current) return;
    if (current.kind === 'intro') {
      go(1);
      return;
    }
    if (current.id === 'close') {
      onClose();
      return;
    }
    onAction(current.id);
  }, [current, go, onAction, onClose]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        go(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        go(1);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        runCurrent();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, runCurrent]);

  if (!current) return null;

  return (
    <div
      role="dialog"
      aria-label={t('keysHint')}
      className="absolute inset-0 z-50 flex flex-col overflow-hidden bg-white text-[#0B0B0C]"
    >
      {current.kind === 'intro' ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-8">
          <SheetEnter className="flex flex-col items-center gap-8">
            <IntroKeyRow />
          </SheetEnter>
          <SheetEnter
            delay={80}
            className="flex flex-col items-center gap-8 px-5 text-center md:gap-10 md:px-10"
          >
            <p className="m-0 max-w-[20rem] whitespace-pre-line font-sans text-[18px] font-normal leading-snug tracking-tight text-black/45 md:max-w-[22rem] md:text-[20px]">
              {t('keysLead')}
            </p>
            <button
              type="button"
              onClick={() => go(1)}
              className="inline-flex h-10 items-center justify-center rounded-full bg-[#0B0B0C] px-5 font-sans text-[14px] font-semibold tracking-tight text-white transition-opacity hover:opacity-85"
            >
              {t('keysStart')}
            </button>
          </SheetEnter>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-8 px-5 md:gap-10 md:px-10">
          <SheetEnter key={current.id} className="w-full max-w-[min(92vw,720px)]">
            <SlideBody
              specimen={specimenForCommand(current)}
              title={t(current.labelKey)}
              body={t(current.descKey)}
              onClick={runCurrent}
            />
          </SheetEnter>

          {slides.length > 1 ? (
            <SheetEnter delay={90}>
              <div className="flex shrink-0 items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  disabled={!canPrev}
                  aria-label={t('keysPrevious')}
                  className="flex h-9 w-9 items-center justify-center border-0 bg-transparent p-0 transition-opacity hover:enabled:opacity-80 disabled:cursor-default disabled:opacity-35"
                >
                  <Icon
                    name="circleNavBack"
                    className="!h-9 !w-9"
                    aria-hidden
                  />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  disabled={!canNext}
                  aria-label={t('keysNext')}
                  className="flex h-9 w-9 items-center justify-center border-0 bg-transparent p-0 transition-opacity hover:enabled:opacity-80 disabled:cursor-default disabled:opacity-35"
                >
                  <Icon
                    name="circleNavForward"
                    className="!h-9 !w-9"
                    aria-hidden
                  />
                </button>
              </div>
            </SheetEnter>
          ) : null}
        </div>
      )}
    </div>
  );
}
