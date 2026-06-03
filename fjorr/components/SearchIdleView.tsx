'use client';

import React from 'react';
import Link from 'next/link';

interface SearchItem {
  id: string;
  internal_id: string;
  item_type: 'film' | 'artifact';
  slug: string;
  name: string;
  release_date: string;
}

interface IdleViewProps {
  latestItems: SearchItem[];
}

export default function SearchIdleView({ latestItems }: IdleViewProps) {
  const publishedItems = latestItems.filter((item) => {
    if (!item.release_date) return true;
    
    const isFutureRelease = new Date(item.release_date).getTime() > Date.now();
    return !(item.item_type === 'film' && isFutureRelease);
  });

  return (
    <div className="w-full max-w-sm text-left flex flex-col gap-0">
      
      {/* 🎯 HEADER LABEL */}
      <h3 className="font-sans capitalize tracking-normal text-1xl font-bold text-white/50 pb-2 px-4 animate-in fade-in slide-in-from-top-1 duration-300 fill-mode-both">
        Latest Releases
      </h3>
      
      <div className="flex flex-col division-list">
        {publishedItems.map((item, index) => {
          // 🎯 STAGGER WAVE CALCULATOR: Each item unfolds 60ms after the one above it
          const cascadeDelay = `${index * 60}ms`;

          return (
            <Link
              key={item.id}
              href={item.item_type === 'film' ? `/film/${item.slug}` : `/artifact/${item.slug}`}
              className="flex items-center justify-between py-2 hover:bg-white/5 px-4 rounded-[6px] transition-all duration-200 group cursor-pointer animate-in fade-in slide-in-from-top-2 duration-500 fill-mode-both"
              style={{
                animationDelay: cascadeDelay,
              }}
            >
              <span className="font-sans font-bold text-[15px] text-white group-hover:text-white/80 transition-colors">
                {item.name}
              </span>
              
              <span className="font-mono font-medium text-[13px] text-white/50 group-hover:text-white/50 transition-colors">
                {item.item_type === 'film' ? '1m' : 'Artifact'}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}