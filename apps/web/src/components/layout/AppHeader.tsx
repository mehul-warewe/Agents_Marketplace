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
    <header className="sticky top-0 h-12 bg-card border border-border shadow-sm rounded-none flex items-center justify-between px-4 shrink-0 z-[40] w-full">
      <div className="flex lg:hidden items-center gap-4">
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-1.5 -ml-1 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all outline-none"
        >
          <Menu size={18} strokeWidth={2.5} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <h1 className="text-foreground tracking-tight font-display font-bold text-sm md:text-base">
          {title || 'Dashboard'}
        </h1>
      </div>

      <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-secondary/50 border border-border/40">
             <span className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest">Credits</span>
             <span className="text-[11px] font-black tracking-tight text-foreground">{user?.credits?.toLocaleString() || 0}</span>
          </div>
          
          <div className="size-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-lg shadow-indigo-500/20 cursor-pointer hover:scale-105 transition-all border border-border shrink-0">
             {user?.name?.charAt(0).toUpperCase()}
          </div>
       </div>
    </header>
  );
}
