'use client';

import React from 'react';
import HouseFooter from '@/components/house/HouseFooter';
import { useHouseOverlay } from '@/components/HouseOverlayProvider';

/**
 * House footer for artifact exhibits — always in the viewport shell.
 * Chrome tone follows the artifact background (dark vs light), except
 * while a sheet is open — then it matches the white overlay stage.
 */
export default function ArtifactHouseFooter({
  isDarkBg,
  pageBg,
}: {
  isDarkBg: boolean;
  pageBg: string;
}) {
  const { active, isOpen, toggle } = useHouseOverlay();
  const sheetOpen = active != null;
  const variant = sheetOpen ? 'dark' : isDarkBg ? 'light' : 'dark';

  return (
    <div
      className={
        sheetOpen
          ? 'fixed inset-x-0 bottom-0 z-[60] w-full shrink-0 bg-white'
          : 'relative z-50 w-full shrink-0'
      }
      style={sheetOpen ? undefined : { backgroundColor: pageBg }}
    >
      <HouseFooter
        variant={variant}
        langOpen={isOpen('language')}
        shortcutsOpen={isOpen('shortcuts')}
        legalOpen={isOpen('legal')}
        onLanguage={() => toggle('language')}
        onShortcuts={() => toggle('shortcuts')}
        onLegal={() => toggle('legal')}
      />
    </div>
  );
}
