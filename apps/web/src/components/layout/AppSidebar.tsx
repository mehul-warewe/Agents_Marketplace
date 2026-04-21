'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/Button';
import {
  Home, ShoppingBag, Users, Bot, Zap, Link2, Sparkles,
  Moon, Sun, Settings, LogOut, ChevronUp
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard',     icon: Home,         href: '/dashboard' },
  { name: 'Managers',      icon: Users,        href: '/manager' },
  { name: 'Employees',     icon: Bot,          href: '/employees' },
  { name: 'Skills',        icon: Zap,          href: '/skills' },
  { name: 'Integrations',  icon: Link2,        href: '/connections' },
  { name: 'Marketplace',   icon: ShoppingBag,  href: '/marketplace' },
  { name: 'Build Skill',   icon: Sparkles,     href: '/skills/builder' },
];

interface AppSidebarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (val: boolean) => void;
  setIsSettingsOpen: (val: boolean) => void;
  setIsUpgradeOpen: (val: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}

export function AppSidebar({ 
  isMobileMenuOpen, setIsMobileMenuOpen, setIsSettingsOpen, setIsUpgradeOpen,
  isCollapsed, setIsCollapsed 
}: AppSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 border border-border/40 bg-card shadow-md flex flex-col transform transition-all duration-300 lg:translate-x-0 lg:relative lg:inset-auto lg:rounded-xl lg:h-full ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } ${isCollapsed ? 'w-20' : 'w-64'}`}
    >
      {/* Logo & Toggle */}
      <div className="flex items-center gap-3 px-5 h-14 shrink-0 relative">
        <div 
          className="size-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center shadow-lg cursor-pointer shrink-0"
          onClick={() => router.push('/dashboard')}
        >
          <Sparkles size={16} strokeWidth={2.5} />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
            <span className="font-bold text-base font-display tracking-tight leading-none truncate">WorkforceHub</span>
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 truncate">Digital Mesh</span>
          </div>
        )}
        
        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 size-5 bg-card border border-border shadow-sm rounded-full hidden lg:flex items-center justify-center text-muted-foreground hover:text-foreground transition-all z-10"
        >
          <ChevronUp className={`size-3 transition-transform duration-500 ${isCollapsed ? 'rotate-90' : '-rotate-90'}`} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 px-3 py-2 overflow-y-auto no-scrollbar">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-[11px] font-bold uppercase tracking-widest relative group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-muted-foreground hover:bg-muted font-bold hover:text-foreground'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                title={isCollapsed ? item.name : ''}
              >
                <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} className={`shrink-0 ${isActive ? 'text-white' : 'text-muted-foreground group-hover:text-indigo-500 transition-colors'}`} />
                {!isCollapsed && <span className="leading-none animate-in fade-in slide-in-from-left-2 duration-300">{item.name}</span>}
                {isCollapsed && isActive && <div className="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r-full" />}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Profile Area */}
      <div className={`p-4 border-t border-border shrink-0 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <div className="relative w-full flex justify-center">
           {showSettings && (
             <div className={`absolute bottom-[calc(100%+10px)] bg-card border border-border rounded-xl shadow-xl overflow-hidden z-[100] animate-in fade-in slide-in-from-bottom-2 duration-200 ${isCollapsed ? 'left-0 w-48' : 'left-0 right-0'}`}>
                 <div className="p-2 space-y-1">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-[11px] font-bold h-9 gap-3 uppercase tracking-wider"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  >
                     {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                     Toggle Theme
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-[11px] font-bold h-9 gap-3 text-indigo-500 uppercase tracking-wider"
                    onClick={() => setIsUpgradeOpen(true)}
                  >
                     <Zap size={14} /> Upgrade Tier
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-[11px] font-bold h-9 gap-3 uppercase tracking-wider"
                    onClick={() => setIsSettingsOpen(true)}
                  >
                     <Settings size={14} /> Settings
                  </Button>
                  <div className="h-px bg-border/40 my-2" />
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-[11px] font-bold h-9 gap-3 text-red-500 hover:text-red-600 hover:bg-red-500/10 uppercase tracking-wider"
                    onClick={() => {
                        logout();
                        router.push('/');
                    }}
                  >
                     <LogOut size={14} /> Sign Out
                  </Button>
                </div>
             </div>
           )}

           <button 
             onClick={() => setShowSettings(!showSettings)}
             className={`flex items-center gap-3 p-2 rounded-xl transition-all border outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20 ${isCollapsed ? 'w-10 h-10 justify-center' : 'w-full'} ${showSettings ? 'bg-muted border-border' : 'border-transparent hover:bg-muted'}`}
           >
              <div className="size-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                 {user?.name?.charAt(0).toUpperCase()}
              </div>
              {!isCollapsed && (
                <>
                  <div className="flex flex-col text-left min-w-0 flex-1 animate-in fade-in slide-in-from-left-2 duration-300">
                     <span className="text-xs font-bold truncate font-display">{user?.name || "Manager"}</span>
                     <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">{user?.tier || 'PRO'} Plan</span>
                  </div>
                  <ChevronUp size={14} className={`text-muted-foreground transition-transform duration-300 ${showSettings ? '' : 'rotate-180 opacity-50'}`} />
                </>
              )}
           </button>
        </div>
      </div>
    </aside>
  );
}
