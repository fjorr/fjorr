import { fontVariables } from '@/lib/fonts';

/** Fallback when no locale segment is available. */
export default function GlobalNotFound() {
  return (
    <html lang="en" className={`${fontVariables} dark`}>
      <body className="font-sans antialiased min-h-screen bg-[#1f1f1f] text-white flex items-center justify-center">
        <p className="font-sans text-sm">Page not found.</p>
      </body>
    </html>
  );
}
