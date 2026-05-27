'use client';

import React, { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import NominateSuccessView from '@/components/NominateSuccessView';

// --- TS ERRORS RECORD CONFIG ---
interface ValidationErrors {
  story_details?: string;
  contributor_email?: string;
}

export default function NominateClient() {
  const [story, setStory] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. INPUT TEXT MUTATION HANDLERS (Clears local errors cleanly on user type)
  const handleStoryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setStory(e.target.value);
    if (errors.story_details) {
      setErrors(prev => ({ ...prev, story_details: undefined }));
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errors.contributor_email) {
      setErrors(prev => ({ ...prev, contributor_email: undefined }));
    }
  };

  // 2. FORM ACTION SUBMIT ENGINE VALIDATION WRAPPER
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // 🎯 CRITICAL: Disables browser-native defaults completely
    
    const localErrors: ValidationErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!story.trim()) {
      localErrors.story_details = 'Story is required.';
    }
    if (!email.trim()) {
      localErrors.contributor_email = 'Email is required.';
    } else if (!emailRegex.test(email)) {
      localErrors.contributor_email = 'Invalid email format.';
    }

    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      return;
    }

    setSubmitting(true);

    // 3. POST DISPATCH TO SUPABASE TABLE MATRIX
    const { error } = await supabase
      .from('nominations')
      .insert([
        {
          story_details: story.trim(),
          contributor_email: email.trim().toLowerCase(),
          status: 'pending' // Default setup tracks matching dashboard tables
        }
      ]);

    setSubmitting(false);

    if (!error) {
      setSubmittedSuccess(true);
    } else {
      setErrors({ story_details: 'Database communication dropped. Please try again later.' });
    }
  };

  const handleResetForm = () => {
    setStory('');
    setEmail('');
    setErrors({});
    setSubmittedSuccess(false);
  };

  return (
    /* 🎯 ROOT CONTAINER */
    <div className="w-full min-h-screen bg-[#1F1F1F] pt-5 pb-24 flex flex-col items-center overflow-x-hidden">

      {/* 🧠 STRUCTURED DATA: AI Contact Destination Mapping */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            "name": "Nominate | Fjorr",
            "description": "Know a story the world needs to hear? A piece of history, fictional adventure, or forgotten legend. Nominate it.",
            "url": "https://fjorr.com/nominate"
          })
        }}
      />
      
      {/* =========================================================================
          HEADER MARQUEE STRIP (The Premium Edge-to-Edge Widescreen Film Strip)
          ========================================================================= */}
      <div className="w-full flex flex-nowrap justify-center gap-1.5 mb-24 sm:mb-32 select-none">
        
        {/* FILM CELL 1: BREAKDANCING */}
        <div className="flex flex-col gap-2.5 w-[33%] md:w-[25%] shrink-0 opacity-0 animate-sweep-right style-delay-100">
          <div className="bg-zinc-900 relative w-full overflow-hidden">
            <img 
              src="https://media.fjorr.com/assets/fjorr-nominate-poster-breakdancing.avif" 
              className="w-full h-auto object-contain block opacity-85 hover:opacity-100 hover:scale-[1.01] transition-all duration-700" 
              alt="Breakdancing narrative frame"
            />
          </div>
          <div className="film-metadata-horizontal text-[9px] text-white/30 tracking-[0.2em] font-mono uppercase font-medium px-4 truncate">
            NOMINATION 143
          </div>
        </div>
        
        {/* FILM CELL 2: NAISMITH */}
        <div className="flex flex-col gap-2.5 w-[33%] md:w-[25%] shrink-0 opacity-0 animate-sweep-right style-delay-180">
          <div className="bg-zinc-900 relative w-full overflow-hidden">
            <img 
              src="https://media.fjorr.com/assets/fjorr-nominate-poster-naismith.avif" 
              className="w-full h-auto object-contain block opacity-85 hover:opacity-100 hover:scale-[1.01] transition-all duration-700" 
              alt="Naismith basketball narrative frame"
            />
          </div>
          <div className="film-metadata-horizontal text-[9px] text-white/30 tracking-[0.2em] font-mono uppercase font-medium px-4 truncate">
            NOMINATION 144
          </div>
        </div>
        
        {/* FILM CELL 3: WW2 */}
        <div className="flex flex-col gap-2.5 w-[33%] md:w-[25%] shrink-0 opacity-0 animate-sweep-right style-delay-250">
          <div className="bg-zinc-900 relative w-full overflow-hidden">
            <img 
              src="https://media.fjorr.com/assets/fjorr-nominate-poster-ww2.avif" 
              className="w-full h-auto object-contain block opacity-85 hover:opacity-100 hover:scale-[1.01] transition-all duration-700" 
              alt="WWII historical narrative frame"
            />
          </div>
          <div className="film-metadata-horizontal text-[9px] text-white/30 tracking-[0.2em] font-mono uppercase font-medium px-4 truncate">
            NOMINATION 145
          </div>
        </div>
        
        {/* FILM CELL 4: YETI */}
        <div className="flex-col gap-2.5 w-[25%] shrink-0 opacity-0 animate-sweep-right style-delay-320 hidden md:flex">
          <div className="bg-zinc-900 relative w-full overflow-hidden">
            <img 
              src="https://media.fjorr.com/assets/fjorr-nominate-poster-yeti.avif" 
              className="w-full h-auto object-contain block opacity-85 hover:opacity-100 hover:scale-[1.01] transition-all duration-700" 
              alt="Yeti legend narrative frame"
            />
          </div>
          <div className="film-metadata-horizontal text-[9px] text-white/30 tracking-[0.2em] font-mono uppercase font-medium px-4 truncate">
            NOMINATION 146
          </div>
        </div>
        
      </div>

      {/* =========================================================================
          LOGICAL INTERFACE CONTENT AREA 
          ========================================================================= */}
      <div className="w-full max-w-4xl px-[10%] flex flex-col items-center text-center mt-4">
        
        {submittedSuccess ? (
          <NominateSuccessView onReset={handleResetForm} />
        ) : (
          <div className="w-full max-w-xl flex flex-col items-center">
            
            {/* 🎬 1. HEADLINE REVEAL (Executes first) */}
            <h1 
              className="text-6xl sm:text-7xl md:text-8xl font-extrabold uppercase tracking-tighter text-light-01 leading-[52px] sm:leading-[64px] md:leading-[76px] font-futura mb-6 opacity-0 animate-slide-up style-delay-headline whitespace-pre-line select-none"
            >
              Nominate.
            </h1>

            {/* 🎬 2. DESCRIPTION TEXT (Executes second) */}
            <p 
              className="font-sans font-medium text-[15px] sm:text-[16px] leading-[1.6em] text-white/60 max-w-[280px] sm:max-w-md tracking-tight text-center mb-10 opacity-0 animate-slide-up style-delay-body"
            >
              Know a story the world needs to hear? A piece of history. A fictional adventure. A forgotten legend. Nominate it. Your name goes on the film. Bragging rights included.
            </p>

            {/* 🎬 3. INPUT FORM ELEMENT FRAME (Executes last) */}
            <form 
              onSubmit={handleSubmit} 
              noValidate 
              className="w-full flex flex-col text-left opacity-0 animate-slide-up style-delay-form"
            >
              
              {/* FIELD AREA 1: LONG FORM DATA CONTENT FIELD */}
              <div className="w-full flex flex-col mb-4">
                <textarea
                  value={story}
                  onChange={handleStoryChange}
                  placeholder="A few words or a sprawling saga, write it here."
                  className={`w-full min-h-64 rounded-xl p-6 bg-white/5 font-sans font-semibold text-[15px] text-white placeholder-white/30 border align-top resize-none focus:outline-none transition-all duration-300
                    ${errors.story_details 
                      ? 'border-red-500/50 focus:border-red-500' 
                      : 'border-white/5 focus:border-white/10 focus:bg-white/10'
                    }
                  `}
                />
                {errors.story_details && (
                  <span className="mt-2.5 font-sans font-bold text-[14px] text-red-500 tracking-tight transition-all duration-200">
                    {errors.story_details}
                  </span>
                )}
              </div>

              {/* FIELD AREA 2: EMAIL INPUT CONTROL */}
              <div className="w-full flex flex-col mb-6">
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="Enter your email."
                  className={`w-full h-14 px-6 rounded-xl bg-white/5 font-sans font-semibold text-[15px] text-white placeholder-white/30 border focus:outline-none transition-all duration-300
                    ${errors.contributor_email 
                      ? 'border-red-500/50 focus:border-red-500' 
                      : 'border-white/5 focus:border-white/10 focus:bg-white/10'
                    }
                  `}
                />
                {errors.contributor_email && (
                  <span className="mt-2.5 font-sans font-bold text-[14px] text-red-500 tracking-tight transition-all duration-200">
                    {errors.contributor_email}
                  </span>
                )}
              </div>

              {/* COMPLIANCE WARNING BANNER AREA TEXT */}
              <p className="font-sans font-medium text-xs leading-[1.5em] text-white/40 tracking-relaxed text-center max-w-xs mx-auto mb-8 select-none">
                We review everything in good faith. Nominations are simply pointers—we may already be developing similar ideas. They don't create ownership or compensation, but we take every submission seriously.
              </p>

              {/* ACTION EXECUTE DISPATCH CTA BUTTON BUTTON */}
              <div className="w-full flex justify-center">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-10 h-14 bg-white text-black font-sans font-bold text-[15px] tracking-tight rounded-full shadow-2xl hover:bg-white/90 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all duration-150"
                >
                  {submitting ? 'Sending...' : 'Nominate'}
                </button>
              </div>

            </form>
          </div>
        )}

      </div>

      {/* CINEMATIC TIMING ENGINE LOCAL COMPILER SCOPE */}
      <style dangerouslySetInnerHTML={{ __html: `
        .film-metadata-horizontal {
          font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }

        /* 🎬 THE MASTER DELAY COMPILER MAP:
           - Poster frames load immediately.
           - Headline starts right after film strip arrives.
           - Body wait time matches structural reading alignment.
           - Form mounts last to tie down visual footprint flow.
        */
        .style-delay-100 { animation-delay: 100ms; }
        .style-delay-180 { animation-delay: 180ms; }
        .style-delay-250 { animation-delay: 250ms; }
        .style-delay-320 { animation-delay: 320ms; }
        
        .style-delay-headline { animation-delay: 500ms !important; }
        .style-delay-body     { animation-delay: 750ms !important; }
        .style-delay-form     { animation-delay: 1000ms !important; }

        @keyframes imageSweepRight {
          from {
            opacity: 0;
            transform: translateX(-12px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes layoutSlideUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-sweep-right {
          animation: imageSweepRight 950ms cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        .animate-slide-up {
          animation: layoutSlideUp 850ms cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
      `}} />
    </div>
  );
}