import { cookies } from 'next/headers';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ColorSchemeProvider } from '@/components/ColorSchemeProvider';
import { AuthPresenceProvider } from '@/components/AuthPresenceProvider';
import { HouseOverlayProvider } from '@/components/HouseOverlayProvider';
import { fontVariables } from '@/lib/fonts';
import { COLOR_SCHEME_COOKIE, parseColorScheme } from '@/lib/color-scheme';
import { routing } from '@/i18n/routing';
import type { Viewport } from 'next';

/**
 * Skip server-only / rarely-hydrated namespaces on the client.
 * Pages that need these use getTranslations on the server, or a nested provider.
 */
const CLIENT_SKIP_NAMESPACES = new Set([
  'Privacy',
  'Terms',
  'Meta',
  'About',
  'Auth',
]);

/** Keep iOS from auto-zooming the search field and sticking the scale. */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const allMessages = await getMessages();
  const messages = Object.fromEntries(
    Object.entries(allMessages as Record<string, unknown>).filter(
      ([ns]) => !CLIENT_SKIP_NAMESPACES.has(ns),
    ),
  );
  const cookieStore = await cookies();
  const initialScheme = parseColorScheme(
    cookieStore.get(COLOR_SCHEME_COOKIE)?.value
  );
  const schemeClass = initialScheme === 'light' ? 'light' : 'dark';

  return (
    <html lang={locale} className={`${fontVariables} ${schemeClass}`}>
      <body className="font-sans antialiased text-base min-h-screen bg-[var(--page-bg)] text-[var(--page-fg)]">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ColorSchemeProvider initialScheme={initialScheme}>
            <AuthPresenceProvider>
              <HouseOverlayProvider>{children}</HouseOverlayProvider>
            </AuthPresenceProvider>
          </ColorSchemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
