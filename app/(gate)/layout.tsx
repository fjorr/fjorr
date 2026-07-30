import TypekitLoader from '@/components/TypekitLoader';
import { fontVariables } from '@/lib/fonts';
import { TYPEKIT_HREF } from '@/lib/typekit';

/** Site password gate — outside locale routing. */
export default function GateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fontVariables} dark`}>
      <head>
        <link rel="stylesheet" href={TYPEKIT_HREF} />
      </head>
      <body className="font-sans antialiased text-light-01 min-h-screen">
        <TypekitLoader />
        {children}
      </body>
    </html>
  );
}
