import { cookies } from 'next/headers';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { DisplayModeProvider } from '@/components/DisplayModeProvider';
import { ColorSchemeProvider } from '@/components/ColorSchemeProvider';
import { AuthPresenceProvider } from '@/components/AuthPresenceProvider';
import { fontVariables } from '@/lib/fonts';
import { DISPLAY_MODE_COOKIE, parseDisplayMode } from '@/lib/display-mode';
import { COLOR_SCHEME_COOKIE, parseColorScheme } from '@/lib/color-scheme';
import { routing } from '@/i18n/routing';

/** Skip long legal copy on the client — pages read those via server getTranslations. */
const CLIENT_SKIP_NAMESPACES = new Set(['Privacy', 'Terms']);

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
  const initialMode = parseDisplayMode(
    cookieStore.get(DISPLAY_MODE_COOKIE)?.value
  );
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
              <DisplayModeProvider initialMode={initialMode}>
                {children}
              </DisplayModeProvider>
            </AuthPresenceProvider>
          </ColorSchemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
