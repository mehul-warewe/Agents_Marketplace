'use client';

import React, { useEffect } from 'react';
import { Activity, CheckCircle, XCircle, Clock, Zap, Bot, Terminal, ChevronRight, LayoutGrid, ArrowUpRight, Search, Play, Plus } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useDashboardStats, useAgentRuns } from '@/hooks/useApi';
import { motion } from 'framer-motion';

export default function AgentDashboard() {
  const { user, isLoading: authLoading } = useAuthStore();
  const router = useRouter();
  
  const { data: runs, isLoading: runsLoading } = useAgentRuns();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="flex-1 bg-background min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-4 border-foreground border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-6 text-muted font-black text-xs uppercase tracking-widest">Initialising Terminal...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background min-h-full text-foreground p-6 sm:p-10 lg:p-14 overflow-y-auto w-full no-scrollbar font-inter">
      <div className="max-w-[1400px] mx-auto space-y-12">
        
        {/* Premium Dashboard Header & Graph Area */}
        <section className="bg-card rounded-[4rem] border border-border/60 p-10 md:p-14 relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />
              <svg className="w-full h-full" viewBox="0 0 1000 300" preserveAspectRatio="none">
                 <path 
                   d="M0,250 Q100,220 200,240 T400,180 T600,200 T800,120 T1000,150" 
                   fill="none" 
                   stroke="currentColor" 
                   strokeWidth="2" 
                   className="text-primary animate pulse"
                 />
                 <path 
                   d="M0,250 Q100,220 200,240 T400,180 T600,200 T800,120 T1000,150 L1000,300 L0,300 Z" 
                   fill="url(#fadeGradient)" 
                   className="text-primary/10"
                 />
                 <defs>
                   <linearGradient id="fadeGradient" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="0%" stopColor="currentColor" stopOpacity="0.5" />
                     <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                   </linearGradient>
                 </defs>
              </svg>
           </div>

           <div className="relative z-10 flex flex-col md:flex-row justify-between gap-12">
              <div className="space-y-6">
                 <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground leading-[0.85] uppercase italic">
                   Welcome Back<br /><span className="text-primary">{user?.name?.split(' ')[0] || 'Operator'}</span>
                 </h1>
              </div>
              <div className="flex flex-col justify-between items-end gap-4 text-right">
                 <button 
                    onClick={() => router.push('/builder')}
                    className="bg-primary text-primary-foreground px-10 py-4.5 rounded-[1.75rem] font-black text-[11px] uppercase tracking-[0.4em] hover:scale-[1.05] active:scale-[0.95] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-primary/20"
                 >
                    <Plus size={18} strokeWidth={3} /> INITIALISE_AGENT
                 </button>

              </div>
           </div>
        </section>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <StatCard 
            title="Active Fleet" 
            value={stats?.activeAgents || 0} 
            loading={statsLoading} 
            icon={<Bot size={28} />} 
            trend="OPERATIONAL"
            color="primary"
          />
          <StatCard 
            title="Total Runs" 
            value={stats?.totalRuns || 0} 
            loading={statsLoading} 
            icon={<Play size={28} />} 
            trend="CYCLES_COMPLETE"
          />
          <StatCard 
            title="AI Consumption" 
            value={stats?.aiUsage || "0"} 
            loading={statsLoading} 
            icon={<Activity size={28} />} 
            trend="LOGIC_TOKENS"
          />
          <StatCard 
            title="Success Rate" 
            value={`${stats?.successRate || 98}%`} 
            loading={statsLoading} 
            icon={<Zap size={28} />} 
            trend="STABILITY_PEAK"
          />
        </div>

        {/* Intelligence Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Recent Activity Table - Now 3 columns wide */}
          <div className="lg:col-span-3 space-y-8">
            <div className="flex items-center justify-between px-2">
               <h2 className="text-2xl font-black tracking-tighter uppercase italic">Registry_Logs</h2>
               <button 
                onClick={() => router.push('/agents')}
                className="text-[10px] font-black text-muted hover:text-primary transition-colors uppercase tracking-[0.2em] flex items-center gap-2"
              >
                Full Fleet <ArrowUpRight size={14} strokeWidth={3} />
              </button>
            </div>

            <div className="bg-card rounded-[2.5rem] border border-border/60 shadow-xl overflow-hidden">
              {runsLoading ? (
                <div className="flex flex-col items-center justify-center py-40">
                  <div className="w-12 h-12 border-4 border-foreground border-t-background rounded-full animate-spin mb-8 opacity-20"></div>
                  <p className="text-[10px] font-black text-muted uppercase tracking-[0.4em] opacity-40">Interrogating_Telemetry...</p>
                </div>
              ) : !runs || runs.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-48 text-center px-12">
                   <div className="w-24 h-24 bg-foreground/[0.03] rounded-[2.5rem] flex items-center justify-center text-muted mb-12 border border-border/40 shadow-inner">
                      <Terminal size={48} strokeWidth={1} />
                   </div>
                   <h3 className="text-3xl font-black mb-4 italic uppercase tracking-tighter leading-none">Void_Detected</h3>
                   <p className="text-muted mb-12 max-w-xs mx-auto font-bold opacity-40 uppercase text-sm leading-tight">Zero activity streams detected in local cluster. Initiate new protocol via marketplace.</p>
                   <button onClick={() => router.push('/marketplace')} className="bg-primary text-primary-foreground px-16 py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] hover:scale-[1.05] transition-all shadow-2xl shadow-primary/20">
                     OPEN_REGISTRY
                   </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="bg-foreground/[0.02] border-b border-border/60">
                            <th className="px-10 py-6 text-[10px] font-black text-muted uppercase tracking-[0.3em] opacity-40">Agent_Entity_ID</th>
                            <th className="px-10 py-6 text-[10px] font-black text-muted uppercase tracking-[0.3em] opacity-40">Logic_Status</th>
                            <th className="px-10 py-6 text-[10px] font-black text-muted uppercase tracking-[0.3em] opacity-40 text-right">Last_Sync</th>
                         </tr>
                      </thead>
                       <tbody className="divide-y divide-border/20 uppercase">
                          {runs.map((run: any) => (
                            <tr key={run.id} className="hover:bg-foreground/[0.01] transition-all group">
                              <td className="px-8 py-6">
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-foreground/[0.03] border border-border/40 flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                                       <Bot size={18} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                       <div className="font-black text-sm tracking-tighter italic truncate">{run.agentName}</div>
                                       <span className="text-[8px] text-muted font-bold opacity-30">HEX::{run.id.slice(0, 8).toUpperCase()}</span>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-8 py-6">
                                 <StatusBadge status={run.status} />
                              </td>
                              <td className="px-8 py-6 text-right font-black text-[10px] text-muted opacity-40 italic tracking-widest">
                                 {run.startTime ? new Date(run.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--:--'}
                              </td>
                            </tr>
                          ))}
                       </tbody>
                   </table>
                </div>
              )}
            </div>
          </div>

          {/* Side Panels - Dedicated Right Column */}
          <div className="lg:col-span-1 flex flex-col gap-8">
             {/* Feed Panel */}
             <div className="bg-card rounded-[2.5rem] border border-border/60 shadow-xl p-8 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-8">
                   <h3 className="font-black text-lg italic uppercase tracking-tighter leading-none">Status_Feed</h3>
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="space-y-6 flex-1">
                   {runs?.slice(0, 5).map((run: any, i: number) => (
                      <div key={i} className="flex gap-4 group items-center uppercase">
                         <div className="w-10 h-10 rounded-xl bg-foreground/[0.03] flex items-center justify-center text-muted group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-inner">
                            <Activity size={16} strokeWidth={3} />
                         </div>
                         <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-black truncate italic transition-colors leading-none mb-1">{run.agentName}</p>
                            <p className="text-[8px] text-muted font-black truncate tracking-widest opacity-40">{run.status}</p>
                         </div>
                      </div>
                   ))}
                   {!runs?.length && (
                      <div className="flex-1 flex items-center justify-center border-2 border-border/40 border-dashed rounded-[2rem] p-10">
                         <span className="text-[9px] text-muted/30 font-black uppercase tracking-[0.3em] italic">No_Stream_Intel</span>
                      </div>
                   )}
                </div>
             </div>

             {/* Action Prompt */}
             <div className="bg-foreground rounded-[2.5rem] p-10 relative overflow-hidden group shadow-2xl">
                <div className="absolute top-0 right-0 p-10 opacity-[0.05] rotate-12 transition-all duration-1000">
                   <Bot size={200} className="text-background fill-current" />
                </div>
                <div className="relative z-10 space-y-8">
                   <div className="w-12 h-12 bg-background rounded-xl flex items-center justify-center text-foreground shadow-xl">
                      <LayoutGrid size={24} strokeWidth={2.5} />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black text-background leading-none italic uppercase tracking-tighter mb-3">Scale_Logistics</h3>
                      <p className="text-background/40 font-bold text-[10px] uppercase leading-tight tracking-tight">Deploy new specialized logic units into the cluster.</p>
                   </div>
                   <button 
                     onClick={() => router.push('/builder')} 
                     className="w-full py-4.5 bg-primary text-primary-foreground rounded-2xl font-black text-[9px] uppercase tracking-[0.4em] hover:scale-[1.05] transition-all shadow-xl shadow-primary/20"
                   >
                     DEPLOY_NOW
                   </button>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, loading, icon, trend, color }: any) {
  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }}
      className={`bg-card rounded-[3rem] border border-border/60 p-10 transition-all duration-500 shadow-xl group hover:border-${color === 'primary' ? 'primary/40' : 'foreground/30'} relative overflow-hidden`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-${color === 'primary' ? 'primary' : 'foreground'}/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700 opacity-20`} />
      
      <div className="flex flex-col relative z-10">
         <div className="flex items-center justify-between mb-8">
            <div className={`w-12 h-12 flex items-center justify-center rounded-2xl ${color === 'primary' ? 'bg-primary/20 text-primary border border-primary/20' : 'bg-foreground/5 text-foreground border border-border/60'} group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-700 shadow-inner`}>
               {React.cloneElement(icon as React.ReactElement, { size: 24, strokeWidth: 3 } as any)}
            </div>
            <div className={`text-[9px] font-black ${color === 'primary' ? 'text-primary bg-primary/10' : 'text-muted bg-foreground/5'} px-3 py-1 rounded-full uppercase tracking-widest`}>{trend}</div>
         </div>
         <div className="text-[10px] font-black text-muted mb-1 uppercase tracking-[0.3em] opacity-40 italic">{title}</div>
         {loading ? (
            <div className="h-8 w-20 bg-foreground/5 animate-pulse rounded-lg"></div>
         ) : (
            <div className="text-4xl font-black tracking-tighter text-foreground italic leading-none">{value}</div>
         )}
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: any = {
    completed: { icon: <CheckCircle size={14} strokeWidth={3} />, bg: 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10', label: 'SUCCESS' },
    failed: { icon: <XCircle size={14} strokeWidth={3} />, bg: 'bg-red-500/5 text-red-500 border-red-500/20', label: 'ERROR' },
    running: { icon: <Activity size={14} strokeWidth={3} className="animate-pulse" />, bg: 'bg-foreground/5 text-foreground border-foreground/10', label: 'ACTIVE' },
    pending: { icon: <Clock size={14} strokeWidth={3} />, bg: 'bg-foreground/[0.03] text-muted border-border/40', label: 'QUEUED' },
  };

  const config = configs[status] || configs.pending;

  return (
    <div className={`flex items-center gap-3 px-5 py-2.5 rounded-full border ${config.bg} w-fit shadow-inner`}>
      {config.icon}
      <span className="text-[9px] font-black leading-none tracking-[0.2em]">{config.label}</span>
    </div>
  );
}
