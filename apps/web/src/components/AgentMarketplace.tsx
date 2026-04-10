'use client';

import React from 'react';
import { Search, Star, Filter, Bot, ChevronRight, Zap, Target, ArrowRight, Shield, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAgents, useAcquireAgent } from '@/hooks/useApi';

export default function AgentMarketplace() {
  const { data: agents, isLoading } = useAgents();
  const { mutate: acquireAgent } = useAcquireAgent();
  const router = useRouter();

  const handleAcquireAgent = async (agentId: string) => {
    acquireAgent(agentId, {
      onSuccess: () => {
        router.push('/agents');
      },
      onError: (err: any) => {
        alert(err.response?.data?.error || "Failed to acquire agent");
      }
    });
  };

  return (
    <div className="flex-1 bg-background min-h-full text-foreground p-6 sm:p-10 lg:p-14 overflow-y-auto no-scrollbar font-inter">
      <div className="max-w-[1400px] mx-auto space-y-12">
        
        {/* Modern Header Section */}
        <header className="space-y-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
            <div className="space-y-4">
               <h1 className="text-5xl sm:text-6xl font-black tracking-tighter text-foreground uppercase italic leading-none px-4">Marketplace</h1>
               <p className="text-muted font-bold text-lg max-w-xl px-4 opacity-50 uppercase tracking-tight">Discover and deploy high-performance agents into your workspace.</p>
            </div>
            <button 
              onClick={() => router.push('/builder')}
              className="bg-foreground text-background px-12 py-5 rounded-[1.75rem] font-black text-xs uppercase tracking-[0.3em] hover:scale-[1.02] shadow-2xl shadow-foreground/10 transition-all flex items-center justify-center gap-4 active:scale-[0.98]"
            >
              <Zap size={18} strokeWidth={3} /> Build Agent
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
             <div className="lg:col-span-3 relative group">
                <Search size={22} className="absolute left-8 top-1/2 -translate-y-1/2 text-muted opacity-40 group-focus-within:text-foreground group-focus-within:opacity-100 transition-all" />
                <input 
                  type="text" 
                  placeholder="Search agents..." 
                  className="w-full bg-foreground/5 border border-border/60 rounded-[2rem] pl-20 pr-10 py-6 text-sm font-black uppercase tracking-widest placeholder:text-muted/40 focus:bg-background focus:border-foreground focus:ring-0 transition-all outline-none shadow-2xl shadow-foreground/5"
                />
             </div>
             <button className="bg-foreground/5 border border-border/60 rounded-[2rem] px-10 py-6 flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-foreground hover:bg-background hover:border-foreground transition-all shadow-2xl shadow-foreground/5">
                <Filter size={18} /> Protocol Filters
             </button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar px-2">
            {['All Units', 'Automation', 'Intelligence', 'Analysis', 'Enterprise', 'Social'].map((cat, i) => (
              <button 
                key={cat} 
                className={`px-8 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-full transition-all whitespace-nowrap border ${
                  i === 0 
                    ? 'bg-foreground text-background border-foreground shadow-2xl shadow-foreground/20' 
                    : 'bg-foreground/5 border-border/60 text-muted hover:border-foreground hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </header>

        {/* Explorer Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-60">
             <div className="w-10 h-10 border-4 border-foreground border-t-transparent rounded-full animate-spin mb-8" />
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted opacity-40">Loading...</p>
          </div>
        ) : !agents || agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 bg-foreground/[0.02] rounded-[3rem] border border-border/60 border-dashed text-center px-8 relative overflow-hidden">
             <div className="w-24 h-24 bg-foreground/5 rounded-[2.5rem] flex items-center justify-center text-muted/30 mb-10 border border-border/50">
                <Target size={40} strokeWidth={1} />
             </div>
             <h3 className="text-3xl font-black mb-4 uppercase tracking-tighter italic">No agents found</h3>
             <p className="text-muted font-bold mb-12 max-w-sm mx-auto leading-tight uppercase opacity-40">The global grid is currently awaiting first-party or community-driven units.</p>
             <button onClick={() => router.push('/builder')} className="bg-foreground text-background px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:scale-[1.05] transition-all shadow-2xl">
                Create Agent
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 3xl:grid-cols-3 gap-10">
            {agents.map((agent: any) => (
              <div key={agent.id} className="bg-card rounded-[3rem] border border-border/60 p-12 hover:shadow-2xl hover:shadow-foreground/10 hover:border-foreground/20 transition-all duration-500 group flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-foreground/[0.02] rounded-full -mr-24 -mt-24 group-hover:scale-150 transition-transform duration-1000" />
                
                <div className="mb-10 flex justify-between items-start relative z-10">
                   <div className="w-16 h-16 bg-foreground/5 rounded-[1.5rem] flex items-center justify-center text-foreground border border-border/50 group-hover:bg-foreground group-hover:text-background transition-all duration-500 shadow-xl">
                      <Bot size={32} />
                   </div>
                   <div className="flex items-center gap-2 text-[10px] font-black text-foreground bg-foreground/5 border border-border/50 px-4 py-2 rounded-full uppercase tracking-widest">
                      <Star size={14} fill="currentColor" className="text-foreground" /> {agent.rating || '5.0'}
                   </div>
                </div>
                
                <div className="mb-6 flex items-center gap-3 relative z-10">
                   <span className="text-[9px] font-black text-foreground/60 uppercase tracking-[0.2em] bg-foreground/5 border border-border/40 px-3 py-1.5 rounded-lg">{agent.category || 'Automation'}</span>
                   <div className="w-1.5 h-1.5 bg-foreground/10 rounded-full" />
                   <div className="flex items-center gap-1.5 text-[9px] font-black text-foreground uppercase tracking-[0.2em]">
                     <Shield size={12} strokeWidth={3} /> Verified
                   </div>
                </div>
                
                <h3 className="text-3xl font-black mb-4 group-hover:text-foreground transition-colors leading-tight relative z-10 uppercase tracking-tighter italic">{agent.name}</h3>
                <p className="text-[13px] text-muted font-bold mb-12 line-clamp-3 leading-relaxed relative z-10 opacity-60">{agent.description || "No manual technical documentation provided for this unit."}</p>
                
                <div className="mt-auto flex items-center justify-between pt-10 border-t border-border/60 relative z-10">
                  <div className="flex flex-col">
                     <span className="text-3xl font-black text-foreground tracking-tighter">{agent.price === 0 ? 'FREE' : `${agent.price} Cr`}</span>
                     <span className="text-[8px] font-black text-muted uppercase tracking-[0.3em] mt-1 opacity-40 italic">Cost per install</span>
                  </div>
                  <button 
                    onClick={() => handleAcquireAgent(agent.id)}
                    className="bg-foreground text-background px-12 py-4.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.05] active:scale-[0.95] transition-all shadow-2xl shadow-foreground/10 flex items-center gap-4"
                  >
                    Install <Download size={18} strokeWidth={3} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
