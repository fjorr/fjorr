'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';
import { Icon } from '@/components/ui/Icons';
import { localeLabels, locales, stripLocalePrefix, type AppLocale } from '@/i18n/config';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import ColorSchemeToggle from '@/components/ColorSchemeToggle';

const SignInForm = dynamic(() => import('@/components/SignInForm'), {
  ssr: false,
  loading: () => (
    <div className="h-40 w-full animate-pulse rounded-lg bg-white/5" aria-hidden />
  ),
});

interface NavbarProps {
  variant?: 'light' | 'dark';
}

const EXPLORE_LINKS = [
  { href: '/', labelKey: 'films' as const },
  { href: '/nominate', labelKey: 'nominate' as const },
  { href: '/partner', labelKey: 'partner' as const },
  { href: '/about', labelKey: 'about' as const },
];

type PanelMode = 'closed' | 'nav' | 'lang' | 'auth';

const TAGLINE_SCROLL_PX = 40;

function Navbar({ variant = 'light' }: NavbarProps) {
  const t = useTranslations('Nav');
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname() || '';
  const [isTheaterOpen, setIsTheaterOpen] = useState(false);
  const [panel, setPanel] = useState<PanelMode>('closed');
  const [authNextPath, setAuthNextPath] = useState('/account');
  const [emailCopied, setEmailCopied] = useState(false);
  const [scrolledPast, setScrolledPast] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const contactEmail = 'scout@fjorr.com';

  const isOpen = panel !== 'closed';
  const showCloseIcon = panel === 'nav' || panel === 'auth';
  const textColor = variant === 'light' ? 'text-white' : 'text-black';
  const subTextColor = variant === 'light' ? 'text-white/80' : 'text-black/80';
  const iconColor = variant === 'light' ? 'text-white/55' : 'text-black/45';
  const mutedLabel = variant === 'light' ? 'text-white/50' : 'text-black/50';
  // Compact on scroll; expand again when a menu is open so the panel isn’t cramped.
  const showTagline = !scrolledPast || isOpen;

  const openGlassStyle = isOpen
    ? {
        backgroundColor:
          variant === 'light'
            ? 'color-mix(in srgb, var(--page-bg-color, #1F1F1F) 78%, transparent)'
            : 'color-mix(in srgb, var(--page-bg-color, #EDE8DF) 82%, transparent)',
        backdropFilter: 'blur(28px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(28px) saturate(1.4)',
        transform: 'translateZ(0)',
      }
    : undefined;
  const openGlassClass =
    variant === 'light'
      ? 'border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.35)]'
      : 'border-black/5 menu-surface';
  const glassAnimClass =
    variant === 'light' ? 'animate-nav-glass' : 'animate-nav-glass-light';

  const closePanel = () => setPanel('closed');

  const toggleNav = () => {
    setPanel((current) =>
      current === 'nav' || current === 'auth' ? 'closed' : 'nav',
    );
  };

  const toggleLang = () => {
    setPanel((current) => (current === 'lang' ? 'closed' : 'lang'));
  };

  const openAuth = (nextPath = '/account') => {
    setAuthNextPath(nextPath);
    setPanel('auth');
  };

  const setLocale = (next: AppLocale) => {
    if (next === locale) {
      setPanel('closed');
      return;
    }
    setPanel('closed');
    // Prefer the real URL, then strip any locale prefix. Hook pathname can
    // still include a prefix if client locale briefly disagrees with the URL
    // (which produced paths like /es/de).
    const raw =
      typeof window !== 'undefined' ? window.location.pathname : pathname;
    const href = stripLocalePrefix(raw || '/') || '/';
    router.replace(href, { locale: next });
  };

  useEffect(() => {
    if (panel !== 'nav') setEmailCopied(false);
  }, [panel]);

  // Slogan on every page load / route; hide only after scroll.
  useEffect(() => {
    setScrolledPast(false);
    const onScroll = () => {
      setScrolledPast(window.scrollY > TAGLINE_SCROLL_PX);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  useEffect(() => {
    const handleHide = () => {
      setIsTheaterOpen(true);
      setPanel('closed');
    };
    const handleShow = () => setIsTheaterOpen(false);
    const handleOpenSignIn = (event: Event) => {
      const detail = (event as CustomEvent<{ nextPath?: string }>).detail;
      openAuth(detail?.nextPath || '/account');
    };

    window.addEventListener('fjorr_hide_main_navbar', handleHide);
    window.addEventListener('fjorr_show_main_navbar', handleShow);
    window.addEventListener('fjorr_open_signin', handleOpenSignIn);
    return () => {
      window.removeEventListener('fjorr_hide_main_navbar', handleHide);
      window.removeEventListener('fjorr_show_main_navbar', handleShow);
      window.removeEventListener('fjorr_open_signin', handleOpenSignIn);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setPanel('closed');
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPanel('closed');
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  if (isTheaterOpen) return null;

  /** Scales down on narrow viewports; truncate is the last-resort fit for long locales. */
  const taglineClass =
    'font-sans font-medium tracking-normal whitespace-nowrap text-[clamp(9px,0.2rem+1.7vw,12px)]';

  return (
    <header className="sticky top-0 z-50 w-full h-[56px] pt-[12px] px-4 flex justify-center pointer-events-none overflow-visible">
      <div
        ref={panelRef}
        className="relative h-[44px] pointer-events-auto w-full max-w-[calc(100vw-2rem)] sm:w-max"
      >
        <div
          className="flex h-[44px] w-full pl-3 pr-4 sm:pl-5 sm:pr-[30px] items-center gap-3 sm:gap-5 opacity-0 pointer-events-none select-none sm:w-max"
          aria-hidden
        >
          <div className="w-[50px] shrink-0" />
          {showTagline ? (
            <span className={`${taglineClass} min-w-0 flex-1 truncate sm:flex-initial`}>
              {t('tagline')}
            </span>
          ) : null}
          <div className="w-[4.75rem] shrink-0" />
        </div>

        <div
          style={openGlassStyle}
          className={`
            absolute left-0 right-0 flex flex-col border
            transition-[top,padding,border-radius,background-color,border-color,backdrop-filter] duration-300 ease-out
            ${isOpen
              ? `${openGlassClass} -top-3 pt-3 rounded-b-[10px] rounded-t-none overflow-visible`
              : `top-0 rounded-[10px] overflow-visible ${glassAnimClass}`}
          `}
        >
          <div className="flex h-[44px] w-full pl-3 pr-4 sm:pl-5 sm:pr-[30px] items-center gap-3 sm:gap-5">
            <Link
              href="/"
              onClick={closePanel}
              className={`w-[50px] flex items-center cursor-pointer shrink-0 translate-y-[1.5px] ${textColor}`}
            >
              <svg viewBox="0 0 143 81" className="w-full h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M71.3559 13.2942C60.8993 13.2942 52.4273 21.7814 52.4273 32.2448C52.4273 42.7082 60.9046 51.1953 71.3559 51.1953C81.8073 51.1953 90.2846 42.7082 90.2846 32.2448C90.2846 21.7814 81.8073 13.2942 71.3559 13.2942ZM71.3559 39.7278C67.232 39.7278 63.8869 36.3789 63.8869 32.2501C63.8869 28.1214 67.232 24.7725 71.3559 24.7725C75.4799 24.7725 78.825 28.1214 78.825 32.2501C78.825 36.3789 75.4799 39.7278 71.3559 39.7278Z" fill="currentColor"/>
                <path d="M35.9047 15.0355C35.4032 15.0355 34.9978 15.4414 34.9978 15.9435V60.9377C34.9978 65.4136 31.5887 69.0883 27.23 69.505C26.7605 69.5477 26.403 69.9322 26.403 70.4023V80.0912C26.403 80.6146 26.8405 81.0206 27.3633 80.9992C37.996 80.4971 46.4627 71.7109 46.4627 60.9377V15.9435C46.4627 15.4414 46.0573 15.0355 45.5558 15.0355H35.9047Z" fill="currentColor"/>
                <path d="M0 0.908003V48.498C0 49.0001 0.405462 49.406 0.906954 49.406H11.9931C12.4946 49.406 12.9001 49.0001 12.9001 48.498V35.1397C12.9001 34.6376 13.3055 34.2317 13.807 34.2317H26.0616C26.5631 34.2317 26.9685 33.8258 26.9685 33.3237V23.6615C26.9685 23.1594 26.5631 22.7535 26.0616 22.7535H13.807C13.3055 22.7535 12.9001 22.3476 12.9001 21.8455V12.3755C12.9001 11.8735 13.3055 11.4675 13.807 11.4675H27.4967C27.9982 11.4675 28.4037 11.0616 28.4037 10.5595V0.908003C28.4037 0.405931 27.9982 0 27.4967 0H0.906954C0.405462 0 0 0.405931 0 0.908003Z" fill="currentColor"/>
                <path d="M116.309 15.9435V22.7375C116.309 23.2395 115.402 23.6455 115.402 23.6455H108.509C108.066 23.6455 107.709 24.0033 107.709 24.4466V48.5568C107.709 49.0589 107.303 49.4648 106.802 49.4648H97.1508C96.6493 49.4648 96.2438 49.0589 96.2438 48.5568V15.9435C96.2438 15.4414 96.6493 15.0355 97.1508 15.0355H115.402C115.903 15.0355 116.309 15.4414 116.309 15.9435Z" fill="currentColor"/>
                <path d="M143 15.9435V22.7375C143 23.2395 142.595 23.6455 142.093 23.6455H135.2C134.757 23.6455 134.4 24.0033 134.4 24.4466V48.5568C134.4 49.0589 133.994 49.4648 133.493 49.4648H123.842C123.34 49.4648 122.935 49.0589 122.935 48.5568V15.9435C122.935 15.4414 123.34 15.0355 123.842 15.0355H142.093C142.595 15.0355 143 15.4414 143 15.9435Z" fill="currentColor"/>
              </svg>
            </Link>

            <div
              className={`min-w-0 overflow-hidden transition-[flex,opacity,max-width] duration-300 ease-out ${
                showTagline
                  ? 'flex-1 sm:flex-initial opacity-100 max-w-[22rem]'
                  : 'flex-none opacity-0 max-w-0 pointer-events-none'
              }`}
            >
              <Link
                href="/about"
                onClick={closePanel}
                tabIndex={showTagline ? undefined : -1}
                aria-hidden={!showTagline}
                className="flex items-center min-w-0 overflow-hidden cursor-pointer transition-opacity hover:opacity-80"
              >
                <span className={`${taglineClass} truncate select-none ${subTextColor}`}>
                  {t('tagline')}
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-3 shrink-0 ml-auto sm:ml-0">
              <button
                type="button"
                aria-label={showCloseIcon ? t('closeMenu') : t('openMenu')}
                aria-expanded={showCloseIcon}
                onClick={toggleNav}
                className={`relative w-[18px] h-[18px] cursor-pointer shrink-0 transition-opacity hover:opacity-80 ${iconColor}`}
              >
                <span
                  className={`absolute left-1/2 top-1/2 block w-[14px] h-[1.5px] rounded-full bg-current transition-transform duration-300 ease-out origin-center
                    ${showCloseIcon ? '-translate-x-1/2 -translate-y-1/2 rotate-45' : '-translate-x-1/2 -translate-y-[3.5px]'}`}
                />
                <span
                  className={`absolute left-1/2 top-1/2 block w-[14px] h-[1.5px] rounded-full bg-current transition-transform duration-300 ease-out origin-center
                    ${showCloseIcon ? '-translate-x-1/2 -translate-y-1/2 -rotate-45' : '-translate-x-1/2 translate-y-[3.5px]'}`}
                />
              </button>

              <button
                type="button"
                aria-label={t('language')}
                aria-expanded={panel === 'lang'}
                onClick={toggleLang}
                className={`flex items-center gap-1.5 shrink-0 transition-opacity hover:opacity-80 ${iconColor}`}
              >
                <Icon name="globe" className="w-[18px] h-[18px]" />
                <span className="font-mono text-[11px] font-medium uppercase tracking-[0.05em] leading-none">
                  {locale}
                </span>
              </button>
            </div>
          </div>

          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-out ${
              isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            }`}
          >
            <div className="overflow-hidden min-h-0">
              {panel === 'lang' ? (
                <div className="px-[30px] pb-11 pt-4 flex flex-col gap-2">
                  <p className={`font-sans text-[13px] font-medium ${mutedLabel}`}>
                    {t('languages')}
                  </p>
                  <nav className="flex flex-col gap-1.5">
                    {locales.map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setLocale(code)}
                        className={`text-left font-sans text-[15px] font-semibold tracking-tight transition-opacity hover:opacity-70 ${
                          locale === code
                            ? variant === 'light'
                              ? 'text-white/35 cursor-default'
                              : 'text-black/35 cursor-default'
                            : textColor
                        }`}
                      >
                        {localeLabels[code]}
                      </button>
                    ))}
                  </nav>
                </div>
              ) : panel === 'auth' ? (
                <div className="px-[30px] pb-11 pt-4">
                  <SignInForm
                    key={authNextPath}
                    nextPath={authNextPath}
                    layout="menu"
                    variant={variant}
                  />
                </div>
              ) : (
                <div className="px-[30px] pb-11 pt-4 flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
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
                            onClick={closePanel}
                            className={`font-sans text-[15px] font-semibold tracking-tight transition-opacity hover:opacity-70 ${textColor}`}
                          >
                            {label}
                          </Link>
                        );
                      })}
                    </nav>
                  </div>

                  <div
                    className={`pt-5 flex flex-col gap-2 border-t ${
                      variant === 'light' ? 'border-white/10' : 'border-black/8'
                    }`}
                  >
                    <p className={`font-sans text-[13px] font-medium leading-snug ${mutedLabel}`}>
                      {t('contactBlurb')}
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

                  <div
                    className={`pt-5 flex items-center border-t ${
                      variant === 'light' ? 'border-white/10' : 'border-black/8'
                    }`}
                  >
                    <ColorSchemeToggle />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .animate-nav-glass {
          background-color: color-mix(in srgb, var(--page-bg-color, #1F1F1F) 72%, transparent);
          border-color: rgba(255, 255, 255, 0.1);
          -webkit-backdrop-filter: blur(24px) saturate(1.4);
          backdrop-filter: blur(24px) saturate(1.4);
          transform: translateZ(0);
        }

        .animate-nav-glass-light {
          background-color: color-mix(in srgb, var(--page-bg-color, #EDE8DF) 78%, transparent);
          border-color: rgba(0, 0, 0, 0.06);
          -webkit-backdrop-filter: blur(24px) saturate(1.4);
          backdrop-filter: blur(24px) saturate(1.4);
          transform: translateZ(0);
        }

        @keyframes revealGlass {
          from {
            background-color: transparent;
            border-color: transparent;
            backdrop-filter: blur(0px);
            -webkit-backdrop-filter: blur(0px);
          }
          to {
            background-color: color-mix(in srgb, var(--page-bg-color, #1F1F1F) 72%, transparent);
            border-color: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(24px) saturate(1.4);
            -webkit-backdrop-filter: blur(24px) saturate(1.4);
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
            background-color: color-mix(in srgb, var(--page-bg-color, #EDE8DF) 78%, transparent);
            border-color: rgba(0, 0, 0, 0.06);
            backdrop-filter: blur(24px) saturate(1.4);
            -webkit-backdrop-filter: blur(24px) saturate(1.4);
          }
        }

        @supports (animation-timeline: scroll()) {
          .animate-nav-glass {
            background-color: transparent;
            border-color: transparent;
            backdrop-filter: blur(0px);
            -webkit-backdrop-filter: blur(0px);
            animation: revealGlass linear both;
            animation-timeline: scroll(root);
            animation-range: 40px 90px;
          }

          .animate-nav-glass-light {
            background-color: transparent;
            border-color: transparent;
            backdrop-filter: blur(0px);
            -webkit-backdrop-filter: blur(0px);
            animation: revealGlassLight linear both;
            animation-timeline: scroll(root);
            animation-range: 40px 90px;
          }
        }
      `,
        }}
      />
    </header>
  );
}

export default Navbar;
