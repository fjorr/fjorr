'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface CinemaTheaterProps {
  film: {
    id: any;
    name: any;
    slug: any;
    mux_playback_id: any;
    last_line: any;
    story_date: any;
    location: any;
    language_subtitle?: {
      code: string;
      name: string;
      vtt_url: string;
    }[];
  };
  onClose: () => void;
  backUrl?: string; // Optional destination link to handle historical redirects
}

export default function CinemaTheater({ film, onClose, backUrl }: CinemaTheaterProps) {
  const router = useRouter();

  // --- LAYER STATE ARCHITECTURE ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false); 
  const [controlsVisible, setControlsVisible] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [showCCMenu, setShowCCMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // 🎬 BUMPER ENGINE ARCHITECTURE STATE
  const [isPlayingLogo, setIsPlayingLogo] = useState(true);
  const LOGO_SOURCE = "https://media.fjorr.com/assets/studio-logo/fjorr-studio-logo-master.mp4";

  // --- CUSTOM REACT SUBTITLE STATE ---
  const [selectedLangCode, setSelectedLangCode] = useState<string>('none');
  const [parsedCues, setParsedCues] = useState<any[]>([]);
  const [currentSubtitleText, setCurrentSubtitleText] = useState<string>('');
  
  // Anti-overwrite memory shield
  const [cachedSubtitles, setCachedSubtitles] = useState<any[]>([]);

  // --- NODES REF HOOKS ---
  const containerRef = useRef<HTMLDivElement | null>(null);
  const filmPlayerRef = useRef<HTMLVideoElement | null>(null);
  const logoPlayerRef = useRef<HTMLVideoElement | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCloseNavigation = () => {
    if (backUrl) {
      router.push(backUrl);
    } else {
      onClose();
    }
  };

  // 🎯 MOBILE SCROLL CONTAINMENT LIFECYCLE HOOK
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('fjorr_hide_main_navbar'));
    
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyHeight = document.body.style.height;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.body.style.height = '100svh';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      window.dispatchEvent(new CustomEvent('fjorr_show_main_navbar'));
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.height = originalBodyHeight;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  // Secure substrate cache layer mapping parameters cleanly on initialization
  useEffect(() => {
    if (film?.language_subtitle && film.language_subtitle.length > 0) {
      setCachedSubtitles(film.language_subtitle);
    }
  }, [film?.id, film?.language_subtitle]);

  // Fullscreen container lifecycle tracker hooks
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(
        !!document.fullscreenElement || 
        !!(document as any).webkitFullscreenElement ||
        !!(filmPlayerRef.current as any)?.webkitDisplayingFullscreen ||
        !!(logoPlayerRef.current as any)?.webkitDisplayingFullscreen
      );
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    
    const filmEl = filmPlayerRef.current;
    const logoEl = logoPlayerRef.current;
    
    if (filmEl) {
      filmEl.addEventListener('webkitbeginfullscreen', handleFsChange);
      filmEl.addEventListener('webkitendfullscreen', handleFsChange);
    }
    if (logoEl) {
      logoEl.addEventListener('webkitbeginfullscreen', handleFsChange);
      logoEl.addEventListener('webkitendfullscreen', handleFsChange);
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      if (filmEl) {
        filmEl.removeEventListener('webkitbeginfullscreen', handleFsChange);
        filmEl.removeEventListener('webkitendfullscreen', handleFsChange);
      }
      if (logoEl) {
        logoEl.removeEventListener('webkitbeginfullscreen', handleFsChange);
        logoEl.removeEventListener('webkitendfullscreen', handleFsChange);
      }
    };
  }, []);

  // --- AUTO-HIDE CONTROLS TRACKER ---
  const showUIControls = () => {
    if (isPlayingLogo) {
      setControlsVisible(false);
      return;
    }
    setControlsVisible(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);

    hideTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showCCMenu && !isScrubbing) {
        setControlsVisible(false);
      }
    }, 2000);
  };

  useEffect(() => {
    window.addEventListener('mousemove', showUIControls);
    return () => {
      window.removeEventListener('mousemove', showUIControls);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [isPlaying, showCCMenu, isScrubbing, isPlayingLogo]);

  // Global Interaction Handshake Click Capturer
  useEffect(() => {
    const processScreenInteraction = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-ui-control="true"]')) return;

      if (controlsVisible) {
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        setControlsVisible(false);
      } else {
        showUIControls();
      }
    };

    window.addEventListener('click', processScreenInteraction);
    window.addEventListener('touchend', processScreenInteraction);
    return () => {
      window.removeEventListener('click', processScreenInteraction);
      window.removeEventListener('touchend', processScreenInteraction);
    };
  }, [controlsVisible, isPlaying, showCCMenu, isScrubbing]);

  const handleVolumeChange = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setIsMuted(e.currentTarget.muted);
  };

  const handlePlayerReady = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    e.currentTarget.muted = isMuted;
  };

  // --- MEDIA PLAYER HANDLERS ---
  const togglePlay = () => {
    const player = isPlayingLogo ? logoPlayerRef.current : filmPlayerRef.current;
    if (!player) return;
    if (isPlaying) player.pause(); else player.play().catch(() => {});
  };

  const toggleMute = () => {
    const targetMuteState = !isMuted;
    if (logoPlayerRef.current) logoPlayerRef.current.muted = targetMuteState;
    if (filmPlayerRef.current) filmPlayerRef.current.muted = targetMuteState;
    setIsMuted(targetMuteState);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    const activeVideo = isPlayingLogo ? logoPlayerRef.current : filmPlayerRef.current;
    if (!container || !activeVideo) return;

    const isMobileSafari = /iPhone|iPod/.test(navigator.userAgent) && !(document as any).requestFullscreen;

    if (!document.fullscreenElement && !(document as any).webkitFullscreenElement && !(activeVideo as any).webkitDisplayingFullscreen) {
      if (isMobileSafari && (activeVideo as any).webkitEnterFullscreen) {
        (activeVideo as any).webkitEnterFullscreen();
      } else if (container.requestFullscreen) {
        container.requestFullscreen().catch(() => {});
      } else if ((container as any).webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen();
      }
    } else {
      if (isMobileSafari && (activeVideo as any).webkitExitFullscreen) {
        (activeVideo as any).webkitExitFullscreen();
      } else if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
  };

  const handleScrubStart = () => { if (!isPlayingLogo) setIsScrubbing(true); };
  const handleScrubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isPlayingLogo) return;
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    if (filmPlayerRef.current) filmPlayerRef.current.currentTime = targetTime;
  };
  const handleScrubEnd = (e: React.SyntheticEvent<HTMLInputElement>) => {
    if (isPlayingLogo) return;
    setIsScrubbing(false);
    const player = filmPlayerRef.current;
    if (!player || !duration) return;
    player.currentTime = parseFloat(e.currentTarget.value);
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

  // --- CLOSED CAPTION SELECTION ENGINE ---
  const handleSubtitleSelection = async (langCode: string, langName: string) => {
    setSelectedLangCode(langCode);
    setShowCCMenu(false);

    if (langCode === 'none') {
      setParsedCues([]);
      setCurrentSubtitleText('');
      return;
    }

    const tracksArray = cachedSubtitles.length > 0 ? cachedSubtitles : (film?.language_subtitle || []);
    const matchedRecord = tracksArray.find((item: any) => (item?.code || '').toLowerCase().trim() === langCode.toLowerCase().trim());
    
    let vttText = matchedRecord?.vtt_url;
    if (!vttText) return;

    const isExternalUrlLinkPath = vttText.trim().startsWith('http') || vttText.trim().includes('.vtt');
    if (isExternalUrlLinkPath) {
      try {
        const response = await fetch(vttText.trim());
        if (!response.ok) throw new Error(`HTTP network text track stream error status: ${response.status}`);
        vttText = await response.text();
      } catch (err) {
        console.error("🚨 Cloudflare VTT cross-origin download rejected by browser context:", err);
        return;
      }
    }

    try {
      let normalizedVttText = vttText.replace(/\\n/g, '\n');

      const lines = normalizedVttText.replace(/\r\n/g, '\n').split('\n');
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
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedLangCode === 'none' || parsedCues.length === 0) {
      setCurrentSubtitleText('');
      return;
    }
    const activeCue = parsedCues.find((cue) => currentTime >= cue.startTime && currentTime <= cue.endTime);
    setCurrentSubtitleText(activeCue ? activeCue.text : '');
  }, [currentTime, parsedCues, selectedLangCode]);

  useEffect(() => {
    const player = filmPlayerRef.current;
    if (!player) return;

    const disableNativeTracks = () => {
      if (player.textTracks) {
        for (let i = 0; i < player.textTracks.length; i++) player.textTracks[i].mode = 'disabled';
      }
    };

    disableNativeTracks();
    player.textTracks.addEventListener('addtrack', disableNativeTracks);
    return () => player.textTracks.removeEventListener('addtrack', disableNativeTracks);
  }, [film]);

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const m = Math.floor(time / 60);
    const s = Math.floor(Math.abs(time % 60)).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    const logoPlayer = logoPlayerRef.current;
    if (logoPlayer && isPlayingLogo) {
      logoPlayer.play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch(() => {
          logoPlayer.muted = true;
          setIsMuted(true);
          logoPlayer.play().then(() => setIsLoading(false)).catch(() => setIsLoading(false));
        });
    }
  }, [isPlayingLogo]);

  useEffect(() => {
    const filmPlayer = filmPlayerRef.current;
    
    setSelectedLangCode('none');
    setParsedCues([]);
    setCurrentSubtitleText('');

    if (filmPlayer && !isPlayingLogo && film) {
      setIsLoading(true);
      setIsEnded(false);
      
      filmPlayer.muted = isMuted; 
      
      const targetPlaybackId = film.mux_playback_id || (film as any).playback_id || (film as any).mux_id;

      if (!targetPlaybackId) {
        console.error("CRITICAL ERROR: No valid Mux Playback ID found!", film);
        setIsLoading(false);
        return;
      }

      if (filmPlayer.canPlayType('application/vnd.apple.mpegurl')) {
        filmPlayer.src = `https://stream.mux.com/${targetPlaybackId}.m3u8`;
      } else {
        filmPlayer.src = `https://stream.mux.com/${targetPlaybackId}/high.mp4`;
      }
      
      filmPlayer.load();
      filmPlayer.play()
        .then(() => {
          setIsPlaying(true);
          if (filmPlayerRef.current) {
            setIsMuted(filmPlayerRef.current.muted);
          }
        })
        .catch((err) => {
          console.warn("Feature play blocked by decoder runtime execution:", err);
          setIsLoading(false);
        });
    }
  }, [isPlayingLogo, film?.id]); 

  const handleVideoEnded = () => {
    if (isPlayingLogo) {
      setIsPlayingLogo(false);
      setCurrentTime(0);
      if (filmPlayerRef.current) {
        filmPlayerRef.current.muted = isMuted;
      }
    } else {
      setIsEnded(true);
      setIsPlaying(false);
      setControlsVisible(false);
    }
  };

  const currentProgress = duration ? (currentTime / duration) * 100 : 0;
  const playIcon = isPlaying ? <img src="/icons/pause.svg" className="w-8 h-8 invert" alt="Pause" /> : <img src="/icons/play.svg" className="w-8 h-8 ml-0.5 invert" alt="Play" />;
  const fullscreenIcon = isFullscreen ? <img src="/icons/compress.svg" className="w-6 h-6 invert" alt="Exit Fullscreen" /> : <img src="/icons/expand.svg" className="w-6 h-6 invert" alt="Enter Fullscreen" />;
  const volumeIcon = isMuted ? <img src="/icons/mute.svg" className="w-6 h-6 invert" alt="Unmute" /> : <img src="/icons/volume.svg" className="w-6 h-6 invert" alt="Mute" />;
  const currentLanguageTracks = cachedSubtitles.length > 0 ? cachedSubtitles : (film?.language_subtitle || []);

  return (
    <div 
      ref={containerRef}
      id="fjorr-theater-root"
      className="fixed inset-0 w-full h-[100svh] bg-[#1f1f1f] text-[#F5F5F7] select-none overflow-hidden touch-none flex flex-col justify-between font-sans z-[999999] animate-in fade-in duration-300"
    >
      
     {/* 🎬 DYNAMIC THEATER PILL NAVBAR HEADER */}
     <header 
        data-ui-control="true" 
        className={`absolute top-0 inset-x-0 w-full h-[70px] pt-[20px] px-4 flex justify-center pointer-events-none z-50 transition-all duration-500 ease-out ${
          controlsVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        <div className="inline-flex h-[50px] px-[30px] items-center gap-[20px] pointer-events-auto bg-transparent">
          
          {/* Left: Official Fjorr Logo Box */}
          <div className="w-[50px] flex items-center text-white shrink-0 translate-y-[2px]">
          <svg viewBox="0 0 143 81" className="w-full h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M71.3559 13.2942C60.8993 13.2942 52.4273 21.7814 52.4273 32.2448C52.4273 42.7082 60.9046 51.1953 71.3559 51.1953C81.8073 51.1953 90.2846 42.7082 90.2846 32.2448C90.2846 21.7814 81.8073 13.2942 71.3559 13.2942ZM71.3559 39.7278C67.232 39.7278 63.8869 36.3789 63.8869 32.2501C63.8869 28.1214 67.232 24.7725 71.3559 24.7725C75.4799 24.7725 78.825 28.1214 78.825 32.2501C78.825 36.3789 75.4799 39.7278 71.3559 39.7278Z" fill="currentColor"/>
            <path d="M35.9047 15.0355C35.4032 15.0355 34.9978 15.4414 34.9978 15.9435V60.9377C34.9978 65.4136 31.5887 69.0883 27.23 69.505C26.7605 69.5477 26.403 69.9322 26.403 70.4023V80.0912C26.403 80.6146 26.8405 81.0206 27.3633 80.9992C37.996 80.4971 46.4627 71.7109 46.4627 60.9377V15.9435C46.4627 15.4414 46.0573 15.0355 45.5558 15.0355H35.9047Z" fill="currentColor"/>
            <path d="M0 0.908003V48.498C0 49.0001 0.405462 49.406 0.906954 49.406H11.9931C12.4946 49.406 12.9001 49.0001 12.9001 48.498V35.1397C12.4946 34.6376 13.3055 34.2317H26.0616C26.5631 34.2317 26.9685 33.8258 26.9685 33.3237V23.6615C26.9685 23.1594 26.5631 22.7535 26.0616 22.7535H13.807V11.4675C12.9001 11.4675 13.3055 11.4675 13.807 11.4675H27.4967C27.9982 11.4675 28.4037 11.0616 28.4037 10.5595V0.908003C28.4037 0.405931 27.9982 0 27.4967 0H0.906954C0.405462 0 0 0.405931 0 0.908003Z" fill="currentColor"/>
            <path d="M116.309 15.9435V22.7375C116.309 23.2395 115.402 23.6455 115.402 23.6455H108.509C108.066 23.6455 107.709 24.0033 107.709 24.4466V48.5568C107.709 49.0589 107.303 49.4648 106.802 49.4648H97.1508C96.6493 49.4648 96.2438 49.0589 96.2438 48.5568V15.9435C96.2438 15.4414 96.6493 15.0355 97.1508 15.0355H115.402C115.903 15.0355 116.309 15.4414 116.309 15.9435Z" fill="currentColor"/>
            <path d="M143 15.9435V22.7375C143 23.2395 142.595 23.6455 142.093 23.6455H135.2C134.757 23.6455 134.4 24.0033 134.4 24.4466V48.5568C134.4 49.0589 133.994 49.4648 133.493 49.4648H123.842C123.34 49.4648 122.935 49.0589 122.935 48.5568V15.9435C122.935 15.4414 123.34 15.0355 123.842 15.0355H142.093C142.595 15.0355 143 15.4414 143 15.9435Z" fill="currentColor"/>
          </svg>
          </div>

          {/* Center: Slogan Display */}
          <div className="flex items-center shrink-0">
            <span className="font-sans text-xs font-medium tracking-normal select-none whitespace-nowrap text-white/80">
              Short films of the greatest stories
            </span>
          </div>

          {/* Right: Close icon */}
          <button 
            onClick={handleCloseNavigation} 
            className="w-[18px] h-[18px] flex items-center justify-center cursor-pointer shrink-0 text-white bg-transparent border-0 p-0 outline-none transition-opacity hover:opacity-70"
            title="Close Theater"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>

        </div>
      </header>

      {/* 📹 FILM PLAYER CORE FRAME */}
      <div className="flex-grow w-full flex items-center justify-center">
        <div className={`relative w-full max-w-[1200px] aspect-video overflow-hidden bg-black transition-all duration-500 z-10 flex flex-col justify-end ${isFullscreen ? 'max-w-none h-screen rounded-none border-0' : 'xl:rounded-[12px]'}`}>
          
          {/* PLAYER CONTAINER 1: LOGO BUMPER INTRO */}
          {isPlayingLogo && (
            <video
              ref={logoPlayerRef}
              src={LOGO_SOURCE}
              preload="auto"
              playsInline
              onCanPlay={handlePlayerReady}
              onVolumeChange={handleVolumeChange}
              className="w-full h-full object-contain absolute inset-0 z-20 bg-black"
              onEnded={handleVideoEnded}
            />
          )}

          {/* PLAYER CONTAINER 2: DYNAMIC FEATURE FILM */}
          <video
            ref={filmPlayerRef}
            id="fjorr-engine"
            preload="auto"
            playsInline
            crossOrigin="anonymous"
            onCanPlay={handlePlayerReady}
            onVolumeChange={handleVolumeChange}
            className="w-full h-full object-contain absolute inset-0 z-0 bg-black"
            style={{ filter: isEnded ? 'blur(20px) brightness(0.3)' : 'blur(0px)' }}
            onTimeUpdate={(e) => { if (!isScrubbing) setCurrentTime(e.currentTarget.currentTime); }}
            onDurationChange={(e) => setDuration(e.currentTarget.duration)}
            onPlaying={() => { setIsPlaying(true); setIsEnded(false); setIsLoading(false); }}
            onPause={() => setIsPlaying(false)}
            onEnded={handleVideoEnded}
          />

          <div className="absolute inset-0 bg-black/40 transition-opacity duration-500 pointer-events-none z-10" style={{ opacity: controlsVisible ? 1 : 0 }} />

          {/* Captions Overlay */}
          {selectedLangCode !== 'none' && currentSubtitleText && (
            <div className="absolute bottom-[6%] left-1/2 -translate-x-1/2 max-w-[85%] text-center px-5 py-2.5 bg-zinc-950/70 backdrop-blur-md border border-white/10 rounded-[6px] text-[#F5F5F7] font-medium text-[15px] md:text-base tracking-tight leading-relaxed z-25 pointer-events-none select-none font-sans whitespace-pre-line shadow-2xl">
              {currentSubtitleText}
            </div>
          )}

          {isLoading && (
            <div className="absolute inset-0 bg-black flex items-center justify-center text-sm font-sans font-bold tracking-normal text-white/0 z-30">Rolling...</div>
          )}
        </div>
      </div>

      {/* 🎛️ HUD CONTROLS FOOTER BLOCK */}
      <div 
        data-ui-control="true" 
        className={`fixed bottom-0 inset-x-0 w-full flex flex-col justify-end items-center text-center z-30 transition-all duration-500 ease-out select-none px-8 pb-[calc(env(safe-area-inset-bottom)_+_1.5rem)] gap-3 ${controlsVisible && !isPlayingLogo ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}
      >
        <div className="flex flex-col items-center pl-1 text-[#F5F5F7]">
          <h2 className="text-[20px] md:text-2xl font-bold tracking-tight leading-none">
            {film?.name}
          </h2>
          <p className="text-xs md:text-sm font-medium opacity-60 mt-2 tracking-normal">
            {(() => {
              const dateVal = film?.story_date || '';
              const locationVal = film?.location || '';
              if (dateVal && locationVal) return `${dateVal} · ${locationVal}`;
              return dateVal || locationVal || 'Theatrical Feature';
            })()}
          </p>
        </div>

        {showCCMenu && (
          <div className="w-max flex items-center gap-4 px-4 py-2 bg-zinc-900/90 backdrop-blur-md border border-white/5 rounded-[6px] overflow-hidden shadow-xl animate-in fade-in slide-in-from-left-2 duration-200">
            <button 
              onClick={() => handleSubtitleSelection('none', 'Off')} 
              className={`text-xs font-bold tracking-normal transition-colors bg-transparent border-0 outline-none cursor-pointer uppercase ${selectedLangCode === 'none' ? 'text-[#ffd446]' : 'text-white/40 hover:text-white/80'}`}
            >
              Off
            </button>
            {(() => {
              if (!Array.isArray(currentLanguageTracks)) return null;
              
              return currentLanguageTracks.map((item: any) => {
                const code = (item?.code || '').trim();
                const fullLanguageName = (item?.name || code.toUpperCase()).trim();
                if (!code) return null;
                
                return (
                  <button 
                    key={code} 
                    onClick={() => handleSubtitleSelection(code, fullLanguageName)} 
                    className={`text-xs font-bold tracking-normal transition-colors bg-transparent border-0 outline-none cursor-pointer ${selectedLangCode?.toLowerCase().trim() === code.toLowerCase() ? 'text-[#ffd446]' : 'text-white/40 hover:text-white/80'}`}
                  >
                    {fullLanguageName}
                  </button>
                );
              });
            })()}
          </div>
        )}

        <div className="flex items-center gap-2 h-10 relative justify-center">
          <button onClick={togglePlay} className="w-12 h-12 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity bg-transparent border-0 outline-none cursor-pointer" title={isPlaying ? "Pause" : "Play"}>
            {playIcon}
          </button>
          <button onClick={() => { const p = filmPlayerRef.current; if (p) p.currentTime = Math.max(0, currentTime - 10); }} className="w-10 h-10 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity bg-transparent border-0 outline-none cursor-pointer" title="Rewind 10s"><img src="/icons/back10.svg" className="w-6 h-6 invert" alt="Rewind 10s" /></button>
          <button onClick={() => { const p = filmPlayerRef.current; if (p) p.currentTime = Math.min(duration, currentTime + 10); }} className="w-10 h-10 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity bg-transparent border-0 outline-none cursor-pointer" title="Fast Forward 10s"><img src="/icons/forward10.svg" className="w-6 h-6 invert" alt="Fast Forward 10s" /></button>
          <button onClick={() => setShowCCMenu(!showCCMenu)} className={`w-10 h-10 flex items-center justify-center transition-opacity bg-transparent border-0 outline-none cursor-pointer ${showCCMenu ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`} title="Captions"><img src="/icons/cc.svg" className="w-6 h-6" alt="Captions" style={{ filter: 'invert(100%)' }} /></button>
          <button onClick={toggleFullscreen} className="w-10 h-10 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity bg-transparent border-0 outline-none cursor-pointer" title="Fullscreen">
            {fullscreenIcon}
          </button>
          <button onClick={toggleMute} className="w-10 h-10 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity bg-transparent border-0 outline-none cursor-pointer" title={isMuted ? "Unmute" : "Mute"}>
            {volumeIcon}
          </button>
        </div>

        {/* 🎯 PROGRESS SCRUBBER CONTAINER */}
        <div className="w-full md:max-w-[500px] flex items-center justify-between gap-4 h-10 pl-1 mt-1 relative mx-auto">
          
          {/* ⏱️ CURRENT TIME DISPLAY VALUE */}
          <div 
            style={{ 
              color: isScrubbing ? '#F3B632' : '#FFFFFF',
              opacity: isScrubbing ? 1 : 0.6,
              transition: 'color 200ms ease, opacity 200ms ease'
            }}
            className="w-10 text-right select-none font-mono font-bold text-sm tracking-tight shrink-0 self-center leading-none"
          >
            {formatTime(currentTime)}
          </div>
          
          <div className="flex-grow relative flex items-center h-10 select-none">
            <div className="absolute inset-x-0 h-[10px] bg-white/25 rounded-full pointer-events-none z-10 top-1/2 -translate-y-1/2" />
            <div className="absolute left-0 h-[10px] bg-white/60 rounded-full pointer-events-none z-10 top-1/2 -translate-y-1/2" style={{ width: `${currentProgress}%` }} />
            
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
              className="w-full h-10 appearance-none bg-transparent cursor-pointer outline-none relative z-20 m-0 block focus:outline-none focus:ring-0 focus:border-transparent [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-10 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform active:[&::-webkit-slider-thumb]:scale-110 [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:top-1/2 [&::-webkit-slider-thumb]:-translate-y-1/2 [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:outline-none [&::-moz-range-track]:w-full [&::-moz-range-track]:h-10 [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md active:[&::-moz-range-thumb]:scale-110 [&::-moz-range-thumb]:outline-none" 
              style={{ accentColor: '#ffffff', WebkitAppearance: 'none' }} 
            />
          </div>

          {/* ⏱️ TIME REMAINING DISPLAY VALUE */}
          <div 
            style={{ 
              color: isScrubbing ? '#F3B632' : '#FFFFFF',
              opacity: isScrubbing ? 1 : 0.6,
              transition: 'color 200ms ease, opacity 200ms ease'
            }}
            className="w-11 text-left select-none font-mono font-bold text-sm tracking-tight shrink-0 self-center leading-none"
          >
            -{formatTime(duration - currentTime)}
          </div>

        </div>
      </div>

      {/* REPLAY FILM END SCREEN OVERLAY */}
      <div id="end-screen" data-ui-control="true" className="absolute inset-0 bg-[#1f1f1f] backdrop-blur-sm flex flex-col items-center justify-center transition-all duration-500 ease-in-out z-40" style={{ opacity: isEnded ? 1 : 0, pointerEvents: isEnded ? 'auto' : 'none' }}>
        <div className="max-w-2xl text-center flex flex-col items-center gap-8 px-6 relative">
          <p className="font-sans text-lg font-semibold text-[#F5F5F7]/90 leading-relaxed max-w-lg">{film?.last_line || 'The credits fade to black.'}</p>
          
          <div className="flex items-center gap-6 text-white/50 font-sans font-semibold text-sm">
            <button 
              onClick={handleCloseNavigation} 
              className="flex items-center gap-2 hover:text-[#f5f5f7] transition-colors group bg-transparent border-0 outline-none cursor-pointer font-sans"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Close
            </button>

            <button 
              onClick={() => {
                const shareData = { title: film?.name, url: `${window.location.origin}/film/${film?.slug}` };
                if (navigator.share) { 
                  navigator.share(shareData).catch(() => {}); 
                } else { 
                  navigator.clipboard.writeText(shareData.url); 
                  alert('Link copied to clipboard'); 
                }
              }}
              className="flex items-center gap-2 hover:text-[#f5f5f7] transition-colors group bg-transparent border-0 outline-none cursor-pointer font-sans normal-case"
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

            <button onClick={handleCloseNavigation} className="flex items-center gap-2 hover:text-[#f5f5f7] transition-colors group bg-transparent border-0 outline-none cursor-pointer font-sans">
              Onward 
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 group-translate-x-1 transition-transform">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          </div>
          
          <div className="font-tradeGothic tracking-tight text-[#F5F5F7]/40 uppercase text-base">
            <span>{film?.name}</span> &nbsp;<span>{film?.story_date}</span> &nbsp;<span>{film?.location}</span>
          </div>
        </div>
      </div>

    </div>
  );
}