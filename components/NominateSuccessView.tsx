'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

interface SuccessProps {
  onReset: () => void;
}

export default function NominateSuccessView({ onReset }: SuccessProps) {
  const t = useTranslations('Nominate');

  return (
    <div className="w-full max-w-md mx-auto h-auto bg-transparent flex items-center justify-center transition-all duration-500">
      <div className="w-full h-full border border-[#FFFFFF]/10 rounded-2xl bg-[#1F1F1F] flex items-center justify-center overflow-hidden relative group">
        <div className="w-full h-full bg-[#1F1F1F] px-[30px] py-16 relative flex flex-col items-center justify-center text-center">
          <div
            className="absolute top-[30px] bottom-[30px] left-[30px] right-[30px] opacity-[0.15] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#FFFFFF 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              backgroundPosition: 'center',
            }}
          />

          <div
            className="relative z-10 flex flex-col items-center justify-center opacity-0 animate-slide-up"
            style={{ animationDelay: '150ms' }}
          >
            <div className="mb-4 text-white/90">
              <svg
                className="w-10 h-10 stroke-current"
                fill="none"
                strokeWidth="2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                />
              </svg>
            </div>

            <h2 className="text-5xl sm:text-6xl font-extrabold uppercase tracking-tighter text-light-01 leading-[46px] sm:leading-[54px] font-futura mb-4 select-none">
              {t('successTitle')}
            </h2>

            <p className="font-sans font-medium text-base leading-relaxed text-white/60 max-w-[200px] sm:max-w-[250px] mb-8 tracking-tight">
              {t('successBody')}
            </p>

            <button
              onClick={onReset}
              className="px-10 h-14 bg-white text-black font-sans font-bold text-[15px] tracking-tight rounded-full hover:bg-white/90 active:scale-95 transition-all duration-150 inline-flex items-center justify-center gap-1.5 group/btn"
            >
              <span>{t('submitMore')}</span>
              <svg
                className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
