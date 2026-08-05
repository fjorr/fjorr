'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import ManualMiniSite from '@/components/help/ManualMiniSite';
import type { ManualAudience } from '@/lib/help/content';

function focusableIn(root: HTMLElement): HTMLElement[] {
  const nodes = root.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  return Array.from(nodes).filter(
    (el) =>
      !el.hasAttribute('disabled') &&
      el.getAttribute('aria-hidden') !== 'true' &&
      el.tabIndex !== -1 &&
      el.offsetParent !== null
  );
}

/**
 * Same Manual mini-site card — presented as an overlay from the site.
 * Portaled to body so parent transforms (e.g. slide-up) don’t shrink `fixed`.
 */
export default function ManualCardModal({
  open,
  onClose,
  initialSlug,
  audience = 'guest',
  bureauxNumber = null,
}: {
  open: boolean;
  onClose: () => void;
  initialSlug: string;
  audience?: ManualAudience;
  bureauxNumber?: number | null;
}) {
  const t = useTranslations('Help');
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [plateOpen, setPlateOpen] = useState(false);
  const plateOpenRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  plateOpenRef.current = plateOpen;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setPlateOpen(false);
      return;
    }

    restoreFocusRef.current =
      (document.activeElement as HTMLElement | null) ?? null;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const root = rootRef.current;
    const inerted: HTMLElement[] = [];
    if (root) {
      for (const child of Array.from(document.body.children)) {
        if (child === root || !(child instanceof HTMLElement)) continue;
        if (child.hasAttribute('inert')) continue;
        child.setAttribute('inert', '');
        inerted.push(child);
      }
    }

    const focusFirst = () => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusables = focusableIn(dialog);
      (focusables[0] ?? dialog).focus();
    };
    const focusTimer = window.setTimeout(focusFirst, 0);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Plate owns Escape while open (stopImmediatePropagation there).
        if (plateOpenRef.current) return;
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusables = focusableIn(dialog);
      if (focusables.length === 0) {
        e.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !dialog.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
      for (const el of inerted) el.removeAttribute('inert');
      restoreFocusRef.current?.focus?.();
      restoreFocusRef.current = null;
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      ref={rootRef}
      className="fixed inset-0 z-[100060] flex items-center justify-center p-3 sm:p-8 text-left"
    >
      <button
        type="button"
        aria-label={t('close')}
        onClick={onClose}
        className="manual-modal-scrim-in absolute inset-0 bg-black/50 backdrop-blur-md"
        tabIndex={-1}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="manual-modal-card-in relative z-[1] w-full max-w-[28rem] text-left overflow-visible outline-none"
      >
        <span id={titleId} className="sr-only">
          {t('title')}
        </span>
        <ManualMiniSite
          mode="modal"
          slug={initialSlug}
          audience={audience}
          bureauxNumber={bureauxNumber}
          onExit={onClose}
          onPlateOpenChange={setPlateOpen}
        />
      </div>
    </div>,
    document.body
  );
}
