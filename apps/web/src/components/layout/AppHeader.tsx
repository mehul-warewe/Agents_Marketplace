'use client';

import React from 'react';
import { Menu, Sparkles, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface AppHeaderProps {
  title?: string;
  setIsMobileMenuOpen: (val: boolean) => void;
}

export function AppHeader({ title, setIsMobileMenuOpen }: AppHeaderProps) {
  const { user } = useAuthStore();

  return (
    <header className="sticky top-0 h-16 bg-card border border-border/60 shadow-sm rounded-xl flex items-center justify-between px-6 shrink-0 z-[40] w-full">
      <div className="flex lg:hidden items-center gap-4">
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all outline-none"
        >
          <Menu size={20} strokeWidth={2.5} />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <h1 className="text-foreground tracking-tight font-display font-bold text-lg md:text-xl">
          {title || 'Dashboard'}
        </h1>
      </div>

      <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/40">
             <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Credits</span>
             <span className="text-sm font-bold tracking-tight text-foreground">{user?.credits?.toLocaleString() || 0}</span>
          </div>
          
          <div className="size-9 rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center font-bold text-sm shadow-lg shadow-primary/20 cursor-pointer hover:scale-105 active:scale-95 transition-all border border-white/10">
             {user?.name?.charAt(0).toUpperCase()}
          </div>
       </div>
    </header>
  );
}
