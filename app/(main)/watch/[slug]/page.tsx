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
      setIsFullscreen(
        !!document.fullscreenElement || 
        !!(document as any).webkitFullscreenElement
      );
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  // --- 3. AUTO-HIDE INTERACTION MANAGEMENT ---
  const showUIControls = () => {
    setControlsVisible(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);

    hideTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showCCMenu && !isScrubbing) {
        setControlsVisible(false);
      }
    }, 1500);
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

  const declineReplay = () => {
    // Left empty to maintain clean layout thread structural continuity safely
  };

  const handleReplay = () => {
    const player = playerRef.current;
    if (!player) return;
    player.currentTime = 0;
    setIsEnded(false);
    player.play().catch(() => {});
  };

  const toggleFullscreen = () => {
    const player = playerRef.current;
    const container = player?.parentElement;
    if (!player || !container) return;

    if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen().catch(() => {});
      } else if (player.requestFullscreen) {
        player.requestFullscreen().catch(() => {});
      } else if ((player as any).webkitEnterFullscreen) {
        (player as any).webkitEnterFullscreen();
      } else if ((player as any).webkitRequestFullscreen) {
        (player as any).webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
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
    setSelectedLangCode(langCode);
    setShowCCMenu(false);

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
      <div className="w-full h-screen bg-[#1f1f1f] flex items-center justify-center font-mono text-xs tracking-widest text-white/60 animate-pulse">
        CONNECTING BROADCAST STREAM...
      </div>
    );
  }

  const currentProgress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 w-full h-[100svh] bg-[#1f1f1f] text-[#F5F5F7] select-none overflow-hidden flex flex-col justify-between font-sans">
      
      {/* 🎬 ABSOLUTE SCREEN-WIDE TOP NAVIGATION BAR */}
      {/* 🎯 ADJUSTED: Removed the backdrop shadow gradient string and increased logo scale parameters to h-5 cleanly */}
      <header 
        className="absolute top-0 inset-x-0 w-full h-20 px-8 flex items-center justify-between z-40 transition-opacity duration-500"
        style={{ opacity: controlsVisible ? 1 : 0, pointerEvents: controlsVisible ? 'auto' : 'none' }}
      >
        <div className="flex items-center justify-start">
          <svg 
            viewBox="0 0 143 81" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-auto text-white/70"
          >
            <path d="M71.3559 13.2942C60.8993 13.2942 52.4273 21.7814 52.4273 32.2448C52.4273 42.7082 60.9046 51.1953 71.3559 51.1953C81.8073 51.1953 90.2846 42.7082 90.2846 32.2448C90.2846 21.7814 81.8073 13.2942 71.3559 13.2942ZM71.3559 39.7278C67.232 39.7278 63.8869 36.3789 63.8869 32.2501C63.8869 28.1214 67.232 24.7725 71.3559 24.7725C75.4799 24.7725 78.825 28.1214 78.825 32.2501C78.825 36.3789 75.4799 39.7278 71.3559 39.7278Z" fill="currentColor"/>
            <path d="M35.9047 15.0355C35.4032 15.0355 34.9978 15.4414 34.9978 15.9435V60.9377C34.9978 65.4136 31.5887 69.0883 27.23 69.505C26.7605 69.5477 26.403 69.9322 26.403 70.4023V80.0912C26.403 80.6146 26.8405 81.0206 27.3633 80.9992C37.996 80.4971 46.4627 71.7109 46.4627 60.9377V15.9435C46.4627 15.4414 46.0573 15.0355 45.5558 15.0355H35.9047Z" fill="currentColor"/>
            <path d="M0 0.908003V48.498C0 49.0001 0.405462 49.406 0.906954 49.406H11.9931C12.4946 49.406 12.9001 49.0001 12.9001 48.498V35.1397C12.4946 34.6376 13.3055 34.2317 13.807 34.2317H26.0616C26.5631 34.2317 26.9685 33.8258 26.9685 33.3237V23.6615C26.9685 23.1594 26.5631 22.7535 26.0616 22.7535H13.807C13.3055 22.7535 12.9001 22.3476 12.9001 21.8455V12.3755C12.9001 11.8735 13.3055 11.4675 13.807 11.4675H27.4967C27.9982 11.4675 28.4037 11.0616 28.4037 10.5595V0.908003C28.4037 0.405931 27.9982 0 27.4967 0H0.906954C0.405462 0 0 0.405931 0 0.908003Z" fill="currentColor"/>
            <path d="M116.309 15.9435V22.7375C116.309 23.2395 115.903 23.6455 115.402 23.6455H108.509C108.066 23.6455 107.709 24.0033 107.709 24.4466V48.5568C107.709 49.0589 107.303 49.4648 106.802 49.4648H97.1508C96.6493 49.4648 96.2438 49.0589 96.2438 48.5568V15.9435C96.2438 15.4414 96.6493 15.0355 97.1508 15.0355H115.402C115.903 15.0355 116.309 15.4414 116.309 15.9435Z" fill="currentColor"/>
            <path d="M143 15.9435V22.7375C143 23.2395 142.595 23.6455 142.093 23.6455H135.2C134.757 23.6455 134.4 24.0033 134.4 24.4466V48.5568C134.4 49.0589 133.994 49.4648 133.493 49.4648H123.842C123.34 49.4648 122.935 49.0589 122.935 48.5568V15.9435C122.935 15.4414 123.34 15.0355 123.842 15.0355H142.093C142.595 15.0355 143 15.4414 143 15.9435Z" fill="currentColor"/>
          </svg>
        </div>

        <button
          onClick={() => router.push(`/film/${film?.slug}`)}
          className="p-2 text-white/60 hover:text-white transition-colors cursor-pointer"
          title="Return to Film Info"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="w-5 h-5 md:w-6 md:h-6"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </header>

      {/* 🎯 MIDDLE VIEWPORT WRAPPER GRID LAYER */}
      <div className="flex-grow w-full flex items-center justify-center">
        
        {/* 🎬 MAIN CONTAINER BOX */}
        <div className={`relative w-full max-w-[1200px] aspect-video overflow-hidden transition-all duration-500 z-10 flex flex-col justify-end p-6 ${
          isFullscreen ? 'max-w-none h-screen rounded-none border-0 p-8' : 'xl:rounded-[12px]'
        }`}>
          
          {/* 📹 VIDEO ELEMENT */}
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

          {/* 🎯 PURE DARK TINT BACKDROP */}
          <div 
            className="absolute inset-0 bg-black/60 transition-opacity duration-500 pointer-events-none z-10"
            style={{ opacity: controlsVisible ? 1 : 0 }}
          />

          {/* Floating Text Subtitle Layer */}
          {selectedLangCode !== 'none' && currentSubtitleText && (
            <div className="absolute bottom-[28%] left-1/2 -translate-x-1/2 max-w-[85%] text-center px-5 py-2 bg-zinc-950/40 backdrop-blur-md border border-white/5 rounded-[6px] text-[#F5F5F7] font-medium text-[15px] md:text-base tracking-tight leading-normal z-25 pointer-events-none select-none font-sans font-semibold shadow-2xl">
              {currentSubtitleText}
            </div>
          )}

          {/* 🎛️ CORNER HUD OVERLAY BLOCK */}
          <div 
            className="w-full flex flex-col justify-end items-start relative z-30 transition-opacity duration-500 select-none pb-2 gap-3"
            style={{ opacity: controlsVisible ? 1 : 0, pointerEvents: controlsVisible ? 'auto' : 'none' }}
          >
            
            {/* STACK POSITION A: FILM TITLE DATA BLOCK */}
            <div className="flex flex-col items-start justify-center text-left text-[#F5F5F7] pl-1">
              <h2 className="text-1xl md:text-2xl font-bold tracking-tight font-sans leading-none">
                {film?.name || 'Shoebox'}
              </h2>
              <p className="text-xs md:text-sm font-medium font-sans opacity-60 mt-2 tracking-normal">
                {film?.story_date || '1972'} &middot; {film?.location || 'Portland, Oregon'}
              </p>
            </div>

            {/* STACK POSITION B: DETACHED HORIZONTAL SUBTITLE SELECTION TRACK */}
            {showCCMenu && (
              <div className="w-max max-w-lg flex items-center gap-4 pl-3.5 pr-4 py-1.5 bg-white/[0.04] backdrop-blur-md border border-white/5 rounded-[6px] overflow-hidden select-none animate-in fade-in slide-in-from-left-2 duration-200 shadow-xl">
                <button 
                  onClick={() => handleSubtitleSelection('none', 'Off')}
                  className={`text-xs font-bold tracking-normal capitalize transition-colors shrink-0 ${
                    selectedLangCode === 'none' ? 'text-[#ffd446]' : 'text-white/40 hover:text-white/80'
                  }`}
                >
                  Off
                </button>
                
                {Array.isArray(film?.language_subtitle) && film.language_subtitle.map((item: any) => {
                  const code = item?.language?.code || '';
                  const fullLanguageName = item?.language?.name || code.toUpperCase();
                  if (!code) return null;

                  const isCurrentActive = selectedLangCode?.toLowerCase().trim() === code.toLowerCase().trim();

                  return (
                    <button
                      key={code}
                      onClick={() => handleSubtitleSelection(code.trim(), fullLanguageName.trim())}
                      className={`text-xs font-bold tracking-normal capitalize transition-colors shrink-0 ${
                        isCurrentActive ? 'text-[#ffd446]' : 'text-white/40 hover:text-white/80'
                      }`}
                    >
                      {fullLanguageName}
                    </button>
                  );
                })}
              </div>
            )}

            {/* STACK POSITION C: BUTTON ACTIONS CONTROL PANEL ROW */}
            <div className="flex items-center gap-2 h-13 relative">
              
              {/* Play / Pause Toggle Button */}
              {/* Play / Pause Toggle Button */}
              <button 
                onClick={togglePlay} 
                className="w-10 h-10 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <img src="/icons/pause.svg" className="w-7 h-7 invert" alt="Pause" />
                ) : (
                  <img src="/icons/play.svg" className="w-7 h-7 ml-0.5 invert" alt="Play" />
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
                <img src="/icons/forward10.svg" className="w-[22px] h-[22px] invert" alt="Fast Forward 10s" />
              </button>

              {/* Captions CC Menu Trigger Button */}
              <button 
                onClick={() => setShowCCMenu(!showCCMenu)} 
                className={`w-9 h-9 flex items-center justify-center transition-opacity duration-200 cursor-pointer ${showCCMenu ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
                title="Captions"
              >
                <img 
                  src="/icons/cc.svg" 
                  className="w-[22px] h-[22px]" 
                  alt="Captions" 
                  style={{
                    filter: selectedLangCode !== 'none'
                      ? 'invert(81%) sepia(31%) saturate(1179%) hue-rotate(338deg) brightness(103%) contrast(101%)'
                      : 'invert(100%)'
                  }}
                />
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
                  <img src="/icons/mute.svg" className="w-[22px] h-[22px] invert" alt="Unmute" />
                ) : (
                  <img src="/icons/volume.svg" className="w-[22px] h-[22px] invert" alt="Mute" />
                )}
              </button>
              
            </div>

            {/* STACK POSITION D: TRADITIONAL RESTRICTED SCRUBBER TRACK RUNNER */}
            <div className="w-full max-w-[320px] flex items-center justify-between gap-4 h-5 pl-1 mt-1 relative">
              <div className="w-10 text-right select-none font-mono font-bold text-sm text-white opacity-60 tracking-tight shrink-0">
                {formatTime(currentTime)}
              </div>

              <div className="flex-grow relative flex items-center h-5">
                
                {/* 1. Underlying Base Inactive Track (Darker Capsule) */}
                <div className="absolute inset-x-0 h-[10px] bg-white/25 rounded-full pointer-events-none z-10" />
                
                {/* 2. Active Progress Left Fill Track (Lighter Capsule With Rounded End Cap) */}
                <div 
                  className="absolute left-0 h-[10px] bg-white/60 rounded-full pointer-events-none z-10"
                  style={{ width: `${currentProgress}%` }}
                />

                {/* 3. Invisible Native Gesture Input Overlay with Expanded Circle Playhead Thumb */}
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
                  className="w-full h-5 appearance-none cursor-pointer outline-none bg-transparent relative z-20 m-0
                             [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-5 [&::-webkit-slider-runnable-track]:bg-transparent
                             [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:h-[18px] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform active:[&::-webkit-slider-thumb]:scale-110
                             [&::-moz-range-track]:w-full [&::-moz-range-track]:h-5 [&::-moz-range-track]:bg-transparent
                             [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-[18px] [&::-moz-range-thumb]:h-[18px] [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md"
                />
              </div>

              <div className="w-11 text-left select-none font-mono font-bold text-sm text-white opacity-60 tracking-tight shrink-0">
                -{formatTime(duration - currentTime)}
              </div>
            </div>

          </div>

          {/* LOADING INDICATOR OVERLAY */}
          {isLoading && (
            <div className="absolute inset-0 bg-[#1f1f1f] flex items-center justify-center font-mono text-xs text-white/60 tracking-widest z-30 backdrop-blur-sm">
              BUFFERING STREAM CODES...
            </div>
          )}

        </div>

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