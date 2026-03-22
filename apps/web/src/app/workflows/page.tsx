'use client';

import React from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { useMyAgents } from '@/hooks/useApi';
import { Share2, Plus, Zap, Activity, ChevronRight, Layers, LayoutGrid, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function WorkflowsPage() {
  const { data: agents, isLoading } = useMyAgents();
  const router = useRouter();

  return (
    <SidebarLayout title="Grid Orchestration">
      <div className="p-6 sm:p-10 lg:p-14 max-w-7xl mx-auto space-y-12 font-inter">
        
        {/* Page Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-12 py-8 px-4 border-b border-border/60 pb-12">
          <div className="space-y-4">
            <h1 className="text-5xl font-black tracking-tighter text-foreground leading-none uppercase italic">Grid_Orchestration</h1>
            <p className="text-muted font-bold text-lg max-w-xl opacity-40 uppercase tracking-tight leading-tight">Sequence multi-agent logic chains into synchronized orchestration flows.</p>
          </div>
          <button
            onClick={() => router.push('/builder')}
            className="bg-foreground text-background px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:scale-[1.05] active:scale-[0.95] transition-all shadow-2xl shadow-foreground/10 flex items-center justify-center gap-4 border border-foreground/10"
          >
            <Plus size={18} strokeWidth={3} /> INITIALISE_FLOW
          </button>
        </header>

        {/* Workflows Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-60">
            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mb-6" />
            <p className="text-sm text-muted font-medium">Synchronizing orchestration data...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {agents?.map((agent: any) => (
              <div 
                key={agent.id} 
                className="bg-card p-10 rounded-[3rem] border border-border/60 shadow-2xl shadow-foreground/5 flex flex-col sm:flex-row sm:items-center justify-between gap-10 group transition-all duration-500 hover:shadow-2xl hover:shadow-foreground/10 hover:border-foreground/20 relative overflow-hidden"
              >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-foreground/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000 opacity-20" />
                  
                <div className="flex items-center gap-8 flex-1 relative z-10">
                   <div className="w-20 h-20 bg-foreground/[0.03] rounded-[1.75rem] flex items-center justify-center text-foreground group-hover:bg-foreground group-hover:text-background transition-all duration-700 shadow-inner group-hover:shadow-2xl shrink-0 border border-border/60">
                    <Layers size={32} strokeWidth={2.5} />
                   </div>
                   <div className="min-w-0 flex-1 space-y-4">
                      <div className="flex items-center gap-4">
                         <span className="text-[9px] font-black text-muted uppercase tracking-[0.3em] bg-foreground/5 border border-border/40 px-3 py-1 rounded-lg italic">HEX::{agent.id.slice(0, 12).toUpperCase()}</span>
                      </div>
                      <h3 className="font-black text-3xl tracking-tighter truncate leading-none italic uppercase group-hover:text-foreground transition-colors">{agent.name}</h3>
                      <div className="flex items-center flex-wrap gap-6 text-foreground uppercase opacity-40">
                        <div className="flex items-center gap-2.5 text-[9px] font-black tracking-widest leading-none">
                          <Zap size={14} strokeWidth={3} /> Signal_Active
                        </div>
                        <div className="w-1.5 h-1.5 bg-foreground/10 rounded-full" />
                        <div className="flex items-center gap-2.5 text-[9px] font-black tracking-widest leading-none">
                          <Activity size={14} strokeWidth={3} /> Sync_Healthy
                        </div>
                      </div>
                   </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-10 border-t sm:border-t-0 pt-10 sm:pt-0 border-border/40 relative z-10">
                  <div className={`hidden xs:flex items-center gap-3 px-5 py-2.5 rounded-full bg-emerald-500/5 border border-emerald-500/20 text-emerald-500 shadow-inner`}>
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                     <span className="text-[10px] font-black uppercase tracking-widest leading-none">Synchronized</span>
                  </div>
                  <button 
                    onClick={() => router.push(`/builder?id=${agent.id}`)}
                    className="px-10 py-5 bg-foreground text-background rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:scale-[1.05] active:scale-[0.95] transition-all flex items-center justify-center gap-4 shadow-2xl shadow-foreground/10 border border-foreground/10"
                  >
                    CONFIG <ArrowRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
            
            {(!agents || agents.length === 0) && (
              <div className="bg-foreground/[0.02] rounded-[4rem] border border-border/60 border-dashed py-48 flex flex-col items-center justify-center text-center space-y-12 px-12 relative overflow-hidden">
                 <div className="w-28 h-28 bg-foreground/5 rounded-[2.5rem] flex items-center justify-center text-muted/30 border border-border/40 shadow-inner">
                   <Share2 size={48} strokeWidth={1} />
                 </div>
                 <div className="space-y-4">
                    <h3 className="text-3xl font-black uppercase tracking-tighter italic italic">Registry_Void</h3>
                    <p className="text-muted font-bold leading-tight max-w-sm mx-auto uppercase opacity-40 text-sm">Your orchestration grid is currently offline. Initialise a new sequence to begin logic chaining.</p>
                 </div>
                 <button
                    onClick={() => router.push('/builder')}
                    className="bg-foreground text-background px-16 py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] hover:scale-[1.05] transition-all shadow-2xl shadow-foreground/20"
                  >
                    SYNTHESIZE_FIRST_FLOW
                  </button>
              </div>
            )}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
