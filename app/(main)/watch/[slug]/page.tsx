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
  const [hoverIndex, setHoverIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);

  // --- CUSTOM REACT SUBTITLE STATE ---
  const [selectedLangCode, setSelectedLangCode] = useState<string>('none');
  const [parsedCues, setParsedCues] = useState<any[]>([]);
  const [currentSubtitleText, setCurrentSubtitleText] = useState<string>('');

  // --- STORYBOARD PREVIEW STATE ---
  const [spriteUrl, setSpriteUrl] = useState('');
  const [tilesTotal, setTilesTotal] = useState(0);
  const [previewStyle, setPreviewStyle] = useState<React.CSSProperties>({});

  // --- NODES REF HOOKS ---
  const playerRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tockBarRef = useRef<HTMLDivElement | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const TOTAL_TOCKS = typeof window !== 'undefined' && window.innerWidth < 768 ? 30 : 60;
  const cols = 5;

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
          language_subtitle (
            vtt_url,
            language ( code, name )
          )
        `)
        .eq('slug', slug)
        .maybeSingle();

      if (data) {
        setFilm(data);
        if (data.mux_playback_id) {
          loadStoryboard(data.mux_playback_id);
        }
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

  const loadStoryboard = async (playbackId: string) => {
    try {
      const response = await fetch(`https://image.mux.com/${playbackId}/storyboard.json`);
      if (!response.ok) return;
      const data = await response.json();
      setSpriteUrl(`https://image.mux.com/${playbackId}/storyboard.jpg`);
      setTilesTotal(data.tiles.length);
    } catch (err) {
      console.warn("📸 FJORR: Storyboard processing bypassed.");
    }
  };

  // --- 2. CANVAS RENDERING ENGINE (Bypassed for main track but kept for stability checks) ---
  const renderTocks = () => {
    const canvas = canvasRef.current;
    const player = playerRef.current;
    if (!canvas || !player || !duration) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    if (canvas.width !== rect.width * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    }

    ctx.clearRect(0, 0, rect.width, rect.height);
  };

  useEffect(() => {
    renderTocks();
  }, [currentTime, duration, hoverIndex]);

  // --- 3. AUTO-HIDE INTERACTION MANAGEMENT ---
  const showUIControls = () => {
    setControlsVisible(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);

    hideTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showCCMenu && hoverIndex === -1) {
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
  }, [isPlaying, showCCMenu, hoverIndex]);

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

  const handleScrub = (e: any) => {
    const canvas = tockBarRef.current;
    const player = playerRef.current;
    if (!canvas || !player || !duration) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const rect = canvas.getBoundingClientRect();
    const p = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);

    const activeHover = Math.round(p * (TOTAL_TOCKS - 1));
    setHoverIndex(activeHover);

    if (tilesTotal > 0 && window.innerWidth >= 768 && !showCCMenu) {
      let tIdx = Math.floor(p * tilesTotal);
      const rows = Math.ceil(tilesTotal / cols);
      const c = tIdx % cols;
      const r = Math.floor(tIdx / cols);

      setPreviewStyle({
        display: 'block',
        opacity: 1,
        left: `${p * 100}%`,
        backgroundImage: `url('${spriteUrl}')`,
        backgroundSize: `${cols * 100}% ${rows * 100}%`,
        backgroundPosition: `${(c / (cols - 1)) * 100}% ${(r / (rows - 1)) * 100}%`,
      });
    }

    if (e.touches || e.buttons === 1 || e.type === 'click') {
      player.currentTime = p * duration;
    }
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

  const activeDisplayTime = hoverIndex !== -1 ? (hoverIndex / (TOTAL_TOCKS - 1)) * duration : currentTime;
  const progressPercent = (currentTime / (duration || 1)) * 100;

  return (
    <div className="w-full h-screen bg-[#1f1f1f] text-[#F5F5F7] select-none relative overflow-hidden flex items-center justify-center font-sans">
      
      {/* 📹 WIDESCREEN BOUNDED FILM CONTAINER FRAME */}
      <div className={`w-full mx-auto aspect-video relative flex items-center justify-center overflow-hidden transition-all duration-500 z-10 ${
        isFullscreen 
          ? 'max-w-none px-0 h-screen rounded-0 border-0' 
          : 'max-w-[1200px] px-0 rounded-0 xl:rounded-[12px] bg-[#1f1f1f]'
      }`}>
        
        <video
          ref={playerRef}
          id="fjorr-engine"
          src={`https://stream.mux.com/${film.mux_playback_id}.m3u8`}
          playsInline
          crossOrigin="anonymous"
          className="w-full h-full object-contain pointer-events-none"
          style={{ filter: isEnded ? 'blur(20px) brightness(0.3)' : 'blur(0px)' }}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onDurationChange={(e) => setDuration(e.currentTarget.duration)}
          onPlaying={() => { setIsPlaying(true); setIsEnded(false); setIsLoading(false); }}
          onPause={() => setIsPlaying(false)}
          onEnded={() => { setIsEnded(true); setIsPlaying(false); setControlsVisible(false); }}
        />

        {/* 🎯 FLOATING SUBTITLES OVERLAY CONTAINER */}
        {selectedLangCode !== 'none' && currentSubtitleText && (
          <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 max-w-[85%] text-center px-5 py-2 bg-zinc-950/80 backdrop-blur-md border border-white/5 rounded-[6px] text-[#F5F5F7] font-medium text-[15px] md:text-[17px] tracking-tight leading-relaxed z-20 pointer-events-none select-none font-inter animate-in fade-in zoom-in-95 duration-100 shadow-2xl">
            {currentSubtitleText}
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 bg-[#1f1f1f] flex items-center justify-center font-mono text-xs text-white/20 tracking-widest z-30 backdrop-blur-sm">
            BUFFERING STREAM CODES...
          </div>
        )}

      </div>

      {/* 🌌 FULL WIDTH TOP NAVIGATION LAYER */}
      <div 
        className="absolute top-0 inset-x-0 h-32 flex items-start justify-between px-8 pt-8 transition-opacity duration-500 z-30"
        style={{ opacity: controlsVisible ? 1 : 0, pointerEvents: controlsVisible ? 'auto' : 'none' }}
      >
        <div className="flex items-center gap-4 text-left select-none">
          <Link 
            href="/" 
            className="hover:opacity-80 transition-opacity cursor-pointer flex items-center"
            title="Return to Home"
          >
            <svg className="w-[52px] h-auto text-white opacity-95" viewBox="0 0 143 81" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M71.3559 13.2942C60.8993 13.2942 52.4273 21.7814 52.4273 32.2448C52.4273 42.7082 60.9046 51.1953 71.3559 51.1953C81.8073 51.1953 90.2846 42.7082 90.2846 32.2448C90.2846 21.7814 81.8073 13.2942 71.3559 13.2942ZM71.3559 39.7278C67.232 39.7278 63.8869 36.3789 63.8869 32.2501C63.8869 28.1214 67.232 24.7725 71.3559 24.7725C75.4799 24.7725 78.825 28.1214 78.825 32.2501C78.825 36.3789 75.4799 39.7278 71.3559 39.7278Z" fill="currentColor"/>
              <path d="M35.9047 15.0355C35.4032 15.0355 34.9978 15.4414 34.9978 15.9435V60.9377C34.9978 65.4136 31.5887 69.0883 27.23 69.505C26.7605 69.5477 26.403 69.9322 26.403 70.4023V80.0912C26.403 80.6146 26.8405 81.0206 27.3633 80.9992C37.996 80.4971 46.4627 71.7109 46.4627 60.9377V15.9435C46.4627 15.4414 46.0573 15.0355 45.5558 15.0355H35.9047Z" fill="currentColor"/>
              <path d="M0 0.908003V48.498C0 49.0001 0.405462 49.406 0.906954 49.406H11.9931C12.4946 49.406 12.9001 49.0001 12.9001 48.498V35.1397C12.9001 34.6376 13.3055 34.2317 13.807 34.2317H26.0616C26.5631 34.2317 26.9685 33.8258 26.9685 33.3237V23.6615C26.9685 23.1594 26.5631 22.7535 26.0616 22.7535H13.807C13.3055 22.7535 12.9001 22.3476 12.9001 21.8455V12.3755C12.9001 11.8735 13.3055 11.4675 13.807 11.4675H27.4967C27.9982 11.4675 28.4037 11.0616 28.4037 10.5595V0.908003C28.4037 0.405931 27.9982 0 27.4967 0H0.906954C0.405462 0 0 0.405931 0 0.908003Z" fill="currentColor"/>
              <path d="M116.309 15.9435V22.7375C116.309 23.2395 115.903 23.6455 115.402 23.6455H108.509C108.066 23.6455 107.709 24.0033 107.709 24.4466V48.5568C107.709 49.0589 107.303 49.4648 106.802 49.4648H97.1508C96.6493 49.4648 96.2438 49.0589 96.2438 48.5568V15.9435C96.2438 15.4414 96.6493 15.0355 97.1508 15.0355H115.402C115.903 15.0355 116.309 15.4414 116.309 15.9435Z" fill="currentColor"/>
              <path d="M143 15.9435V22.7375C143 23.2395 142.595 23.6455 142.093 23.6455H135.2C134.757 23.6455 134.4 24.0033 134.4 24.4466V48.5568C134.4 49.0589 133.994 49.4648 133.493 49.4648H123.842C123.34 49.4648 122.935 49.0589 122.935 48.5568V15.9435C122.935 15.4414 123.34 15.0355 123.842 15.0355H142.093C142.595 15.0355 143 15.4414 143 15.9435Z" fill="currentColor"/>
            </svg>
          </Link>
          <h1 className="text-sm tracking-normal font-semibold text-white/80 opacity-90 font-sans -mt-1">
            {film.name}
          </h1>
        </div>
        <button 
          onClick={() => router.push(`/film/${film.slug}`)}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-[#1f1f1f]/20 hover:bg-white/10 transition-colors group"
        >
          <svg className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>

      {/* 🎛️ FULL WIDTH CONTROLS HUD OVERLAY BAR */}
      <div 
        className="absolute bottom-0 inset-x-0 h-56 flex flex-col justify-end px-6 md:px-12 pb-6 transition-opacity duration-500 z-30 select-none"
        style={{ opacity: controlsVisible ? 1 : 0, pointerEvents: controlsVisible ? 'auto' : 'none' }}
      >
        
        {/* ROW 1: THE TIMELINE TICKS SCRUB GRID (With Glass Backing Board & Pure Dither No Lines) */}
        <div className="w-full max-w-xl mx-auto flex items-center justify-between gap-4 mb-4 relative h-12 bg-zinc-950/20 border border-white/5 backdrop-blur-md rounded-[10px] px-4 shadow-xl">
          
          <div 
            className="w-12 md:w-14 text-right select-none font-semibold text-sm tracking-tight transition-colors duration-150 shrink-0"
            style={{ 
              fontFamily: "JetBrains Mono, Menlo, Monaco, Consolas, monospace",
              color: hoverIndex !== -1 ? '#76c3ff' : '#F5F5F7'
            }}
          >
            {formatTime(activeDisplayTime)}
          </div>

          <div 
            ref={tockBarRef}
            className="flex-grow h-6 flex items-center relative cursor-pointer group/scrub"
            onMouseMove={handleScrub}
            onMouseDown={handleScrub}
            onTouchStart={(e) => { e.preventDefault(); handleScrub(e); }}
            onTouchMove={(e) => { e.preventDefault(); handleScrub(e); }}
            onMouseLeave={() => { setHoverIndex(-1); setPreviewStyle({ opacity: 0 }); }}
            onTouchEnd={() => { setHoverIndex(-1); setPreviewStyle({ opacity: 0 }); }}
          >
            <div 
              className="absolute bottom-10 w-[240px] aspect-[16/9] -ml-[120px] bg-zinc-950 border border-white/5 shadow-2xl rounded-[6px] bg-no-repeat transition-opacity duration-200 pointer-events-none hidden z-30"
              style={previewStyle}
            />

            {/* 🎯 TRACK 1: Solid played progress tracking bar */}
            <div 
              className="absolute left-0 h-1 bg-[#FFFFFF] rounded-full opacity-80"
              style={{ width: `${progressPercent}%` }}
            />

            {/* 🎯 TRACK 2: Pure Dithered dot matrix mask covering remaining time frame segment */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 right-0 h-4 pointer-events-none mix-blend-screen opacity-25 transition-all duration-75"
              style={{
                left: `${progressPercent}%`,
                backgroundImage: `radial-gradient(circle, #F5F5F7 1px, transparent 1.5px)`,
                backgroundSize: '4px 4px'
              }}
            />

            {/* Hidden canvas ref preserved for component life stability checks */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div 
            className="w-14 md:w-16 text-left select-none font-semibold text-[13px] md:text-[14px] tracking-tight transition-colors duration-150 shrink-0"
            style={{ 
              fontFamily: "JetBrains Mono, Menlo, Monaco, Consolas, monospace",
              color: hoverIndex !== -1 ? '#76c3ff' : '#F5F5F7'
            }}
          >
            -{formatTime(duration - activeDisplayTime)}
          </div>
        </div>

        {/* ROW 2: CONTROL PILL BAR + FIXED HUD BILLING BLOCK */}
        <div className="w-full flex flex-col items-center gap-4 relative">
          <div className="flex items-center gap-1.5 bg-zinc-950/40 border border-white/5 backdrop-blur-xl px-3.5 h-11 rounded-[10px] shadow-2xl relative">
            
            {/* 1. Custom Rewind Back 10s */}
            <button 
              onClick={() => { if (playerRef.current) playerRef.current.currentTime = Math.max(0, currentTime - 10); }} 
              className="w-8 h-8 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity duration-200 cursor-pointer select-none"
              title="Rewind 10s"
            >
              <img src="/icons/back10.svg" className="w-6 h-6 invert" alt="Rewind 10s" />
            </button>

            {/* 2. Custom Play / Pause Toggle */}
            <button 
              onClick={togglePlay} 
              className="w-8 h-8 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity duration-200 cursor-pointer select-none"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <img src="/icons/pause.svg" className="w-[22px] h-[22px] invert" alt="Pause Stream" />
              ) : (
                <img src="/icons/play.svg" className="w-[22px] h-[22px] ml-0.5 invert" alt="Play Stream" />
              )}
            </button>

            {/* 3. Custom Fast Forward 10s */}
            <button 
              onClick={() => { if (playerRef.current) playerRef.current.currentTime = Math.min(duration, currentTime + 10); }} 
              className="w-8 h-8 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity duration-200 cursor-pointer select-none"
              title="Fast Forward 10s"
            >
              <img src="/icons/forward10.svg" className="w-6 h-6 invert" alt="Forward 10s" />
            </button>

            {/* 4. Custom Captions CC Menu Trigger */}
            <button 
              onClick={() => setShowCCMenu(!showCCMenu)} 
              className={`w-8 h-8 flex items-center justify-center transition-opacity duration-200 cursor-pointer select-none ${showCCMenu || selectedLangCode !== 'none' ? 'opacity-100 brightness-150' : 'opacity-70 hover:opacity-100'}`}
              title="Captions"
            >
              <img src="/icons/cc.svg" className="w-6 h-6 invert" alt="Captions Menu Toggle" />
            </button>

            {/* 5. Custom Fullscreen Toggle Switch */}
            <button 
              onClick={toggleFullscreen} 
              className="w-8 h-8 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity duration-200 cursor-pointer select-none"
              title="Fullscreen"
            >
              {isFullscreen ? (
                <img src="/icons/compress.svg" className="w-6 h-6 invert" alt="Exit Fullscreen" />
              ) : (
                <img src="/icons/expand.svg" className="w-6 h-6 invert" alt="Enter Fullscreen" />
              )}
            </button>

            {/* 6. Custom Volume Speaker Mute Toggle */}
            <button 
              onClick={toggleMute} 
              className="w-8 h-8 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity duration-200 cursor-pointer select-none"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <img src="/icons/mute.svg" className="w-6 h-6 invert" alt="Unmute Audio Feed" />
              ) : (
                <img src="/icons/volume.svg" className="w-6 h-6 invert" alt="Mute Audio Feed" />
              )}
            </button>
            
            {/* Subtitle dropdown language selector panel popup layer */}
            {showCCMenu && (
              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-50">
                <div className="w-44 bg-[#2a2a2a] shadow-2xl rounded-[8px] backdrop-blur-xl p-1.5 flex flex-col gap-0.5 text-left text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
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

          {/* 🎯 HUD OVERLAY ACTIVE FILM METADATA LINE BLOCK */}
          <div 
            className="font-tradeGothic tracking-normal text-white/20 uppercase select-none pointer-events-none origin-center transform scale-y-135 leading-loose text-center max-w-lg hidden md:block animate-in fade-in duration-300"
            style={{ 
              fontSize: '14px',
              textShadow: '0 1px 2px rgba(0,0,0,0.4)'
            }}
          >
            <span className="text-white/40">Fjorr</span> &nbsp;&nbsp; <span className="text-white/40">{film?.name}</span> &nbsp;&nbsp; <span className="text-white/40">2026</span> &nbsp;&nbsp; <span className="text-white/40">{formatTime(duration)}</span>
          </div>
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
          
          {/* Last Line Quote Block */}
          <p className="font-sans text-lg md:text-lg font-semibold text-[#F5F5F7]/90 leading-relaxed max-w-xl">
            {film.last_line || 'The credits fade to black.'}
          </p>

          {/* Action Buttons Row (Replay, Share, Onward) */}
          <div className="flex items-center gap-6 text-white/50 tracking-wider font-sans text-sm">
            
            {/* 1. Replay Button Hook */}
            <button 
              onClick={handleReplay}
              className="flex items-center gap-2 hover:text-[#f5f5f7] transition-colors group cursor-pointer normal-case"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-4 h-4 group-hover:-rotate-45 transition-transform duration-300"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Replay
            </button>

            {/* 2. Share Button Hook */}
            <button 
              onClick={() => {
                const shareData = {
                  title: film.name,
                  url: `${window.location.origin}/film/${film.slug}`
                };
                
                if (navigator.share) {
                  navigator.share(shareData).catch(() => {});
                } else {
                  navigator.clipboard.writeText(shareData.url);
                  alert('Link copied to clipboard');
                }
              }}
              className="flex items-center gap-2 hover:text-[#f5f5f7] transition-colors group cursor-pointer normal-case"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-4 h-4 transition-transform duration-200"
              >
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <g className="group-hover:-translate-y-0.5 transition-transform duration-200">
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </g>
              </svg>
              Share
            </button>

            {/* 3. Onward Link Hook */}
            <Link 
              href={`/film/${film.slug}`}
              className="flex items-center gap-2 hover:text-[#f5f5f7] transition-colors group normal-case"
            >
              Onward 
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-4 h-4 group-translate-x-1 transition-transform"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>

          </div>

          {/* 🎯 THEATRICAL ARCHIVAL BILLING BLOCK (Only displays right here on end screen footer) */}
          <div 
            className="font-tradeGothic tracking-normal text-white/20 uppercase select-none pointer-events-none origin-center transform scale-y-135 leading-loose text-center max-w-lg"
            style={{ 
              fontSize: '14px',
              textShadow: '0 1px 2px rgba(0,0,0,0.4)'
            }}
          >
            <span className="text-white/40">Fjorr</span> &nbsp;&nbsp; <span className="text-white/40">{film.name}</span> &nbsp;&nbsp; <span className="text-white/40">2026</span> &nbsp;&nbsp; <span className="text-white/40">{formatTime(duration)}</span>
          </div>

        </div>
      </div>

    </div>
  );
}