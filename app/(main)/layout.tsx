'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function LayoutClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const isWatchPage = pathname.startsWith('/watch');
  const isArtifactPage = pathname.startsWith('/artifact/');

  useEffect(() => {
    if (isArtifactPage) {
      const dbColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--page-bg-color').trim();
      
      if (dbColor) {
        document.body.style.setProperty('background-color', dbColor, 'important');
      } else {
        document.body.style.setProperty('background-color', 'var(--page-bg-color)', 'important');
      }
    } else {
      document.body.style.removeProperty('background-color');
    }
  }, [pathname, isArtifactPage]);

  return (
    <div 
      style={isArtifactPage ? { 
        backgroundColor: 'var(--page-bg-color)',
        transition: 'background-color 500ms cubic-bezier(0.25, 1, 0.5, 1)'
      } : undefined}
      className="relative flex flex-col min-h-screen justify-between bg-[#1F1F1F]"
    >
      {!isWatchPage && <Navbar variant="light" />}
      
      <main className="flex-grow w-full relative">
        {children}
      </main>
      
      {!isWatchPage && <Footer variant="light" />}
    </div>
  );
}
