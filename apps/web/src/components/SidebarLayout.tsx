'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from 'next-themes';
import {
  Home, ShoppingBag, PlusCircle, LogOut,
  User as UserIcon, Bot, Share2, Terminal,
  Moon, Sun, Monitor, ChevronUp, Settings,
  Menu, X, Sparkles, LayoutGrid, Layers, Link2, Bell, ChevronRight, User, Users, Mail, ArrowRight, ShieldCheck, Zap
} from 'lucide-react';
import SettingsModal from './modals/SettingsModal';
import UpgradeModal from './modals/UpgradeModal';


interface SidebarLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const navItems = [
  { name: 'Dashboard',     icon: Home,         href: '/dashboard' },
  { name: 'Managers',      icon: Users,        href: '/manager' },
  { name: 'Employees',     icon: Bot,          href: '/employees' },
  { name: 'Skills',        icon: Zap,          href: '/skills' },
  { name: 'Integrations',  icon: Link2,        href: '/connections' },
  { name: 'Marketplace',   icon: ShoppingBag,  href: '/marketplace' },
  { name: 'Build Skill',   icon: Sparkles,     href: '/skills/builder' },
];

function ThemeIcon({ theme }: { theme: string | undefined }) {
  if (theme === 'dark')   return <Moon size={16} />;
  if (theme === 'light')  return <Sun size={16} />;
  return <Monitor size={16} />;
}

export default function SidebarLayout({ children, title }: SidebarLayoutProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-inter">
      
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ── Sidebar ────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-border flex flex-col bg-sidebar transform transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] lg:translate-x-0 lg:static lg:inset-auto ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Section */}
        <div
          className="flex items-center gap-4 px-10 h-24 cursor-pointer shrink-0"
          onClick={() => router.push('/dashboard')}
        >
          <div className="w-12 h-12 bg-foreground text-background rounded-2xl flex items-center justify-center shadow-2xl shadow-foreground/10">
            <Sparkles size={24} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-black text-2xl tracking-tighter leading-none mb-1 text-foreground italic uppercase">Agent Hub</span>
            <span className="text-[9px] font-black text-primary uppercase tracking-[0.4em] italic">Workspace</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1 px-4 py-8 overflow-y-auto no-scrollbar">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-4 px-6 py-3 rounded-xl transition-all duration-500 group relative overflow-hidden ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-2xl shadow-primary/20 translate-x-1'
                      : 'text-muted hover:bg-foreground/5 hover:text-foreground'
                  }`}
                >
                  <item.icon size={18} strokeWidth={3} className={isActive ? 'text-primary-foreground' : 'text-muted group-hover:text-foreground transition-colors'} />
                  <span className="text-xs font-black uppercase tracking-widest">{item.name}</span>
                  {isActive && (
                    <div className="absolute right-4 w-1.5 h-1.5 bg-primary-foreground rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>



        {/* User Profile Area */}
        <div className="p-8 border-t border-border/40 shrink-0">
          <div className="relative">
             {showSettings && (
               <div className="absolute bottom-[calc(100%+20px)] left-0 right-0 bg-card border border-border/80 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden animate-fade-in-up z-[100] backdrop-blur-3xl">
                   <div className="p-4 space-y-1">
                    <button 
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className="w-full flex items-center justify-between px-6 py-4 hover:bg-foreground/5 rounded-2xl transition-all group"
                    >
                       <div className="flex items-center gap-4 text-xs font-black text-muted group-hover:text-foreground uppercase tracking-widest italic">
                          {theme === 'dark' ? <Sun size={16} strokeWidth={3} /> : <Moon size={16} strokeWidth={3} />}
                          Theme Selection
                       </div>
                       <span className="text-[9px] font-black text-foreground px-3 py-1 bg-foreground/10 rounded-lg uppercase tracking-tight">
                          {theme}
                       </span>
                    </button>
                    <button 
                      onClick={() => setIsUpgradeOpen(true)}
                      className="w-full flex items-center gap-4 px-6 py-4 hover:bg-primary/10 rounded-2xl transition-all text-xs font-black text-primary italic uppercase tracking-widest"
                    >
                       <Zap size={16} strokeWidth={3} fill="currentColor" />
                       Upgrade Tier
                    </button>
                    <button 
                      onClick={() => setIsSettingsOpen(true)}
                      className="w-full flex items-center gap-4 px-6 py-4 hover:bg-foreground/5 rounded-2xl transition-all text-xs font-black text-muted hover:text-foreground italic uppercase tracking-widest"
                    >
                       <Settings size={16} strokeWidth={3} />
                       Terminal Config
                    </button>
                    <div className="h-px bg-border/40 my-3 mx-2" />
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-4 px-6 py-4 hover:bg-red-500/10 rounded-2xl transition-all text-xs font-black text-red-500 italic uppercase tracking-widest"
                    >
                       <LogOut size={16} strokeWidth={3} />
                       Signal_Off
                    </button>
                  </div>
               </div>
             )}

             <button 
               onClick={() => setShowSettings(!showSettings)}
               className={`w-full flex items-center gap-4 p-4 rounded-[2rem] transition-all border-2 ${showSettings ? 'bg-foreground/5 border-foreground/10 shadow-inner scale-[0.98]' : 'hover:bg-foreground/5 border-transparent shadow-soft'}`}
             >
                <div className="relative">
                   <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-black text-sm border border-primary/20 shadow-xl shadow-primary/20 group-hover:scale-105 transition-transform">
                      {user?.name?.charAt(0).toUpperCase()}
                   </div>
                   <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full border-4 border-sidebar shadow-sm" />
                </div>
                <div className="flex flex-col text-left min-w-0 flex-1">
                   <span className="text-[11px] font-black truncate uppercase tracking-tighter leading-none mb-1.5">{user?.name}</span>
                   <span className="text-[8px] font-black text-muted uppercase tracking-[0.3em] opacity-40 italic">{user?.tier}_ACCESS</span>
                </div>
                <ChevronUp size={14} strokeWidth={3} className={`text-muted transition-transform duration-500 ${showSettings ? '' : 'rotate-180 opacity-40'}`} />
             </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ─────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background">
        
        {/* Universal Header Bar */}
        <header className="h-24 border-b border-border/40 bg-background/80 backdrop-blur-2xl flex items-center justify-between px-10 shrink-0 py-2 sticky top-0 z-[40]">
           <div className="flex lg:hidden items-center gap-6">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-4 bg-foreground/5 rounded-2xl text-foreground hover:bg-foreground hover:text-background transition-all shadow-xl"
                aria-label="Open menu"
              >
                <Menu size={22} strokeWidth={3} />
              </button>
              <div className="w-10 h-10 bg-foreground text-background rounded-xl flex items-center justify-center">
                 <Sparkles size={18} strokeWidth={3} />
              </div>
           </div>

            <div className="hidden lg:flex items-center gap-5 text-[10px] font-black uppercase tracking-[0.5em] opacity-30 italic">
              <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center">
                 <Home size={14} strokeWidth={3} />
              </div>
              <ChevronRight size={12} strokeWidth={3} className="text-muted/30" />
              <span className="text-foreground md:max-w-[400px] truncate tracking-[0.2em] font-black not-italic opacity-100">
                {title || 'Dashboard'}
              </span>
            </div>

            <div className="flex items-center gap-10">
                <div className="flex items-center gap-6">
                   <div className="hidden sm:flex items-center gap-4 px-8 py-3 rounded-2xl bg-foreground/[0.03] border border-border/40 shadow-xl shadow-foreground/5 transition-all hover:bg-foreground/[0.05] hover:border-primary/20 group">
                      <span className="text-[9px] font-black text-muted uppercase tracking-[0.4em] opacity-40 italic group-hover:text-primary transition-colors">Credits_Fuel</span>
                      <div className="w-px h-4 bg-border/40" />
                      <span className="text-base font-black italic tracking-tighter text-foreground group-hover:text-primary transition-colors">{user?.credits?.toLocaleString() || 0}</span>
                   </div>
                   <div className="hidden sm:block">
                      <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-black text-sm shadow-2xl shadow-primary/30 border border-primary/20 hover:scale-110 active:scale-95 transition-all cursor-pointer">
                         {user?.name?.charAt(0).toUpperCase()}
                      </div>
                   </div>
                </div>
             </div>
        </header>

        {/* Content Viewport */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-background">
           <div className="min-h-full">
              {children}
           </div>
        </div>
      </main>
      {/* Modals */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onUpgrade={() => {
          setIsSettingsOpen(false);
          setIsUpgradeOpen(true);
        }}
      />
      
      <UpgradeModal 
        isOpen={isUpgradeOpen} 
        onClose={() => setIsUpgradeOpen(false)} 
      />
    </div>
  );
}
