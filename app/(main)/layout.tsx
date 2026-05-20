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
    <div 
      style={isArtifactPage ? { backgroundColor: 'var(--page-bg-color)' } : undefined}
      className="relative flex flex-col min-h-screen justify-between transition-colors duration-500 bg-[#1F1F1F]"
    >
      {/* Navbar sits safely fixed here over the main panel frame */}
      {!isWatchPage && <Navbar variant="light" />}
      
      {/* 🎯 THE CENTERING ENGINE: 
          Added 'justify-center items-center' so short pages center perfectly out of the box 
          without needing manual tracking values or calculations.
      */}
      <main className="flex-grow w-full flex flex-col justify-center items-center relative">
        {children}
      </main>
      
      {!isWatchPage && <Footer variant="light" />}
    </div>
  );
}