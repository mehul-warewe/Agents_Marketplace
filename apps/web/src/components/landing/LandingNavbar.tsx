'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from 'next-themes';
import { Bot, Sun, Moon } from 'lucide-react';

export default function LandingNavbar() {
  const { user, isLoading, openAuthModal } = useAuthStore();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="fixed top-6 left-0 right-0 z-50 px-6 font-inter">
      <nav className="max-w-7xl mx-auto bg-card border border-border shadow-2xl rounded-[2rem] h-20 px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-2xl shadow-primary/20">
              <Bot size={24} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col hidden sm:flex">
                <span className="font-black text-lg tracking-tighter leading-none mb-1 text-foreground italic uppercase">warewe</span>
                <span className="text-[7px] font-black text-primary uppercase tracking-[0.3em] italic">Protocol_Root</span>
            </div>
          </Link>
        </div>
        
        <div className="hidden lg:flex items-center gap-8">
          <Link href="#features" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-primary transition-colors italic">Features</Link>
          <Link href="/marketplace" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-primary transition-colors italic">Marketplace</Link>
          <Link href="#pricing" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-primary transition-colors italic">Pricing</Link>
          <Link href="/docs" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-primary transition-colors italic">Docs</Link>
        </div>

        <div className="flex items-center gap-4">
          <button
             onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
             className="p-2 rounded-full hover:bg-muted/10 transition-colors text-muted"
             aria-label="Toggle theme"
          >
             {mounted ? (theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />) : <div className="w-5 h-5" />}
          </button>
          
          {isLoading ? (
             <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          ) : user ? (
            <Link href="/dashboard" className="bg-primary text-primary-foreground px-8 py-3 rounded-[1.25rem] font-black text-[10px] uppercase tracking-[0.2em] hover:scale-[1.05] transition-all shadow-2xl shadow-primary/20 italic">
              Dashboard
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <button 
                onClick={openAuthModal}
                className="hidden sm:block text-[10px] font-black text-muted hover:text-foreground transition-colors mr-6 uppercase tracking-[0.2em] italic"
              >
                Log_In
              </button>
              <button 
                onClick={openAuthModal}
                className="bg-primary text-primary-foreground px-8 py-3 rounded-[1.25rem] font-black text-[10px] uppercase tracking-[0.2em] hover:scale-[1.05] transition-all shadow-2xl shadow-primary/20 italic"
              >
                Get_Started
              </button>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}
