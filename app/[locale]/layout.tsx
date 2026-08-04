import { cookies } from 'next/headers';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { DisplayModeProvider } from '@/components/DisplayModeProvider';
import { ColorSchemeProvider } from '@/components/ColorSchemeProvider';
import TypekitLoader from '@/components/TypekitLoader';
import { fontVariables } from '@/lib/fonts';
import { TYPEKIT_HREF } from '@/lib/typekit';
import { DISPLAY_MODE_COOKIE, parseDisplayMode } from '@/lib/display-mode';
import { COLOR_SCHEME_COOKIE, parseColorScheme } from '@/lib/color-scheme';
import { routing } from '@/i18n/routing';

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
  const messages = await getMessages();
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
      <head>
        <link rel="stylesheet" href={TYPEKIT_HREF} />
      </head>
      <body className="font-sans antialiased text-base min-h-screen bg-[var(--page-bg)] text-[var(--page-fg)]">
        <TypekitLoader />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ColorSchemeProvider initialScheme={initialScheme}>
            <DisplayModeProvider initialMode={initialMode}>
              {children}
            </DisplayModeProvider>
          </ColorSchemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
