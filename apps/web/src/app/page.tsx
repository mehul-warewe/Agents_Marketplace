'use client';

import React, { useRef } from 'react';
import LandingNavbar from '@/components/landing/LandingNavbar';
import LandingHero from '@/components/landing/LandingHero';
import LandingFeatures from '@/components/landing/LandingFeatures';
import LandingVisualBuilder from '@/components/landing/LandingVisualBuilder';
import LandingMarketplace from '@/components/landing/LandingMarketplace';
import LandingPricing from '@/components/landing/LandingPricing';
import LandingFooter from '@/components/landing/LandingFooter';

export default function Home() {
  const container = useRef<HTMLDivElement>(null);

  return (
    <div ref={container} className="flex flex-col min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Visual background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--border)_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.4]" />
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/5 blur-[120px] rounded-full" />
      </div>
      
      <LandingNavbar />
      
      <main className="flex-1">
        <LandingHero />
        <LandingFeatures />
        <LandingVisualBuilder />
        <LandingMarketplace />
        <LandingPricing />
      </main>

      <LandingFooter />
    </div>
  );
}
