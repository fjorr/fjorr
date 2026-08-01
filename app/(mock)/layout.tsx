import type { Metadata } from 'next';

/** Throwaway client-mock shell — no Fjorr chrome. Delete with /preview. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function MockLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-screen antialiased bg-white text-[#171717]"
        style={{ fontFamily: 'Montserrat, Arial, sans-serif' }}
      >
        {children}
      </body>
    </html>
  );
}
