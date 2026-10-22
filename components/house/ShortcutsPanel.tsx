'use client';

import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import SheetEnter from '@/components/house/SheetEnter';

export type ShortcutAction =
  | 'browse'
  | 'shuffle'
  | 'play'
  | 'info'
  | 'search'
  | 'close';

type Command = {
  id: ShortcutAction;
  keys: string;
  labelKey:
    | 'keysBrowse'
    | 'keysShuffle'
    | 'keysPlay'
    | 'keysInfo'
    | 'keysSearch'
    | 'keysClose';
};

const COMMANDS: Command[] = [
  { id: 'browse', keys: '', labelKey: 'keysBrowse' },
  { id: 'shuffle', keys: 'S', labelKey: 'keysShuffle' },
  { id: 'play', keys: 'Space', labelKey: 'keysPlay' },
  { id: 'info', keys: 'I', labelKey: 'keysInfo' },
  { id: 'search', keys: '⌘K', labelKey: 'keysSearch' },
  { id: 'close', keys: 'Esc', labelKey: 'keysClose' },
];

/** Shortcuts sheet. Two columns of grey chips. Labels only. */
export default function ShortcutsPanel() {
  const t = useTranslations('Film');

  return (
    <div
      role="dialog"
      aria-label={t('keysHint')}
      className="absolute inset-0 z-50 flex flex-col bg-white text-[#0B0B0C]"
    >
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6">
        <SheetEnter className="flex w-full max-w-[22rem] flex-col items-center">
          <h1 className="m-0 mb-8 text-center text-balance font-[family-name:var(--font-circular-black)] text-[clamp(2.25rem,5.5vw,3rem)] font-[900] leading-[1.05] tracking-[-0.045em] text-[#0B0B0C]">
            {t('keysTitle')}
          </h1>
          <ul className="m-0 grid w-full list-none grid-cols-2 grid-rows-3 gap-2.5 p-0">
            {COMMANDS.map((command) => (
              <li key={command.id}>
                <div className="flex h-12 w-full items-center justify-between gap-3 rounded-full bg-[#F5F5F7] px-4 font-sans text-[15px] font-medium tracking-tight text-[#0B0B0C]">
                  <span>{t(command.labelKey)}</span>
                  {command.id === 'browse' ? (
                    <span className="inline-flex items-center gap-1 text-black/45">
                      <ArrowLeft
                        className="h-3.5 w-3.5"
                        strokeWidth={2.25}
                        aria-hidden
                      />
                      <ArrowRight
                        className="h-3.5 w-3.5"
                        strokeWidth={2.25}
                        aria-hidden
                      />
                    </span>
                  ) : (
                    <span className="font-sans text-[13px] font-medium tracking-[0.04em] text-black/40">
                      {command.keys}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </SheetEnter>
      </div>
    </div>
  );
}
