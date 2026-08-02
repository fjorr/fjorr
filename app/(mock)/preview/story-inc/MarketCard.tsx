'use client';

import { useState } from 'react';

type Outcome = { label: string; pct: number };

/** Live-feeling market card for the Story Inc mock. */
export default function MarketCard({
  image,
  question,
  outcomes,
  closes,
  volume,
  traders,
  projectLabel = 'Angry Birds 3',
}: {
  image: string;
  question: string;
  outcomes: readonly Outcome[];
  closes: string;
  volume: string;
  traders: string;
  projectLabel?: string;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const top = outcomes.slice(0, 2);

  return (
    <article
      className="group overflow-hidden rounded-3xl bg-[#fbfbfd] ring-1 ring-black/[0.05] transition-all duration-300 hover:-translate-y-1 hover:ring-[#00a6ff]/25"
      onMouseLeave={() => setHover(null)}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[#f5f5f7]">
        <img
          src={image}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00a6ff] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00a6ff]" />
          </span>
          Live
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between gap-2 text-[12px] text-[#6e6e73]">
          <span className="font-semibold">{projectLabel}</span>
          <span className="tabular-nums">{volume}</span>
        </div>
        <h3 className="mt-2 text-[15px] font-bold leading-snug tracking-[-0.01em]">
          {question}
        </h3>

        <div className="mt-4 space-y-3">
          {top.map((o) => {
            const active = hover === o.label;
            const width = active ? Math.min(o.pct + 4, 98) : o.pct;
            return (
              <button
                key={o.label}
                type="button"
                onMouseEnter={() => setHover(o.label)}
                className="w-full text-left"
              >
                <div className="mb-1 flex justify-between text-[13px] font-medium">
                  <span>{o.label}</span>
                  <span className="tabular-nums text-[#6e6e73]">{o.pct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#e8e8ed]">
                  <div
                    className="h-full rounded-full bg-[#00a6ff] transition-all duration-300"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </button>
            );
          })}
          {outcomes.length > 2 ? (
            <p className="text-[12px] text-[#6e6e73]">
              +{outcomes.length - 2} more outcomes
            </p>
          ) : null}
        </div>

        <div className="mt-4 flex gap-2">
          {top.map((o) => (
            <button
              key={`trade-${o.label}`}
              type="button"
              onMouseEnter={() => setHover(o.label)}
              title={o.label}
              className="min-w-0 flex-1 truncate rounded-full bg-white px-3 py-2 text-[12px] font-bold text-[#1d1d1f] ring-1 ring-black/10 transition-colors hover:bg-[#00a6ff] hover:text-white hover:ring-[#00a6ff]"
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex justify-between text-[12px] text-[#86868b]">
          <span>{traders} trading</span>
          <span>
            {/^(in |resolves )/i.test(closes) ? closes : `Closes ${closes}`}
          </span>
        </div>
      </div>
    </article>
  );
}
