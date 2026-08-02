import { getTranslations } from 'next-intl/server';

function Paras({ lines }: { lines: string[] }) {
  return (
    <div className="flex flex-col gap-3 font-sans text-[15px] leading-relaxed text-page-muted">
      {lines.map((line) => (
        <p key={line.slice(0, 64)}>{line}</p>
      ))}
    </div>
  );
}

export default async function PrivacyClient() {
  const t = await getTranslations('Privacy');

  const sections: { title: string; lines: string[] }[] = [
    {
      title: t('s1Title'),
      lines: [t('s1p1'), t('s1p2'), t('s1p3')],
    },
    {
      title: t('s2Title'),
      lines: [t('s2p1'), t('s2p2')],
    },
    {
      title: t('s3Title'),
      lines: [t('s3p1'), t('s3p2'), t('s3p3'), t('s3p4'), t('s3p5')],
    },
    {
      title: t('s4Title'),
      lines: [t('s4p1'), t('s4p2')],
    },
    {
      title: t('s5Title'),
      lines: [t('s5Body')],
    },
    {
      title: t('s6Title'),
      lines: [t('s6p1'), t('s6p2'), t('s6p3')],
    },
    {
      title: t('s7Title'),
      lines: [t('s7p1'), t('s7p2')],
    },
    {
      title: t('s8Title'),
      lines: [t('s8p1'), t('s8p2')],
    },
    {
      title: t('s9Title'),
      lines: [t('s9Body')],
    },
    {
      title: t('s10Title'),
      lines: [t('s10Body')],
    },
    {
      title: t('s11Title'),
      lines: [t('s11Body')],
    },
    {
      title: t('s12Title'),
      lines: [t('s12p1'), t('s12p2'), t('s12p3')],
    },
  ];

  const afterList: { title: string; lines: string[] }[] = [
    { title: t('s14Title'), lines: [t('s14Body')] },
    { title: t('s15Title'), lines: [t('s15Body')] },
  ];

  const doNotItems = [
    t('s13Item1'),
    t('s13Item2'),
    t('s13Item3'),
    t('s13Item4'),
    t('s13Item5'),
    t('s13Item6'),
    t('s13Item7'),
    t('s13Item8'),
  ];

  return (
    <div className="w-full min-h-screen bg-[var(--page-bg)] text-page pt-16 pb-24 px-[10%] text-left flex flex-col items-center">
      <div className="w-full max-w-lg flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebPage',
              name: 'Fjorr Privacy Notice',
              description:
                'Fjorr privacy: watching stays open, no ad tracking, no selling personal data. Membership data only when you join the Bureaux.',
              dateModified: '2026-08-01',
            }),
          }}
        />

        <div className="w-full text-center mb-4">
          <h1 className="font-futura text-4xl sm:text-5xl md:text-6xl tracking-tighter text-page select-none">
            {t('title')}
          </h1>
        </div>

        <div className="w-full text-center flex flex-col gap-1.5 mb-14 font-mono font-bold text-xs tracking-relaxed text-page-faint uppercase">
          <span>{t('lastUpdated')}</span>
          <span>{t('date')}</span>
        </div>

        <div className="flex flex-col gap-10">
          {sections.map((section) => (
            <section key={section.title} className="flex flex-col gap-3">
              <h2 className="font-sans text-lg font-bold text-page">
                {section.title}
              </h2>
              <Paras lines={section.lines} />
            </section>
          ))}

          <section className="flex flex-col gap-3">
            <h2 className="font-sans text-lg font-bold text-page">
              {t('s13Title')}
            </h2>
            <ul className="list-none flex flex-col gap-2 font-sans text-[15px] leading-relaxed text-page-muted pl-1.5">
              {doNotItems.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-page-faint text-xs font-bold mt-1.5">
                    •
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {afterList.map((section) => (
            <section key={section.title} className="flex flex-col gap-3">
              <h2 className="font-sans text-lg font-bold text-page">
                {section.title}
              </h2>
              <Paras lines={section.lines} />
            </section>
          ))}

          <section className="flex flex-col gap-1.5">
            <h2 className="font-sans text-lg font-bold text-page">
              {t('s16Title')}
            </h2>
            <p className="font-sans text-[15px] leading-relaxed text-page-muted">
              {t('s16Body')}{' '}
              <a
                href="mailto:control@fjorr.com"
                className="text-page hover:opacity-80 underline underline-offset-4 decoration-[color-mix(in_srgb,var(--page-fg)_20%,transparent)] transition-opacity"
              >
                control@fjorr.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
