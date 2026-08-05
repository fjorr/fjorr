import { fontVariables } from '@/lib/fonts';

/** Site password gate — outside locale routing. */
export default function GateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fontVariables} dark`}>
      <body className="font-sans antialiased text-light-01 min-h-screen">
        {children}
      </body>
    </html>
  );
}
