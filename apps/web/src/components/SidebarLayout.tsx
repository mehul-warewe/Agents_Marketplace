'use client';

import React, { useState, useEffect } from 'react';
import { AppSidebar } from './layout/AppSidebar';
import { AppHeader } from './layout/AppHeader';
import SettingsModal from './modals/SettingsModal';
import UpgradeModal from './modals/UpgradeModal';
import { useUIStore } from '@/store/uiStore';
import { useConnectionStore } from '@/store/connectionStore';
import { cn } from '@/components/ui/utils';

interface SidebarLayoutProps {
  children: React.ReactNode;
  title?: string;
  noScroll?: boolean;
}

export default function SidebarLayout({ children, title, noScroll }: SidebarLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { fetchConnections, initialized } = useConnectionStore();

  useEffect(() => {
    if (!initialized) {
      fetchConnections();
    }
    
    // Global listener for refreshes
    const handleRefresh = () => fetchConnections();
    window.addEventListener('warewe:refresh-connections', handleRefresh);
    return () => window.removeEventListener('warewe:refresh-connections', handleRefresh);
  }, [initialized, fetchConnections]);

  return (
    <div className="flex h-screen bg-background p-1.5 sm:p-2 gap-2 text-foreground overflow-hidden font-['Inter']">
      
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/80 z-40 lg:hidden backdrop-blur-sm animate-in fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ── Extracted Modular Sidebar (Island 1) ──────── */}
      <AppSidebar 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        setIsUpgradeOpen={setIsUpgradeOpen}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={toggleSidebar}
      />

      {/* ── Right Side Panel Column ─────────────────── */}
      <div className="flex-1 flex flex-col gap-2 overflow-hidden min-w-0">
        
        {/* ── Extracted Modular Header (Island 2) ─────── */}
        <AppHeader title={title} setIsMobileMenuOpen={setIsMobileMenuOpen} />

        {/* ── Main Dashboard Viewport (Island 3) ──────── */}
        <main className="flex-1 bg-secondary border border-border/60 shadow-sm rounded-xl overflow-hidden flex flex-col relative z-0">
           <div className={cn("flex-1 relative", !noScroll && "overflow-y-auto no-scrollbar")}>
              <div className={cn(!noScroll && "min-h-full")}>
                 {children}
              </div>
           </div>
        </main>
      </div>

      {/* Utilities */}
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
