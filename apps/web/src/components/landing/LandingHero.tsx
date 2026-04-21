'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function LandingHero() {
  const router = useRouter();
  const { openAuthModal } = useAuthStore();

  return (
    <section className="relative pt-48 pb-32 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-12 relative z-10">
        
        {/* Release Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border/40 rounded-full shadow-sm animate-fade-in">
           <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
           <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Version 2.0 Now Available</span>
        </div>

        <div className="space-y-6 max-w-4xl">
          <h1 className="text-6xl md:text-8xl font-bold font-display tracking-tight text-foreground leading-[1.05]">
            Build your <br />
            <span className="text-primary italic">Autonomous Workforce</span>
          </h1>
          <p className="text-xl text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto">
            Deploy specialized AI professionals designed to orchestrate complex projects <br className="hidden md:block" /> and automate high-value workflows at scale.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 pt-4 w-full justify-center">
          <button 
            onClick={openAuthModal}
            className="bg-primary text-primary-foreground px-12 py-5 rounded-2xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all w-full sm:w-auto shadow-2xl shadow-primary/10"
          >
            Start Building
          </button>
          <Link 
            href="/marketplace" 
            className="bg-secondary text-foreground px-12 py-5 rounded-2xl font-bold text-xs uppercase tracking-widest border border-border/40 hover:bg-muted transition-all w-full sm:w-auto flex items-center justify-center gap-2"
          >
            Explore Hub
          </Link>
        </div>

        {/* App Preview Frame */}
        <div className="relative pt-20 w-full max-w-6xl group">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[100px] rounded-full group-hover:bg-primary/20 transition-all duration-1000" />
          <div className="bg-card rounded-[2.5rem] border border-border shadow-2xl p-3 overflow-hidden relative z-10">
            <div className="bg-secondary/50 rounded-[1.75rem] border border-border/40 overflow-hidden relative aspect-[16/9]">
              <img 
                 src="/images/landing.png" 
                 alt="WorkforceHub Workspace" 
                 className="w-full h-full object-cover rounded-[1.75rem] shadow-inner"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
