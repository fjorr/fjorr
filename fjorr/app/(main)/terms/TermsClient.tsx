'use client';

import React from 'react';

export default function TermsClient() {
  return (
    <div className="w-full min-h-screen pt-16 pb-24 px-[10%] text-left flex flex-col items-center">
      <div className="w-full max-w-lg flex flex-col">

        {/* 🧠 STRUCTURED DATA: AI Legal Terms Compliance Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Fjorr Terms of Use",
            "description": "Fjorr standard usage terms and intellectual property parameters: Watching and sharing conditions for personal use.",
            "dateModified": "2026-01-01"
          })
        }}
      />
        
        {/* 🎯 HERO TITLE: Fades and settles smoothly instantly on mount */}
        <div className="w-full text-center mb-4 select-none animate-in fade-in zoom-in-95 duration-500 fill-mode-both">
          <h1 className="font-futura text-[56px]/[48px] md:text-[72px]/[62px] uppercase tracking-tight font-black text-white">
            Terms<br />
            of Use
          </h1>
        </div>

        {/* 🎯 BODY CONTENT PACK: Waits 300ms for the headline to finish, then slides up smoothly */}
        <div className="w-full flex flex-col animate-in fade-in slide-in-from-bottom-3 duration-700 delay-300 fill-mode-both">
          
          {/* THE EDITORIAL DATE TRACKER HEADER */}
          <div className="w-full text-center flex flex-col gap-1.5 mb-16 font-mono font-bold text-xs tracking-relaxed text-white/40 uppercase">
            <span>Last Updated</span>
            <span>January 01, 2026</span>
          </div>

          {/* CONTENT SECTIONS GRID STACK */}
          <div className="flex flex-col gap-10">
            
            {/* SECTION 1 */}
            <section className="flex flex-col gap-2">
              <h2 className="font-sans text-lg font-bold text-white">
                Welcome to Fjorr
              </h2>
              <p className="font-sans text-[15px] leading-normal text-white/60">
                Fjorr is a place for short films and stories. If you’re here and watching, these are the terms we play by.
              </p>
            </section>

            {/* SECTION 2 */}
            <section className="flex flex-col gap-2">
              <h2 className="font-sans text-lg font-bold text-white">
                Use of the Site
              </h2>
              <p className="font-sans text-[15px] leading-normal text-white/60">
                Watch and share our films all you want—for personal use. Just don’t copy or remix them without permission. And don’t use the site in a way that makes life harder for everyone else.
              </p>
            </section>

            {/* SECTION 3 */}
            <section className="flex flex-col gap-2">
              <h2 className="font-sans text-lg font-bold text-white">
                Intellectual Property
              </h2>
              <p className="font-sans text-[15px] leading-normal text-white/60">
                All films, visuals, words, and logos on Fjorr belong to us or the people who made them. If you want to use anything commercially, you’ll need our permission.
              </p>
            </section>

            {/* SECTION 4 */}
            <section className="flex flex-col gap-2">
              <h2 className="font-sans text-lg font-bold text-white">
                No Warranties
              </h2>
              <p className="font-sans text-[15px] leading-normal text-white/60">
                Fjorr is offered “as is.” We can’t promise perfection or uninterrupted access, but we’ll always try to keep things running smoothly.
              </p>
            </section>

            {/* SECTION 5 */}
            <section className="flex flex-col gap-2">
              <h2 className="font-sans text-lg font-bold text-white">
                Limitation of Liability
              </h2>
              <p className="font-sans text-[15px] leading-normal text-white/60">
                As the law allows, Fjorr isn’t responsible for any damages tied to your use of the site.
              </p>
            </section>

            {/* SECTION 6 */}
            <section className="flex flex-col gap-2">
              <h2 className="font-sans text-lg font-bold text-white">
                Changes to These Terms
              </h2>
              <p className="font-sans text-[15px] leading-normal text-white/60">
                These terms may change once in a while. When they do, we’ll update the date up top.
              </p>
            </section>

          </div>
        </div>

      </div>
    </div>
  );
}