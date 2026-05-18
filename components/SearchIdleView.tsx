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
  return (
    <div className="w-full max-w-sm text-left flex flex-col gap-4">
      <h3 className="font-tradeGothic uppercase tracking-widest text-[11px] font-bold text-white/30 border-b border-white/5 pb-2">
        Latest Release Node Logs
      </h3>
      <div className="flex flex-col division-list">
        {latestItems.map((item) => (
          <Link
            key={item.id}
            href={item.item_type === 'film' ? `/film/${item.internal_id}` : `/artifact/${item.slug}`}
            className="flex items-center justify-between py-3 border-b border-white/5 hover:bg-white/5 px-2 rounded-[6px] transition-all duration-200 group"
          >
            <span className="font-sans font-bold text-[15px] text-white group-hover:text-white/80 transition-colors">
              {item.name}
            </span>
            <span className="font-mono text-[12px] text-white/30 group-hover:text-white/50 transition-colors">
              {item.item_type === 'film' ? '1m' : 'Record'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}