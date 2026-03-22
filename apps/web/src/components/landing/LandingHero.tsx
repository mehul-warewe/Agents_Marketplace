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
    <section className="relative pt-48 pb-24 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Build and Deploy <br />
            <span className="text-primary italic uppercase tracking-tighter">Autonomous AI Agents</span>
          </h1>
          <p className="text-xl text-muted leading-relaxed max-w-lg">
            Create autonomous agents to automate your workflows and tasks with powerful AI tools.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <button 
              onClick={openAuthModal}
              className="bg-primary text-primary-foreground px-10 py-5 rounded-[1.75rem] font-black text-xs uppercase tracking-[0.3em] hover:scale-[1.05] transition-all w-full sm:w-auto shadow-2xl shadow-primary/20 italic"
            >
              Start Building Agents
            </button>
            <Link 
              href="/marketplace" 
              className="bg-card text-foreground px-10 py-5 rounded-[1.75rem] font-black text-xs uppercase tracking-[0.3em] border border-border/60 hover:bg-muted/5 transition-all w-full sm:w-auto flex items-center justify-center gap-2 italic"
            >
              Explore Marketplace
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="bg-card rounded-3xl border border-border shadow-2xl p-4 overflow-hidden">
            <img 
               src="/images/landing.png" 
               alt="App Preview" 
               className="w-full rounded-2xl shadow-inner border border-border/50"
               style={{ objectFit: 'cover' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
