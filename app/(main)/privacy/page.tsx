import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="w-full min-h-screen pt-36 pb-24 px-[10%] text-left flex flex-col items-center">
      <div className="w-full max-w-lg flex flex-col">
        
        {/* THE EDITORIAL DATE TRACKER HEADER */}
        <div className="w-full text-center flex flex-col gap-1.5 mb-2 font-mono text-[11px] tracking-[0.25em] text-white/40 uppercase">
          <span>Last Updated</span>
          <span>January 01, 2026</span>
        </div>

        {/* HERO TITLE (Trade Gothic - Heavy Display Type) */}
        <h1 className="w-full text-center font-futura text-6xl md:text-[80px] uppercase tracking-tight leading-none font-black text-white mb-16 select-none">
          Privacy
        </h1>

        {/* CONTENT SECTIONS GRID STACK */}
        <div className="flex flex-col gap-10">
          
          {/* SECTION 1 */}
          <section className="flex flex-col gap-2">
            <h2 className="font-sans text-[18px] font-bold text-white">
              We Respect Your Privacy
            </h2>
            <p className="font-sans text-[15px] leading-[1.6em] text-white/60 ">
              Fjorr is built to be simple. No accounts. No tracking. No following you around the internet.
            </p>
          </section>

          {/* SECTION 2 */}
          <section className="flex flex-col gap-4">
            <h2 className="font-sans text-[18px] font-bold text-white ">
              What We Collect
            </h2>
            <div className="flex flex-col gap-3 font-sans text-[15px] leading-[1.6em] text-white/60">
              <p>
                We only collect personal information if you choose to give it to us—like your email when you subscribe to our newsletter. That’s it.
              </p>
              <p>
                Like most sites, our hosting provider does receive basic, anonymous server logs: the browser you use, your device, an approximate location (city-level), the pages you visit, and when you visited them.
              </p>
              <p>
                These logs help us keep Fjorr secure and running well, and they don’t identify you personally.
              </p>
            </div>
          </section>

          {/* SECTION 3 */}
          <section className="flex flex-col gap-2">
            <h2 className="font-sans text-[18px] font-bold text-white ">
              How We Use Your Email
            </h2>
            <p className="font-sans text-[15px] leading-[1.6em] text-white/60 ">
              If you subscribe to our newsletter, we’ll use your email only to send new film updates and the occasional behind-the-scenes note. You can unsubscribe anytime with a single click. And we don’t share, sell, or trade your email with anyone—ever.
            </p>
          </section>

          {/* SECTION 4 (THE BULLET POINT MATRIX) */}
          <section className="flex flex-col gap-3">
            <h2 className="font-sans text-[18px] font-bold text-white ">
              What We Do Not Collect
            </h2>
            <ul className="list-none flex flex-col gap-1.5 font-sans text-[15px] text-white/60  pl-1.5">
              <li className="flex items-center gap-2">
                <span className="text-white/30 text-xs font-bold">•</span> Names
              </li>
              <li className="flex items-center gap-2">
                <span className="text-white/30 text-xs font-bold">•</span> Email addresses
              </li>
              <li className="flex items-center gap-2">
                <span className="text-white/30 text-xs font-bold">•</span> User accounts
              </li>
              <li className="flex items-center gap-2">
                <span className="text-white/30 text-xs font-bold">•</span> Advertising IDs
              </li>
              <li className="flex items-center gap-2">
                <span className="text-white/30 text-xs font-bold">•</span> Tracking cookies
              </li>
              <li className="flex items-center gap-2">
                <span className="text-white/30 text-xs font-bold">•</span> Personal data for sale or sharing
              </li>
            </ul>
          </section>

          {/* SECTION 5 */}
          <section className="flex flex-col gap-2">
            <h2 className="font-sans text-[18px] font-bold text-white ">
              Third-Party Services
            </h2>
            <p className="font-sans text-[15px] leading-[1.6em] text-white/60 ">
              We use a video player called MUX to stream our films. It may collect basic, anonymous playback data so the video actually works. If that ever changes, we’ll update this policy with the exact details. If we use an email service to send our newsletter, it will store your email only so we can reach you—never for anything else.
            </p>
          </section>

          {/* SECTION 6 */}
          <section className="flex flex-col gap-2">
            <h2 className="font-sans text-[18px] font-bold text-white ">
              Your Rights
            </h2>
            <p className="font-sans text-[15px] leading-[1.6em] text-white/60 ">
              If you live somewhere with specific privacy laws—California, for example—you have the right to know what data is collected and to ask for it to be deleted. Since we don’t collect personal data, there’s nothing to delete. If you unsubscribe from the newsletter, your email comes off our list right away.
            </p>
          </section>

          {/* SECTION 7 */}
          <section className="flex flex-col gap-2">
            <h2 className="font-sans text-[18px] font-bold text-white ">
              Changes to This Policy
            </h2>
            <p className="font-sans text-[15px] leading-[1.6em] text-white/60 ">
              If what we collect or how Fjorr works ever changes, we’ll update this page.
            </p>
          </section>

          {/* SECTION 8 */}
          <section className="flex flex-col gap-1.5">
            <h2 className="font-sans text-[18px] font-bold text-white ">
              Contact
            </h2>
            <p className="font-sans text-[15px] text-white/60 ">
              If you have questions, you can reach us at:{' '}
              <a 
                href="mailto:team@fjorr.com" 
                className="text-white hover:opacity-80 underline underline-offset-4 decoration-white/20 transition-opacity"
              >
                team@fjorr.com
              </a>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}