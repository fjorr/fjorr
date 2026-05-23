'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function WatchPage() {
  const { slug } = useParams();
  const router = useRouter();
  
  // --- LAYER STATE ARCHITECTURE ---
  const [film, setFilm] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [showCCMenu, setShowCCMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // --- THE STABILITY CONTROL FLAG ---
  const [isScrubbing, setIsScrubbing] = useState(false);

  // --- CUSTOM REACT SUBTITLE STATE ---
  const [selectedLangCode, setSelectedLangCode] = useState<string>('none');
  const [parsedCues, setParsedCues] = useState<any[]>([]);
  const [currentSubtitleText, setCurrentSubtitleText] = useState<string>('');

  // --- NODES REF HOOKS ---
  const playerRef = useRef<HTMLVideoElement | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- 1. INITIAL BASE DATA FETCH ---
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function getFilmPayload() {
      const { data } = await supabase
        .from('film')
        .select(`
          id, 
          name, 
          slug, 
          mux_playback_id, 
          last_line,
          story_date,
          location,
          language_subtitle (
            vtt_url,
            language ( code, name )
          )
        `)
        .eq('slug', slug)
        .maybeSingle();

      if (data) {
        setFilm(data);
      } else {
        router.push('/');
      }
    }
    getFilmPayload();
  }, [slug]);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // --- 3. AUTO-HIDE INTERACTION MANAGEMENT ---
  const showUIControls = () => {
    setControlsVisible(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);

    hideTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showCCMenu && !isScrubbing) {
        setControlsVisible(false);
      }
    }, 2500);
  };

  useEffect(() => {
    window.addEventListener('mousemove', showUIControls);
    window.addEventListener('click', showUIControls);
    window.addEventListener('touchstart', showUIControls);
    return () => {
      window.removeEventListener('mousemove', showUIControls);
      window.removeEventListener('click', showUIControls);
      window.removeEventListener('touchstart', showUIControls);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [isPlaying, showCCMenu, isScrubbing]);

  // --- 4. MEDIA ACTION HANDLERS ---
  const togglePlay = () => {
    const player = playerRef.current;
    if (!player) return;
    if (isPlaying) {
      player.pause();
    } else {
      player.play().catch(() => {});
    }
  };

  const toggleMute = () => {
    const player = playerRef.current;
    if (!player) return;
    player.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleReplay = () => {
    const player = playerRef.current;
    if (!player) return;
    player.currentTime = 0;
    setIsEnded(false);
    player.play().catch(() => {});
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleScrubStart = () => {
    setIsScrubbing(true);
  };

  const handleScrubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    if (playerRef.current) {
      playerRef.current.currentTime = targetTime;
    }
  };

  // 🎯 FIXED SIGNATURE: Swapped to a standard React.SyntheticEvent type wrapper block 
  // to cleanly accept any mouse, touch, or field mutations without build worker error rejections
  const handleScrubEnd = (e: React.SyntheticEvent<HTMLInputElement>) => {
    setIsScrubbing(false);
    const player = playerRef.current;
    if (!player || !duration) return;
    
    const finalTime = parseFloat(e.currentTarget.value);
    player.currentTime = finalTime;
    showUIControls();
  };

  const parseVttTimeToSeconds = (timeStr: string) => {
    if (!timeStr) return 0;
    const parts = timeStr.trim().split(':');
    let secs = 0;
    if (parts.length === 3) {
      secs += parseInt(parts[0], 10) * 3600;
      secs += parseInt(parts[1], 10) * 60;
      secs += parseFloat(parts[2]);
    } else if (parts.length === 2) {
      secs += parseInt(parts[0], 10) * 60;
      secs += parseFloat(parts[1]);
    }
    return secs;
  };

  // --- 5. NATIVE JAVASCRIPT WEBVTT PARSING ---
  const handleSubtitleSelection = async (langCode: string, langName: string) => {
    setShowCCMenu(false);
    setSelectedLangCode(langCode);

    if (langCode === 'none') {
      setParsedCues([]);
      setCurrentSubtitleText('');
      return;
    }

    const tracksArray = film?.language_subtitle || [];
    const matchedRecord = tracksArray.find((item: any) => {
      const code = item?.language?.code || '';
      return code.toLowerCase().trim() === langCode.toLowerCase().trim();
    });

    const baseCloudflareUrl = matchedRecord?.vtt_url;
    if (!baseCloudflareUrl) {
      console.warn(`⚠️ FJORR Engine: Cloudflare track link missing.`);
      return;
    }

    try {
      const response = await fetch(`${baseCloudflareUrl}?v=${Date.now()}`);
      if (!response.ok) throw new Error("CORS validation handshake rejected.");
      const vttText = await response.text();

      const lines = vttText.replace(/\r\n/g, '\n').split('\n');
      const cuesArray: any[] = [];
      let currentCue: any = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.includes('-->')) {
          const timestamps = line.split('-->');
          if (timestamps.length === 2) {
            currentCue = {
              startTime: parseVttTimeToSeconds(timestamps[0]),
              endTime: parseVttTimeToSeconds(timestamps[1]),
              text: ''
            };
          }
        } else if (currentCue && line !== '') {
          currentCue.text = currentCue.text ? currentCue.text + '\n' + line : line;
        } else if (currentCue && line === '') {
          cuesArray.push(currentCue);
          currentCue = null;
        }
      }
      if (currentCue) cuesArray.push(currentCue);

      setParsedCues(cuesArray);
    } catch (err) {
      console.error("🔴 FJORR SUBTITLE PARSER ERROR:", err);
    }
  };

  // --- 6. REAL-TIME SUBTITLE MATCH SYNCHRONIZER EFFECT ---
  useEffect(() => {
    if (selectedLangCode === 'none' || parsedCues.length === 0) {
      setCurrentSubtitleText('');
      return;
    }

    const activeCue = parsedCues.find(
      (cue) => currentTime >= cue.startTime && currentTime <= cue.endTime
    );

    if (activeCue) {
      setCurrentSubtitleText(activeCue.text);
    } else {
      setCurrentSubtitleText('');
    }
  }, [currentTime, parsedCues, selectedLangCode]);

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const m = Math.floor(time / 60);
    const s = Math.floor(Math.abs(time % 60)).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    const player = playerRef.current;
    if (player && film) {
      player.muted = false;
      player.play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          player.muted = true;
          setIsMuted(true);
          player.play().catch(() => {});
        });
    }
  }, [film]);

  if (!film) {
    return (
      <div className="w-full h-screen bg-[#1f1f1f] flex items-center justify-center font-mono text-xs tracking-widest text-white/30 animate-pulse">
        CONNECTING BROADCAST STREAM...
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-[100svh] bg-[#1f1f1f] text-[#F5F5F7] select-none overflow-hidden flex flex-col items-center justify-center font-sans">
      
      {/* 🎬 MAIN THEATRICAL WIDGET CONTAINER BOX */}
      <div className={`relative w-full max-w-[1200px] aspect-video overflow-hidden transition-all duration-500 z-10 flex flex-col justify-end p-6 ${
        isFullscreen ? 'max-w-none h-screen rounded-0 border-0 p-8' : 'xl:rounded-[12px] bg-black shadow-2xl'
      }`}>
        
        {/* 📹 NATIVE VIDEO EMBED ELEMENT */}
        <video
          ref={playerRef}
          id="fjorr-engine"
          src={`https://stream.mux.com/${film.mux_playback_id}.m3u8`}
          playsInline
          crossOrigin="anonymous"
          className="w-full h-full object-contain pointer-events-none absolute inset-0 z-0"
          style={{ filter: isEnded ? 'blur(20px) brightness(0.3)' : 'blur(0px)' }}
          onTimeUpdate={(e) => {
            if (!isScrubbing) {
              setCurrentTime(e.currentTarget.currentTime);
            }
          }}
          onDurationChange={(e) => setDuration(e.currentTarget.duration)}
          onPlaying={() => { setIsPlaying(true); setIsEnded(false); setIsLoading(false); }}
          onPause={() => setIsPlaying(false)}
          onEnded={() => { setIsEnded(true); setIsPlaying(false); setControlsVisible(false); }}
        />

        {/* 🎯 PURE DARK TINT BACKDROP LAYER */}
        <div 
          className="absolute inset-0 bg-black/20 transition-opacity duration-500 pointer-events-none z-10"
          style={{ opacity: controlsVisible ? 1 : 0 }}
        />

        {/* Floating Text Subtitle Layer */}
        {selectedLangCode !== 'none' && currentSubtitleText && (
          <div className="absolute bottom-[32%] left-1/2 -translate-x-1/2 max-w-[85%] text-center px-5 py-2 bg-zinc-950/80 backdrop-blur-md border border-white/5 rounded-[6px] text-[#F5F5F7] font-medium text-[15px] md:text-[17px] tracking-tight leading-relaxed z-25 pointer-events-none select-none font-inter shadow-2xl">
            {currentSubtitleText}
          </div>
        )}

        {/* 🎛️ CORNER HUD INTERFACE MATRIX OVERLAY BLOCK */}
        <div 
          className="w-full flex flex-col justify-end items-start relative z-30 transition-opacity duration-500 select-none pb-2 gap-3"
          style={{ opacity: controlsVisible ? 1 : 0, pointerEvents: controlsVisible ? 'auto' : 'none' }}
        >
          
          {/* STACK POSITION A: FILM TITLE DATA PACK BLOCK */}
          <div className="flex flex-col items-start justify-center text-left text-[#F5F5F7] pl-1">
            <h2 className="text-2xl md:text-3xl font-bold tracking-wide font-sans leading-none">
              {film?.name || 'Shoebox'}
            </h2>
            <p className="text-sm md:text-base font-medium font-sans opacity-60 mt-2 tracking-normal">
              {film?.story_date || '1972'} &middot; {film?.location || 'Portland, Oregon'}
            </p>
          </div>

          {/* STACK POSITION B: BUTTON ACTIONS CONTROL PANEL ROW */}
          <div className="flex items-center gap-2 h-13 relative">
            
            {/* Play / Pause Toggle Button */}
            <button 
              onClick={togglePlay} 
              className="w-10 h-10 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <img src="/icons/pause.svg" className="w-7 h-7 invert" alt="Pause Stream" />
              ) : (
                <img src="/icons/play.svg" className="w-7 h-7 ml-0.5 invert" alt="Play Stream" />
              )}
            </button>

            {/* Rewind Back 10s Button */}
            <button 
              onClick={() => { if (playerRef.current) playerRef.current.currentTime = Math.max(0, currentTime - 10); }} 
              className="w-9 h-9 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
              title="Rewind 10s"
            >
              <img src="/icons/back10.svg" className="w-[22px] h-[22px] invert" alt="Rewind 10s" />
            </button>

            {/* Fast Forward 10s Button */}
            <button 
              onClick={() => { if (playerRef.current) playerRef.current.currentTime = Math.min(duration, currentTime + 10); }} 
              className="w-9 h-9 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
              title="Fast Forward 10s"
            >
              <img src="/icons/forward10.svg" className="w-[22px] h-[22px] invert" alt="Forward 10s" />
            </button>

            {/* Captions CC Menu Trigger Button */}
            <button 
              onClick={() => setShowCCMenu(!showCCMenu)} 
              className={`w-9 h-9 flex items-center justify-center transition-opacity duration-200 cursor-pointer ${showCCMenu || selectedLangCode !== 'none' ? 'opacity-100 brightness-150' : 'opacity-70 hover:opacity-100'}`}
              title="Captions"
            >
              <img src="/icons/cc.svg" className="w-[22px] h-[22px] invert" alt="Captions Menu Toggle" />
            </button>

            {/* Fullscreen Toggle Switch Button */}
            <button 
              onClick={toggleFullscreen} 
              className="w-9 h-9 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
              title="Fullscreen"
            >
              {isFullscreen ? (
                <img src="/icons/compress.svg" className="w-[22px] h-[22px] invert" alt="Exit Fullscreen" />
              ) : (
                <img src="/icons/expand.svg" className="w-[22px] h-[22px] invert" alt="Enter Fullscreen" />
              )}
            </button>

            {/* Volume Speaker Mute Toggle Button */}
            <button 
              onClick={toggleMute} 
              className="w-9 h-9 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <img src="/icons/mute.svg" className="w-[22px] h-[22px] invert" alt="Unmute Audio Feed" />
              ) : (
                <img src="/icons/volume.svg" className="w-[22px] h-[22px] invert" alt="Mute Audio Feed" />
              )}
            </button>
            
            {/* CC Dropdown Menu layer popup context */}
            {showCCMenu && (
              <div className="absolute bottom-14 left-2 z-50 pointer-events-auto">
                <div className="w-44 bg-[#2a2a2a] rounded-[8px] backdrop-blur-xl p-1.5 flex flex-col gap-0.5 text-left text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <button 
                    onClick={() => handleSubtitleSelection('none', 'Off')} 
                    className={`w-full py-1.5 px-2.5 rounded-[4px] text-left transition-colors font-semibold ${
                      selectedLangCode === 'none' ? 'text-[#f5f5f7] bg-white/5' : 'text-white/40 hover:bg-white/5'
                    }`}
                  >
                    Captions Off
                  </button>

                  <div className="w-full h-[1px] bg-white/5 my-1" />

                  {Array.isArray(film?.language_subtitle) && film.language_subtitle.map((item: any) => {
                    const code = item?.language?.code || '';
                    const fullLanguageName = item?.language?.name || code.toUpperCase();
                    if (!code) return null;

                    const isCurrentActive = selectedLangCode?.toLowerCase().trim() === code.toLowerCase().trim();

                    return (
                      <button 
                        key={code} 
                        onClick={() => handleSubtitleSelection(code.trim(), fullLanguageName.trim())} 
                        className={`w-full py-1.5 px-2.5 rounded-[4px] text-left transition-colors capitalize flex items-center justify-between font-semibold ${
                          isCurrentActive 
                            ? 'text-[#46ceff] bg-white/5' 
                            : 'text-white/80 hover:bg-white/5'
                        }`}
                      >
                        <span>{fullLanguageName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* STACK POSITION C: TRADITIONAL RESTRICTED SCRUBBER TRACK RUNNER */}
          <div className="w-full max-w-[320px] flex items-center justify-between gap-4 h-5 pl-1 mt-1">
            <div className="w-10 text-right select-none font-mono text-xs text-white opacity-40 tracking-tight shrink-0">
              {formatTime(currentTime)}
            </div>

            <div className="flex-grow relative flex items-center group h-5">
              <input 
                type="range"
                min={0}
                max={duration || 100}
                step="any"
                value={currentTime}
                onMouseDown={handleScrubStart}
                onTouchStart={handleScrubStart}
                onChange={handleScrubChange}
                onMouseUp={handleScrubEnd}
                onTouchEnd={handleScrubEnd}
                className="w-full h-5 rounded-full appearance-none cursor-pointer outline-none accent-white transition-all duration-150 bg-transparent relative z-20"
                style={{
                  background: `linear-gradient(to right, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.55) ${duration ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,0.1) ${duration ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,0.1) 100%)`
                }}
              />
            </div>

            <div className="w-11 text-left select-none font-mono text-xs text-white opacity-40 tracking-tight shrink-0">
              -{formatTime(duration - currentTime)}
            </div>
          </div>

        </div>

        {/* LOADING INDICATOR OVERLAY */}
        {isLoading && (
          <div className="absolute inset-0 bg-[#1f1f1f] flex items-center justify-center font-mono text-xs text-white/20 tracking-widest z-30 backdrop-blur-sm">
            BUFFERING STREAM CODES...
          </div>
        )}

      </div>

      {/* REPLAY FILM END SCREEN OVERLAY */}
      <div 
        id="end-screen"
        className="absolute inset-0 bg-[#1f1f1f] backdrop-blur-md flex flex-col items-center justify-center transition-all duration-1000 ease-in-out z-40"
        style={{ 
          opacity: isEnded ? 1 : 0, 
          pointerEvents: isEnded ? 'auto' : 'none',
          transform: isEnded ? 'scale(1)' : 'scale(1.03)' 
        }}
      >
        <div className="max-w-2xl text-center flex flex-col items-center gap-8 px-6 relative">
          
          <p className="font-sans text-lg md:text-lg font-semibold text-[#F5F5F7]/90 leading-relaxed max-w-xl">
            {film?.last_line || 'The credits fade to black.'}
          </p>

          <div className="flex items-center gap-6 text-white/50 tracking-wider font-sans text-sm">
            <button onClick={handleReplay} className="flex items-center gap-2 hover:text-[#f5f5f7] transition-colors group cursor-pointer normal-case">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 group-hover:-rotate-45 transition-transform duration-300">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Replay
            </button>

            <button 
              onClick={() => {
                const shareData = { title: film?.name, url: `${window.location.origin}/film/${film?.slug}` };
                if (navigator.share) { navigator.share(shareData).catch(() => {}); } 
                else { navigator.clipboard.writeText(shareData.url); alert('Link copied to clipboard'); }
              }}
              className="flex items-center gap-2 hover:text-[#f5f5f7] transition-colors group cursor-pointer normal-case"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 transition-transform duration-200" >
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <g className="group-hover:-translate-y-0.5 transition-transform duration-200">
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </g>
              </svg>
              Share
            </button>

            <Link href={`/film/${film?.slug}`} className="flex items-center gap-2 hover:text-[#f5f5f7] transition-colors group normal-case">
              Onward 
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 group-translate-x-1 transition-transform">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="font-tradeGothic font-semibold tracking-normal text-[#F5F5F7]/70 uppercase select-none pointer-events-none origin-center transform scale-y-135 leading-loose text-center max-w-xl" style={{ fontSize: '14px' }}>
            <span>{film?.name}</span> &nbsp;&nbsp;&nbsp;&nbsp; <span>{film?.story_date || film?.story_year || film?.date || '2026'}</span> &nbsp;&nbsp;&nbsp;&nbsp; <span>{film?.location || 'Studio Grid'}</span>
          </div>

        </div>
      </div>

    </div>
  );
}