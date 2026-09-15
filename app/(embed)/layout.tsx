import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { defaultLocale } from '@/i18n/config';
import { fontVariables } from '@/lib/fonts';

/** Embed player only needs theater + film copy. */
const EMBED_NAMESPACES = ['Film', 'Theater'] as const;

/** Bare shell for iframe embeds — no site chrome, stable unprefixed URLs. */
export default async function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  setRequestLocale(defaultLocale);
  const allMessages = await getMessages();
  const messages = Object.fromEntries(
    EMBED_NAMESPACES.map((ns) => [
      ns,
      (allMessages as Record<string, unknown>)[ns],
    ]).filter(([, v]) => v != null)
  );

  return (
    <html lang={defaultLocale} className={`${fontVariables} dark`}>
      <body className="font-sans antialiased text-light-01 min-h-screen">
        <NextIntlClientProvider locale={defaultLocale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
