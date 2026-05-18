'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';

// 🎯 CLEAN IMPORTS
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
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
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
      const { data } = await supabase
        .from('search')
        .select('*')
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
      setLoading(false); // 🎯 Clean up loading state if query gets cleared
      return;
    }

    // 🎯 THE CRITICAL FIX: Set loading to true IMMEDIATELY on keystroke!
    // This instantly overrides the view conditional board before the debounce timer begins.
    setLoading(true);

    const delayDebounceFn = setTimeout(async () => {
      const { data, error } = await supabase
        .from('search')
        .select('*')
        .or(`name.ilike.%${query}%,teaser.ilike.%${query}%,search_content.ilike.%${query}%`)
        .order('release_date', { ascending: false });

      if (!error && data) {
        setRawResults(data as SearchItem[]);
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

  return (
    <div className="w-full min-h-screen pt-6 pb-24 px-[10%] flex flex-col items-center">
      <div className="w-full max-w-4xl flex flex-col items-center gap-8">
        
        {/* INPUT INPUT ELEMENT BOX CONTAINER */}
        <div className="w-full max-w-sm relative group">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none transition-colors group-focus-within:text-white/80">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="w-full bg-white/5 rounded-[10px] h-14 pl-14 pr-12 font-sans font-medium text-[16px] text-white placeholder-white/30 border border-white/5 focus:border-white/10 focus:bg-white/10 focus:outline-none transition-all duration-300 shadow-2xl"
          />
          {query && (
            <button onClick={() => { setQuery(''); setActiveTab('all'); }} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* TABS FILTER LAYER BAR */}
        {query.trim().length > 0 && !loading && (
          <div className="flex items-center gap-6 font-tradeGothic uppercase tracking-wider text-xs font-bold">
            <button onClick={() => setActiveTab('all')} className={`pb-1 transition-colors relative ${activeTab === 'all' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}>
              All {activeTab === 'all' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-white rounded-full" />}
            </button>
            <button onClick={() => setActiveTab('film')} className={`pb-1 transition-colors relative ${activeTab === 'film' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}>
              Films {activeTab === 'film' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-white rounded-full" />}
            </button>
            <button onClick={() => setActiveTab('artifact')} className={`pb-1 transition-colors relative ${activeTab === 'artifact' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}>
              Artifacts {activeTab === 'artifact' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-white rounded-full" />}
            </button>
          </div>
        )}

        {/* DYNAMIC COMPONENT INJECTOR ROUTER BOARD */}
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
    </div>
  );
}