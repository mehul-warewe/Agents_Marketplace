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
    <div className="fixed top-6 left-0 right-0 z-50 px-6 font-display">
      <nav className="max-w-7xl mx-auto bg-card border border-border shadow-2xl rounded-[2rem] h-20 px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-2xl shadow-primary/20">
              <Bot size={24} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col hidden sm:flex pt-1.5">
                <span className="font-bold text-[15px] font-display tracking-tight leading-none text-foreground">WorkforceHub</span>
                <span className="text-[9px] font-bold text-primary uppercase tracking-widest mt-0.5 opacity-60">Digital Workforce Mesh</span>
            </div>
          </Link>
        </div>
        
        <div className="hidden lg:flex items-center gap-10">
          <Link href="#features" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Features</Link>
          <Link href="/marketplace" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Marketplace</Link>
          <Link href="#pricing" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
          <Link href="/docs" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Docs</Link>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-secondary transition-colors text-muted-foreground"
            aria-label="Toggle theme"
          >
             {mounted ? (theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />) : <div className="w-5 h-5" />}
          </button>
          
          {isLoading ? (
             <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          ) : user ? (
            <Link href="/dashboard" className="bg-primary text-primary-foreground px-8 py-3.5 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-primary/10">
              Dashboard
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <button 
                onClick={openAuthModal}
                className="hidden sm:block text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors mr-10 uppercase tracking-widest"
              >
                Log In
              </button>
              <button 
                onClick={openAuthModal}
                className="bg-primary text-primary-foreground px-8 py-3.5 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-primary/10"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}
