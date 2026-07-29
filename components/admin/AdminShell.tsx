'use client';

import React, { useEffect, useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';

type NavLeaf = { href: string; label: string; exact?: boolean };

type NavFolder = {
  id: string;
  label: string;
  children: NavLeaf[];
};

const FOLDERS: NavFolder[] = [
  {
    id: 'intelligence',
    label: 'Intelligence',
    children: [
      { href: '/admin', label: 'Overview', exact: true },
      { href: '/admin/nominations', label: 'Nominations' },
      { href: '/admin/bounties', label: 'Bounties' },
    ],
  },
  {
    id: 'plus',
    label: 'Plus Machine',
    children: [{ href: '/admin/plus', label: 'Notes' }],
  },
  {
    id: 'bureaux',
    label: 'Bureaux',
    children: [{ href: '/admin/bureaux', label: 'Roster' }],
  },
];

function leafActive(pathname: string, item: NavLeaf) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function folderActive(pathname: string, folder: NavFolder) {
  return folder.children.some((child) => leafActive(pathname, child));
}

/**
 * Control — Fjorr admin chrome.
 * Dark, quiet, functional. No marketing Futura.
 */
export default function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() || '';
  const [openById, setOpenById] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(FOLDERS.map((f) => [f.id, true]))
  );

  useEffect(() => {
    setOpenById((prev) => {
      const next = { ...prev };
      for (const folder of FOLDERS) {
        if (folderActive(pathname, folder)) next[folder.id] = true;
      }
      return next;
    });
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#1F1F1F] text-white flex flex-col md:flex-row">
      <aside className="w-full md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-white/8 px-6 py-8 md:min-h-screen flex flex-col gap-10">
        <div className="flex flex-col gap-1">
          <Link
            href="/"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/35 hover:text-white/60 transition-colors w-fit"
          >
            Fjorr
          </Link>
          <p className="font-sans text-[15px] font-semibold tracking-tight text-white/90">
            Control
          </p>
        </div>

        <nav className="flex flex-col gap-5">
          {FOLDERS.map((folder) => {
            const open = openById[folder.id] ?? true;
            return (
              <div key={folder.id} className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setOpenById((prev) => ({
                      ...prev,
                      [folder.id]: !prev[folder.id],
                    }))
                  }
                  aria-expanded={open}
                  className="flex items-center justify-between gap-2 w-full text-left font-sans text-[14px] font-semibold tracking-tight text-white/70 hover:text-white transition-colors py-0.5"
                >
                  <span>{folder.label}</span>
                  <span
                    className={`font-mono text-[10px] text-white/35 transition-transform duration-200 ${
                      open ? 'rotate-90' : ''
                    }`}
                    aria-hidden
                  >
                    ›
                  </span>
                </button>

                <div
                  className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                    open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden min-h-0">
                    <ul className="flex flex-col gap-1 pl-3 mt-1.5 border-l border-white/10">
                      {folder.children.map((item) => {
                        const active = leafActive(pathname, item);
                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              className={`block font-sans text-[13px] font-semibold tracking-tight py-0.5 transition-opacity ${
                                active
                                  ? 'text-white cursor-default'
                                  : 'text-white/40 hover:text-white/70'
                              }`}
                              aria-current={active ? 'page' : undefined}
                            >
                              {item.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="md:mt-auto flex flex-col gap-3 pt-4 border-t border-white/8">
          <p className="font-mono text-[11px] text-white/30 truncate" title={email}>
            {email}
          </p>
          <Link
            href="/"
            className="font-sans text-[13px] font-semibold text-white/40 hover:text-white/70 transition-colors w-fit"
          >
            ← Site
          </Link>
        </div>
      </aside>

      <main className="flex-1 min-w-0 px-6 sm:px-10 py-10 sm:py-12">{children}</main>
    </div>
  );
}
