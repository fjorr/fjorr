import { cookies } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { DisplayModeProvider } from '@/components/DisplayModeProvider';
import { defaultLocale } from '@/i18n/config';
import { fontVariables } from '@/lib/fonts';
import { DISPLAY_MODE_COOKIE, parseDisplayMode } from '@/lib/display-mode';

/** Bare shell for iframe embeds — no site chrome, stable unprefixed URLs. */
export default async function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  setRequestLocale(defaultLocale);
  const messages = await getMessages();
  const cookieStore = await cookies();
  const initialMode = parseDisplayMode(
    cookieStore.get(DISPLAY_MODE_COOKIE)?.value
  );

  return (
    <html lang={defaultLocale} className={`${fontVariables} dark`}>
      <body className="font-sans antialiased text-light-01 min-h-screen">
        <NextIntlClientProvider locale={defaultLocale} messages={messages}>
          <DisplayModeProvider initialMode={initialMode}>
            {children}
          </DisplayModeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
