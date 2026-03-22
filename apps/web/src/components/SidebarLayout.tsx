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
  Menu, X, Sparkles, LayoutGrid, Layers, Link2, Bell, ChevronRight, User, Mail, ArrowRight, ShieldCheck, Zap
} from 'lucide-react';
import SettingsModal from './modals/SettingsModal';
import UpgradeModal from './modals/UpgradeModal';


interface SidebarLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const navItems = [
  { name: 'Dashboard',   icon: Home,       href: '/dashboard' },
  { name: 'Agents',      icon: Bot,        href: '/agents' },
  { name: 'Workflows',   icon: Share2,     href: '/workflows' },
  { name: 'Connections', icon: Link2,      href: '/connections' },
  { name: 'Tools',       icon: Terminal,   href: '/tools' },
  { name: 'Templates',   icon: LayoutGrid, href: '/templates' },
  { name: 'Marketplace', icon: ShoppingBag, href: '/marketplace' },
  { name: 'Builder',     icon: PlusCircle, href: '/builder' },
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
          className="flex items-center gap-4 px-10 h-20 cursor-pointer shrink-0"
          onClick={() => router.push('/dashboard')}
        >
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-2xl shadow-primary/20">
            <Bot size={22} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-black text-xl tracking-tighter leading-none mb-1 text-foreground italic">warewe</span>
            <span className="text-[9px] font-black text-primary uppercase tracking-[0.3em] italic">PROTOCOL_ROOT</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1 px-4 py-8 overflow-y-auto no-scrollbar">
          <p className="px-6 text-[9px] font-black text-muted uppercase tracking-[0.4em] mb-4 opacity-30 italic">Subsystems_Ready</p>
          
          <div className="space-y-1 mb-12">
            {navItems.slice(0, 6).map((item) => {
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

          <p className="px-6 text-[9px] font-black text-muted uppercase tracking-[0.4em] mb-4 opacity-30 italic">Logic_Architect</p>
          
          <div className="space-y-1">
            {navItems.slice(6).map((item) => {
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
        <div className="p-6 border-t border-border shrink-0">
          <div className="relative">
             {showSettings && (
               <div className="absolute bottom-[calc(100%+16px)] left-0 right-0 bg-card border border-border rounded-[2rem] shadow-2xl overflow-hidden animate-fade-in-up">
                   <div className="p-3 space-y-1">
                    <button 
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-foreground/5 rounded-2xl transition-all group"
                    >
                       <div className="flex items-center gap-3 text-sm font-bold text-muted group-hover:text-foreground">
                          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                          Theme Mode
                       </div>
                       <span className="text-[10px] font-bold text-foreground px-2 py-0.5 bg-foreground/10 rounded-lg uppercase">
                          {theme}
                       </span>
                    </button>
                    <button 
                      onClick={() => setIsUpgradeOpen(true)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-primary/10 rounded-2xl transition-all text-sm font-bold text-primary italic"
                    >
                       <Zap size={18} strokeWidth={3} />
                       Upgrade Protocol
                    </button>
                    <button 
                      onClick={() => setIsSettingsOpen(true)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-foreground/5 rounded-2xl transition-all text-sm font-bold text-muted hover:text-foreground italic"
                    >
                       <Settings size={18} />
                       Core Settings
                    </button>
                    <div className="h-px bg-border my-2 mx-2" />
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-500/10 rounded-2xl transition-all text-sm font-bold text-red-500 italic"
                    >
                       <LogOut size={18} />
                       Sign Out
                    </button>
                  </div>
               </div>
             )}

             <button 
               onClick={() => setShowSettings(!showSettings)}
               className={`w-full flex items-center gap-4 p-3 rounded-[1.5rem] transition-all border-2 ${showSettings ? 'bg-foreground/5 border-foreground/10 shadow-inner' : 'hover:bg-foreground/5 border-transparent'}`}
             >
                <div className="relative">
                   <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black text-xs border border-primary/20 shadow-xl shadow-primary/10">
                      {user?.name?.charAt(0).toUpperCase()}
                   </div>
                   <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full border-4 border-background shadow-sm" />
                </div>
                <div className="flex flex-col text-left min-w-0 flex-1">
                   <span className="text-xs font-black truncate uppercase tracking-tighter">{user?.name}</span>
                   <span className="text-[9px] font-black text-muted uppercase tracking-[0.2em] opacity-40 italic">{user?.tier}_ENTITY</span>
                </div>
                <ChevronUp size={16} strokeWidth={3} className={`text-muted transition-transform duration-500 ${showSettings ? '' : 'rotate-180'}`} />
             </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ─────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background">
        
        {/* Universal Header Bar */}
        <header className="h-20 border-b border-border/60 bg-background flex items-center justify-between px-10 shrink-0 py-2">
           <div className="flex lg:hidden items-center gap-4">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-3 bg-foreground/5 rounded-2xl text-foreground hover:bg-foreground hover:text-background transition-all"
                aria-label="Open menu"
              >
                <Menu size={20} strokeWidth={3} />
              </button>
              <Bot className="text-foreground" size={28} strokeWidth={3} />
           </div>

           <div className="hidden lg:flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] opacity-40 italic">
              <Home size={16} strokeWidth={3} />
              <ChevronRight size={14} strokeWidth={3} className="text-muted/30" />
              <span className="text-foreground md:max-w-[400px] truncate">
                {title?.toUpperCase().replace(/\s+/g, '_') || 'DASHBOARD_ROOT'}
              </span>
           </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-4">
                   <div className="hidden sm:flex items-center gap-3 px-6 py-2 rounded-xl bg-foreground/[0.03] border border-border/40 shadow-xl shadow-foreground/5 transition-all hover:bg-foreground/[0.05]">
                      <span className="text-[9px] font-black text-muted uppercase tracking-[0.3em] opacity-40 italic">Credits::</span>
                      <span className="text-sm font-black italic tracking-tighter text-primary">{user?.credits?.toLocaleString() || 0}_CR</span>
                   </div>
                   <div className="hidden sm:block">
                      <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black text-xs shadow-2xl shadow-primary/20 border border-primary/10">
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
