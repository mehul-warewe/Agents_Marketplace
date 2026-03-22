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
    <div ref={container} className="flex flex-col min-h-screen bg-background text-foreground font-inter">
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
