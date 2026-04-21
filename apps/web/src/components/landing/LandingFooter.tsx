'use client';

import React from 'react';
import Link from 'next/link';
import { Bot } from 'lucide-react';

export default function LandingFooter() {
  return (
    <footer className="py-32 px-6 bg-card border-t border-border/40 relative overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 relative z-10">
        <div className="col-span-1 md:col-span-2 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-xl">
              <Bot size={22} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl tracking-tight font-display">WorkforceHub</span>
          </div>
          <p className="text-muted-foreground font-medium leading-relaxed max-w-sm">
            Professional AI orchestration for high-performance teams. Build, deploy, and scale your digital workforce with a visual-first workspace.
          </p>
        </div>
        <div className="space-y-8">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground">Platform</h4>
          <ul className="space-y-4 text-sm font-medium text-muted-foreground">
            <li><Link href="#features" className="hover:text-primary transition-colors">Features</Link></li>
            <li><Link href="/marketplace" className="hover:text-primary transition-colors">Marketplace</Link></li>
            <li><Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
          </ul>
        </div>
        <div className="space-y-8">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground">Company</h4>
          <ul className="space-y-4 text-sm font-medium text-muted-foreground">
            <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link></li>
            <li><Link href="/terms" className="hover:text-primary transition-colors">Terms</Link></li>
            <li><Link href="mailto:hello@agentshub.ai" className="hover:text-primary transition-colors">Contact</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto pt-16 mt-16 border-t border-border/40 flex flex-col sm:flex-row justify-between items-center gap-8 text-xs font-medium text-muted-foreground/60">
         <p>© 2026 WorkforceHub. All rights reserved.</p>
         <div className="flex items-center gap-8">
            <Link href="#" className="hover:text-primary transition-colors">𝕏 Twitter</Link>
            <Link href="#" className="hover:text-primary transition-colors">GitHub</Link>
         </div>
      </div>
    </footer>
  );
}
