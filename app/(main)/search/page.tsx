'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react'; // 🎯 Added Suspense
import { useSearchParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

import SearchIdleView from '@/components/SearchIdleView';
import SearchResultsGrid from '@/components/SearchResultsGrid';
import SearchNadaView from '@/components/SearchNadaView';

interface SearchItem {
  id: string;
  internal_id: string;
  item_type: 'film' | 'artifact';
  slug: string;
  name: string;
  teaser: string;
  blok_tall: string;
  search_content: string;
  release_date: string;
  rating?: string;
  theme?: string;
  runtime?: number;
  label?: string;
  creator?: string;
}

// 📦 1. MOVED THE LIVE LOGIC INTO AN INNER PARSER COMPONENT
function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'all' | 'film' | 'artifact'>('all');
  const [rawResults, setRawResults] = useState<SearchItem[]>([]);
  const [filteredResults, setFilteredResults] = useState<SearchItem[]>([]);
  const [latestItems, setLatestItems] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function fetchLatest() {
      const currentIsoString = new Date().toISOString();
      const { data } = await supabase
        .from('search')
        .select('*')
        .lte('release_date', currentIsoString)
        .order('release_date', { ascending: false })
        .limit(5);
        
      if (data) setLatestItems(data as SearchItem[]);
    }
    fetchLatest();
    if (inputRef.current) inputRef.current.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setRawResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const delayDebounceFn = setTimeout(async () => {
      const { data, error } = await supabase
        .from('search')
        .select('*')
        .or(`name.ilike.%${query}%,teaser.ilike.%${query}%,search_content.ilike.%${query}%`);

      if (!error && data) {
        const cleanQuery = query.toLowerCase().trim();
        const rankedResults = (data as SearchItem[]).sort((a, b) => {
          let scoreA = 0;
          let scoreB = 0;
          const nameA = (a.name || '').toLowerCase();
          const nameB = (b.name || '').toLowerCase();
          const teaserA = (a.teaser || '').toLowerCase();
          const teaserB = (b.teaser || '').toLowerCase();
          const contentA = (a.search_content || '').toLowerCase();
          const contentB = (b.search_content || '').toLowerCase();

          if (nameA === cleanQuery) scoreA += 100;
          if (nameB === cleanQuery) scoreB += 100;
          if (nameA.startsWith(cleanQuery)) scoreA += 60;
          if (nameB.startsWith(cleanQuery)) scoreB += 60;
          if (nameA.includes(cleanQuery)) scoreA += 30;
          if (nameB.includes(cleanQuery)) scoreB += 30;
          if (teaserA.includes(cleanQuery)) scoreA += 15;
          if (teaserB.includes(cleanQuery)) scoreB += 15;
          if (contentA.includes(cleanQuery)) scoreA += 5;
          if (contentB.includes(cleanQuery)) scoreB += 5;

          if (scoreA === scoreB) {
            const timeA = a.release_date ? new Date(a.release_date).getTime() : 0;
            const timeB = b.release_date ? new Date(b.release_date).getTime() : 0;
            return timeB - timeA; 
          }
          return scoreB - scoreA;
        });

        setRawResults(rankedResults);
      } else {
        setRawResults([]);
      }
      setLoading(false);
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  useEffect(() => {
    if (activeTab === 'all') {
      setFilteredResults(rawResults);
    } else {
      setFilteredResults(rawResults.filter(item => item.item_type === activeTab));
    }
  }, [rawResults, activeTab]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    
    const params = new URLSearchParams(window.location.search);
    if (val.trim()) {
      params.set('q', val);
      setLoading(true);
    } else {
      params.delete('q');
      setLoading(false);
    }
    router.replace(`?${params.toString()}`);
  };

  const handleClearSearch = () => {
    setQuery('');
    setActiveTab('all');
    setLoading(false);
    const params = new URLSearchParams(window.location.search);
    params.delete('q');
    router.replace(`?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-4xl flex flex-col items-center gap-8">
      {/* Search Input field code block */}
      <div className="w-full max-w-sm relative group animate-in fade-in slide-in-from-top-3 duration-500 fill-mode-both [transform:translateZ(0)] [backface-visibility:hidden]">
        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none transition-colors group-focus-within:text-white/80">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search"
          className="w-full bg-white/5 rounded-[10px] h-14 pl-14 pr-12 font-sans font-medium text-[16px] text-white placeholder-white/30 focus:bg-white/10 focus:outline-none focus:ring-0 focus:ring-offset-0 transition-all duration-300 shadow-2xl"
        />
        {query && (
          <button 
            onClick={handleClearSearch} 
            className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Capsule filters display */}
      {query.trim().length > 0 && !loading && (
        <div className="flex items-center gap-1 select-none animate-in fade-in zoom-in-95 duration-200">
          <div className="pl-1 pr-1.5 text-white/30 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M15.6 2.7a10 10 0 1 0 5.7 5.7"/>
              <circle cx="12" cy="12" r="2"/>
              <path d="M13.4 10.6 19 5"/>
            </svg>
          </div>
          <button onClick={() => setActiveTab('all')} className={`font-sans font-semibold text-sm px-3.5 py-1.5 rounded-[6px] transition-all duration-200 cursor-pointer ${activeTab === 'all' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}>All</button>
          <button onClick={() => setActiveTab('film')} className={`font-sans font-semibold text-sm px-3.5 py-1.5 rounded-[6px] transition-all duration-200 cursor-pointer ${activeTab === 'film' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}>Films</button>
          <button onClick={() => setActiveTab('artifact')} className={`font-sans font-semibold text-sm px-3.5 py-1.5 rounded-[6px] transition-all duration-200 cursor-pointer ${activeTab === 'artifact' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}>Artifacts</button>
        </div>
      )}

      {/* Results Injector Row */}
      <div className="w-full mt-6 flex flex-col items-center">
        {loading ? (
          <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-10 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="flex flex-col gap-3">
                <div className="w-full aspect-[2/3] bg-white/5 rounded-[8px]" />
                <div className="h-4 bg-white/10 rounded w-2/3" />
                <div className="h-3 bg-white/5 rounded w-full" />
              </div>
            ))}
          </div>
        ) : !query.trim() ? (
          <SearchIdleView latestItems={latestItems} />
        ) : filteredResults.length > 0 ? (
          <SearchResultsGrid results={filteredResults} />
        ) : (
          <SearchNadaView />
        )}
      </div>
    </div>
  );
}

// 📦 2. EXPORT THE BASE ROOT WITH A SUSPENSE BARRIER
export default function SearchPage() {
  return (
    <div className="w-full min-h-screen pt-6 pb-24 px-[10%] flex flex-col items-center">
      {/* 🎯 NEXT.JS BUILD INSURANCE: Wraps parameters hook calls cleanly */}
      <Suspense fallback={<div className="text-white/20 font-sans text-sm mt-12 animate-pulse">Loading search platform...</div>}>
        <SearchContent />
      </Suspense>
    </div>
  );
}