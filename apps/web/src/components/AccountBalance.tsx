'use client';

import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { Wallet, Sparkles, ChevronRight, Zap } from 'lucide-react';
import Link from 'next/link';

export default function AccountBalance() {
  const { user } = useAuthStore();

  if (!user) return null;

  const tierGradients: any = {
    free: 'from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border-border',
    pro: 'from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-blue-500/20',
    ultra: 'from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 border-purple-500/20',
  };

  return (
    <div className="px-5 py-4">
      <div className={`p-6 rounded-[2rem] border-2 bg-gradient-to-br ${tierGradients[user.tier]} relative overflow-hidden group transition-all hover:shadow-xl hover:shadow-accent/5`}>
        <div className="relative z-10 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-white/10 shadow-inner">
                <Wallet size={16} className="text-accent" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Balance</span>
            </div>
            {user.tier === 'free' && (
               <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500/10 rounded-lg">
                  <span className="w-1 h-1 bg-yellow-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-yellow-600 dark:text-yellow-500 uppercase">Trial</span>
               </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-foreground leading-none">{user.credits.toLocaleString()}</span>
              <span className="text-[11px] font-bold text-muted uppercase tracking-widest leading-none">Credits</span>
            </div>
            <p className="text-[10px] text-muted font-medium mt-1">Available execution units</p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border/10 mt-2">
             <div className="flex items-center gap-2">
                <Sparkles size={12} className="text-accent" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/80">
                  {user.tier.toUpperCase()} PLAN
                </span>
             </div>
             <Link 
              href="/pricing"
              className="flex items-center gap-1.5 text-[10px] font-bold text-accent hover:opacity-80 transition-all bg-accent/5 px-3 py-1.5 rounded-xl border border-accent/10 group/btn"
            >
              Get More <ChevronRight size={12} className="group-hover/btn:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
