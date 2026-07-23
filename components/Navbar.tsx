'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface NavbarProps {
  variant?: 'light' | 'dark';
}

const EXPLORE_LINKS = [
  { href: '/', labelKey: 'films' as const },
  { href: '/nominate', labelKey: 'nominate' as const },
  { href: '/partner', labelKey: 'partner' as const },
  { href: '/about', labelKey: 'about' as const },
];

function Navbar({ variant = 'light' }: NavbarProps) {
  const t = useTranslations('Nav');
  const pathname = usePathname() || '';
  const [isTheaterOpen, setIsTheaterOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const contactEmail = 'scout@fjorr.com';

  const textColor = variant === 'light' ? 'text-white' : 'text-black';
  const subTextColor = variant === 'light' ? 'text-white/80' : 'text-black/80';
  const mutedLabel = variant === 'light' ? 'text-white/55' : 'text-black/55';
  // Tint glass with --page-bg-color (set on artifact pages) so it stays near the page hue.
  // Falls back to site defaults on non-artifact routes.
  const openGlassStyle = isMenuOpen
    ? {
        backgroundColor:
          variant === 'light'
            ? 'color-mix(in srgb, var(--page-bg-color, #1F1F1F) 55%, transparent)'
            : 'color-mix(in srgb, var(--page-bg-color, #EDE8DF) 72%, transparent)',
        backdropFilter: 'blur(28px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(28px) saturate(1.4)',
      }
    : undefined;
  const openGlassClass =
    variant === 'light'
      ? 'border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.35)]'
      : 'border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.1)]';
  const glassAnimClass =
    variant === 'light' ? 'animate-nav-glass' : 'animate-nav-glass-light';

  useEffect(() => {
    if (!isMenuOpen) setEmailCopied(false);
  }, [isMenuOpen]);

  useEffect(() => {
    const handleHide = () => {
      setIsTheaterOpen(true);
      setIsMenuOpen(false);
    };
    const handleShow = () => setIsTheaterOpen(false);

    window.addEventListener('fjorr_hide_main_navbar', handleHide);
    window.addEventListener('fjorr_show_main_navbar', handleShow);
    return () => {
      window.removeEventListener('fjorr_hide_main_navbar', handleHide);
      window.removeEventListener('fjorr_show_main_navbar', handleShow);
    };
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isMenuOpen]);

  if (isTheaterOpen) return null;

  return (
    <header className="sticky top-0 z-50 w-full h-[70px] pt-[20px] px-4 flex justify-center pointer-events-none overflow-visible">
      <div ref={panelRef} className="relative h-[50px] pointer-events-auto">
        {/* In-flow width lock — keeps header height fixed while menu floats */}
        <div
          className="flex h-[50px] px-[30px] items-center gap-[20px] opacity-0 pointer-events-none select-none"
          aria-hidden
        >
          <div className="w-[50px] shrink-0" />
          <span className="font-sans text-xs font-medium tracking-normal whitespace-nowrap">
            {t('tagline')}
          </span>
          <div className="w-[18px] shrink-0" />
        </div>

        {/* Floating glass panel — expands over page content; open state runs off top of screen */}
        <div
          style={openGlassStyle}
          className={`
            absolute left-0 right-0 flex flex-col border overflow-hidden
            transition-[top,padding,border-radius,background-color,border-color,backdrop-filter] duration-300 ease-out
            ${isMenuOpen
              ? `${openGlassClass} -top-9 pt-9 rounded-b-[10px] rounded-t-none`
              : `top-0 rounded-[10px] border-transparent ${glassAnimClass}`}
          `}
        >
          <div className="flex h-[50px] px-[30px] items-center gap-[20px]">
            <Link
              href="/"
              onClick={() => setIsMenuOpen(false)}
              className={`w-[50px] flex items-center cursor-pointer shrink-0 ${textColor}`}
            >
              <svg viewBox="0 0 143 81" className="w-full h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M71.3559 13.2942C60.8993 13.2942 52.4273 21.7814 52.4273 32.2448C52.4273 42.7082 60.9046 51.1953 71.3559 51.1953C81.8073 51.1953 90.2846 42.7082 90.2846 32.2448C90.2846 21.7814 81.8073 13.2942 71.3559 13.2942ZM71.3559 39.7278C67.232 39.7278 63.8869 36.3789 63.8869 32.2501C63.8869 28.1214 67.232 24.7725 71.3559 24.7725C75.4799 24.7725 78.825 28.1214 78.825 32.2501C78.825 36.3789 75.4799 39.7278 71.3559 39.7278Z" fill="currentColor"/>
                <path d="M35.9047 15.0355C35.4032 15.0355 34.9978 15.4414 34.9978 15.9435V60.9377C34.9978 65.4136 31.5887 69.0883 27.23 69.505C26.7605 69.5477 26.403 69.9322 26.403 70.4023V80.0912C26.403 80.6146 26.8405 81.0206 27.3633 80.9992C37.996 80.4971 46.4627 71.7109 46.4627 60.9377V15.9435C46.4627 15.4414 46.0573 15.0355 45.5558 15.0355H35.9047Z" fill="currentColor"/>
                <path d="M0 0.908003V48.498C0 49.0001 0.405462 49.406 0.906954 49.406H11.9931C12.4946 49.406 12.9001 49.0001 12.9001 48.498V35.1397C12.9001 34.6376 13.3055 34.2317 13.807 34.2317H26.0616C26.5631 34.2317 26.9685 33.8258 26.9685 33.3237V23.6615C26.9685 23.1594 26.5631 22.7535 26.0616 22.7535H13.807C13.3055 22.7535 12.9001 22.3476 12.9001 21.8455V12.3755C12.9001 11.8735 13.3055 11.4675 13.807 11.4675H27.4967C27.9982 11.4675 28.4037 11.0616 28.4037 10.5595V0.908003C28.4037 0.405931 27.9982 0 27.4967 0H0.906954C0.405462 0 0 0.405931 0 0.908003Z" fill="currentColor"/>
                <path d="M116.309 15.9435V22.7375C116.309 23.2395 115.402 23.6455 115.402 23.6455H108.509C108.066 23.6455 107.709 24.0033 107.709 24.4466V48.5568C107.709 49.0589 107.303 49.4648 106.802 49.4648H97.1508C96.6493 49.4648 96.2438 49.0589 96.2438 48.5568V15.9435C96.2438 15.4414 96.6493 15.0355 97.1508 15.0355H115.402C115.903 15.0355 116.309 15.4414 116.309 15.9435Z" fill="currentColor"/>
                <path d="M143 15.9435V22.7375C143 23.2395 142.595 23.6455 142.093 23.6455H135.2C134.757 23.6455 134.4 24.0033 134.4 24.4466V48.5568C134.4 49.0589 133.994 49.4648 133.493 49.4648H123.842C123.34 49.4648 122.935 49.0589 122.935 48.5568V15.9435C122.935 15.4414 123.34 15.0355 123.842 15.0355H142.093C142.595 15.0355 143 15.4414 143 15.9435Z" fill="currentColor"/>
              </svg>
            </Link>

            <Link
              href="/about"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center shrink-0 cursor-pointer transition-opacity hover:opacity-80"
            >
              <span className={`font-sans text-xs font-medium tracking-normal select-none whitespace-nowrap ${subTextColor}`}>
                {t('tagline')}
              </span>
            </Link>

            <button
              type="button"
              aria-label={isMenuOpen ? t('closeMenu') : t('openMenu')}
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((open) => !open)}
              className={`relative w-[18px] h-[18px] cursor-pointer shrink-0 transition-opacity hover:opacity-70 ${textColor}`}
            >
              <span
                className={`absolute left-1/2 top-1/2 block w-[14px] h-[1.5px] rounded-full bg-current transition-transform duration-300 ease-out origin-center
                  ${isMenuOpen ? '-translate-x-1/2 -translate-y-1/2 rotate-45' : '-translate-x-1/2 -translate-y-[3.5px]'}`}
              />
              <span
                className={`absolute left-1/2 top-1/2 block w-[14px] h-[1.5px] rounded-full bg-current transition-transform duration-300 ease-out origin-center
                  ${isMenuOpen ? '-translate-x-1/2 -translate-y-1/2 -rotate-45' : '-translate-x-1/2 translate-y-[3.5px]'}`}
              />
            </button>
          </div>

          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-out ${
              isMenuOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            }`}
          >
            <div className="overflow-hidden min-h-0">
              <div className="px-[30px] pb-11 pt-4 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <p className={`font-sans text-xs font-medium ${mutedLabel}`}>{t('explore')}</p>
                  <nav className="flex flex-col gap-1.5">
                    {EXPLORE_LINKS.map((item) => {
                      const isActive =
                        item.href === '/'
                          ? pathname === '/'
                          : pathname === item.href || pathname.startsWith(`${item.href}/`);
                      const activeMuted =
                        variant === 'light' ? 'text-white/35' : 'text-black/35';
                      const label = t(item.labelKey);

                      if (isActive) {
                        return (
                          <span
                            key={item.href}
                            aria-current="page"
                            className={`font-sans text-[15px] font-semibold tracking-tight cursor-default select-none ${activeMuted}`}
                          >
                            {label}
                          </span>
                        );
                      }

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className={`font-sans text-[15px] font-semibold tracking-tight transition-opacity hover:opacity-70 ${textColor}`}
                        >
                          {label}
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                <div className="flex flex-col gap-2">
                  <p className={`font-sans text-xs font-medium ${mutedLabel}`}>{t('contact')}</p>
                  <p className={`font-sans text-[13px] font-medium leading-snug ${
                    variant === 'light' ? 'text-white/50' : 'text-black/50'
                  }`}>
                    Ideas, partnerships, or something worth making. We&apos;re here for it.
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(contactEmail);
                        setEmailCopied(true);
                        window.setTimeout(() => setEmailCopied(false), 3500);
                      } catch (err) {
                        console.error('Clipboard copy failed:', err);
                      }
                    }}
                    className={`mt-1 self-start h-8 px-3 rounded-[6px] font-sans text-[13px] font-semibold transition-colors ${
                      emailCopied
                        ? variant === 'light'
                          ? 'bg-white/10 text-white/55 cursor-default'
                          : 'bg-black/8 text-black/50 cursor-default'
                        : variant === 'light'
                          ? 'bg-white/15 text-white hover:bg-white/22'
                          : 'bg-black/10 text-black hover:bg-black/15'
                    }`}
                  >
                    {emailCopied ? t('emailCopied') : t('letsTalk')}
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  <p className={`font-sans text-xs font-medium ${mutedLabel}`}>{t('language')}</p>
                  <LanguageSwitcher variant={variant} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes revealGlass {
          from {
            background-color: transparent;
            border-color: transparent;
            backdrop-filter: blur(0px);
            -webkit-backdrop-filter: blur(0px);
          }
          to {
            background-color: color-mix(in srgb, var(--page-bg-color, #1F1F1F) 40%, transparent);
            border-color: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(20px) saturate(1.3);
            -webkit-backdrop-filter: blur(20px) saturate(1.3);
          }
        }

        @keyframes revealGlassLight {
          from {
            background-color: transparent;
            border-color: transparent;
            backdrop-filter: blur(0px);
            -webkit-backdrop-filter: blur(0px);
          }
          to {
            background-color: color-mix(in srgb, var(--page-bg-color, #EDE8DF) 55%, transparent);
            border-color: rgba(0, 0, 0, 0.05);
            backdrop-filter: blur(20px) saturate(1.3);
            -webkit-backdrop-filter: blur(20px) saturate(1.3);
          }
        }

        .animate-nav-glass {
          animation: revealGlass linear both;
          animation-timeline: scroll(root);
          animation-range: 60px 100px;
        }

        .animate-nav-glass-light {
          animation: revealGlassLight linear both;
          animation-timeline: scroll(root);
          animation-range: 60px 100px;
        }
      `}} />
    </header>
  );
}

export default Navbar;
