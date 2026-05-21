'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function LayoutClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const isWatchPage = pathname.startsWith('/watch');
  const isArtifactPage = pathname.startsWith('/artifact/');

  // 🎯 ROUTE GUARD: Safely maps the body layer background without causing global bleeding leaks
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
    /* 🛠️ FIXED MAIN STRUCTURAL ROOT:
       Removed 'transition-colors duration-500'. Forcing a global multi-element transition on a root 
       layout container creates calculation lag that causes sticky/fixed components to miscalculate layout heights on boot.
    */
    <div 
      style={isArtifactPage ? { 
        backgroundColor: 'var(--page-bg-color)',
        transition: 'background-color 500ms cubic-bezier(0.25, 1, 0.5, 1)' // Isolated fade safely restricted away from navbar variables
      } : undefined}
      className="relative flex flex-col min-h-screen justify-between bg-[#1F1F1F]"
    >
      {/* Navbar sits safely fixed here over the main panel frame */}
      {!isWatchPage && <Navbar variant="light" />}
      
      <main className="flex-grow w-full relative">
        {children}
      </main>
      
      {!isWatchPage && <Footer variant="light" />}
    </div>
  );
}