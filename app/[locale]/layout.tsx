import { cookies } from 'next/headers';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { DisplayModeProvider } from '@/components/DisplayModeProvider';
import TypekitLoader from '@/components/TypekitLoader';
import { fontVariables } from '@/lib/fonts';
import { DISPLAY_MODE_COOKIE, parseDisplayMode } from '@/lib/display-mode';
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

  return (
    <html lang={locale} className={`${fontVariables} dark`}>
      <body className="font-sans antialiased text-light-01 min-h-screen">
        <TypekitLoader />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <DisplayModeProvider initialMode={initialMode}>
            {children}
          </DisplayModeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
