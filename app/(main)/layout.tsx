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
      // Pull the variable from the active DOM leaf element
      const dbColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--page-bg-color').trim();
      
      if (dbColor) {
        document.body.style.setProperty('background-color', dbColor, 'important');
      } else {
        document.body.style.setProperty('background-color', 'var(--page-bg-color)', 'important');
      }
    } else {
      // 🎯 THE CLEANUP: Completely wipes the dynamic color when you navigate anywhere else!
      document.body.style.removeProperty('background-color');
    }
  }, [pathname, isArtifactPage]);

  return (
    <div 
      style={isArtifactPage ? { backgroundColor: 'var(--page-bg-color)' } : undefined}
      className="relative flex flex-col min-h-screen justify-between transition-colors duration-500"
    >
      {!isWatchPage && <Navbar variant="light" />}
      
      <main className="flex-grow w-full flex flex-col">{children}</main>
      
      {!isWatchPage && <Footer variant="light" />}
    </div>
  );
}