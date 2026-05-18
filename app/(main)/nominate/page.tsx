'use client';

import React, { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import NominateSuccessView from '@/components/NominateSuccessView';

// --- TS ERRORS RECORD CONFIG ---
interface ValidationErrors {
  story_details?: string;
  contributor_email?: string;
}

export default function NominatePage() {
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
    <div className="w-full min-h-screen pt-36 pb-24 px-[10%] flex flex-col items-center">
      <div className="w-full max-w-4xl flex flex-col items-center text-center">
        
        {/* =========================================================================
            HEADER MARQUEE GRID STRIP (The 4-Photo Narrative Film Stack)
            ========================================================================= */}
        <div className="w-full grid grid-cols-4 gap-1 border-b border-white/5 pb-16 mb-16 overflow-hidden">
          {/* PHOTO 1 */}
          <div className="aspect-[3/4] bg-zinc-900 overflow-hidden relative">
            <img src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop" alt="Historical Frame reference" className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-700" />
          </div>
          {/* PHOTO 2 */}
          <div className="aspect-[3/4] bg-zinc-900 overflow-hidden relative">
            <img src="https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop" alt="Historical Frame reference" className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-700" />
          </div>
          {/* PHOTO 3 */}
          <div className="aspect-[3/4] bg-zinc-900 overflow-hidden relative">
            <img src="https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?q=80&w=600&auto=format&fit=crop" alt="Historical Frame reference" className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-700" />
          </div>
          {/* PHOTO 4 */}
          <div className="aspect-[3/4] bg-zinc-900 overflow-hidden relative">
            <img src="https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=600&auto=format&fit=crop" alt="Historical Frame reference" className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-700" />
          </div>
        </div>

        {/* =========================================================================
            LOGICAL INTERFACE VIEW SWITCHBOARD PANEL 
            ========================================================================= */}
        {submittedSuccess ? (
          <NominateSuccessView onReset={handleResetForm} />
        ) : (
          <div className="w-full max-w-xl flex flex-col items-center">
            
            {/* SUB-HEADER COMPONENT LABEL TRACK */}
            <span className="font-mono text-[11px] tracking-[0.25em] text-white/40 uppercase mb-4 font-bold block select-none">
              Nominate
            </span>

            {/* MAIN SHOWCASE TITLE HERO HEADER (Trade Gothic Display Type) */}
            <h1 className="font-tradeGothic text-6xl md:text-[80px] font-black uppercase tracking-tight leading-none text-white mb-6 select-none">
              Tell It.
            </h1>

            {/* SUMMARY PLATFORM PARAGRAPH BLOCKS */}
            <p className="font-sans font-medium text-[15px] sm:text-[16px] leading-[1.6em] text-white/60 max-w-md tracking-tight text-center mb-10">
              Know a story the world needs to hear? A piece of history. A fictional adventure. A forgotten legend. Nominate it. Your name goes on the film. Bragging rights included.
            </p>

            {/* INPUT COLLECTION DATA FORM FRAME */}
            <form onSubmit={handleSubmit} noValidate className="w-full flex flex-col text-left">
              
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
                  placeholder="Enter you email."
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
              <p className="font-sans font-medium text-[12px] leading-[1.5em] text-white/40 tracking-tight text-center max-w-sm mx-auto mb-8 select-none">
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
    </div>
  );
}