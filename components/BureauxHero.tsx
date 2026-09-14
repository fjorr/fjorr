'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { HOUSE_STAGE_SIDE_CLASS } from '@/components/house/house-stage-margins';

const BUREAUX_IMAGE =
  'https://media.fjorr.com/app-assets/fjorr-home-bureaux-breakdancing.avif';

/**
 * Join hero — same white-house frame as film posters (24 / 54 gutters, 8px radius).
 * Image holds, then THE BUREAUX fades up.
 */
export default function BureauxHero({ title }: { title: string }) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(
      typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }, []);

  return (
    <section
      className={`relative w-full bg-white ${HOUSE_STAGE_SIDE_CLASS}`}
      aria-label={title}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes fjorr-bureaux-title {
              from {
                opacity: 0;
                transform: translate3d(0, 0.45em, 0);
              }
              to {
                opacity: 1;
                transform: translate3d(0, 0, 0);
              }
            }
          `,
        }}
      />
      {/* Nav 56 + footer chrome 54 — same stage window as film house. */}
      <div className="relative h-[calc(100dvh-56px-54px)] w-full overflow-hidden rounded-[8px] bg-black">
        <Image
          src={BUREAUX_IMAGE}
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 100vw, calc(100vw - 108px)"
          className="object-cover object-[30%_40%] sm:object-[40%_42%] md:object-[55%_45%] lg:object-[60%_center]"
        />
        <div className="absolute inset-0 flex items-center justify-center px-4 sm:px-6 md:px-8">
          <h1
            className="m-0 w-full max-w-none text-center font-futura text-[clamp(4.5rem,22vw,14rem)] leading-[0.82] tracking-tighter text-white select-none will-change-[transform,opacity]"
            style={
              reduced
                ? undefined
                : {
                    opacity: 0,
                    animation:
                      'fjorr-bureaux-title 1s cubic-bezier(0.25, 0.1, 0.25, 1) 0.65s both',
                  }
            }
          >
            {title}
          </h1>
        </div>
      </div>
    </section>
  );
}
