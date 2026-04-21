'use client';

import React, { useEffect } from 'react';
import { Activity, CheckCircle, XCircle, Clock, Zap, Bot, Terminal, ChevronRight, LayoutGrid, ArrowUpRight, Play, Plus, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useDashboardStats, useWorkforceRuns } from '@/hooks/useApi';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function WorkforceDashboard() {
  const { user, isLoading: authLoading } = useAuthStore();
  const router = useRouter();
  
  const { data: runs, isLoading: runsLoading } = useWorkforceRuns();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="flex-1 bg-background min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 text-foreground">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-6 text-muted-foreground font-black text-[10px] uppercase tracking-[0.2em]">Initializing Workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 text-foreground space-y-4 p-4 lg:p-6 bg-muted/30 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Premium Dashboard Header */}
        <Card className="p-8 relative overflow-hidden border-border shadow-sm bg-card rounded-2xl">
           <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-transparent to-transparent" />
              <svg className="w-full h-full" viewBox="0 0 1000 300" preserveAspectRatio="none">
                 <path 
                   d="M0,250 Q100,220 200,240 T400,180 T600,200 T800,120 T1000,150" 
                   fill="none" 
                   stroke="currentColor" 
                   strokeWidth="2" 
                   className="text-indigo-600 animate pulse"
                 />
              </svg>
           </div>

           <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6 items-center">
              <div className="space-y-1.5 flex flex-col items-center md:items-start">
                 <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
                   Welcome, <span className="text-indigo-600 dark:text-indigo-400">{user?.name?.split(' ')[0] || 'Member'}</span>
                 </h1>
                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none">Global Operations: All Systems Optimal</p>
              </div>
              <div className="flex items-center gap-3">
                 <Button 
                    onClick={() => router.push('/employees/new')}
                    className="h-10 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-indigo-500/10 border-none transition-all group"
                 >
                    <Plus size={16} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" /> 
                    Create Employee
                 </Button>
              </div>
           </div>
        </Card>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Managed Workforce" 
            value={stats?.activeWorkforce || 0} 
            loading={statsLoading} 
            icon={<Bot size={28} />} 
            trend="Active Units"
            color="primary"
          />
          <StatCard 
            title="Process Executions" 
            value={stats?.totalRuns || 0} 
            loading={statsLoading} 
            icon={<Play size={28} />} 
            trend="Total cycles"
          />
          <StatCard 
            title="Resource Volume" 
            value={stats?.aiUsage || "0"} 
            loading={statsLoading} 
            icon={<Activity size={28} />} 
            trend="Current usage"
          />
          <StatCard 
            title="System Stability" 
            value={`${stats?.successRate || 98}%`} 
            loading={statsLoading} 
            icon={<Zap size={28} />} 
            trend="Platform health"
          />
        </div>

        {/* Intelligence Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Recent Activity Table */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between px-1">
               <div className="flex flex-col">
                 <h2 className="text-xl font-black tracking-tight text-foreground uppercase">Workforce Registry</h2>
                 <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">Real-time terminal execution logs</p>
               </div>
               <Button 
                variant="ghost"
                size="sm"
                onClick={() => router.push('/employees')}
                className="text-muted-foreground hover:text-indigo-600 flex items-center gap-2 group text-[10px] font-black uppercase tracking-widest"
               >
                Full Registry <ArrowUpRight size={14} className="text-indigo-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
               </Button>
            </div>

            <Card className="overflow-hidden border-border bg-card shadow-sm rounded-2xl">
              {runsLoading ? (
                <div className="flex flex-col items-center justify-center py-32">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Synchronizing Operation Records...</p>
                </div>
              ) : !runs || runs.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-32 text-center px-12">
                   <div className="w-16 h-16 bg-muted border border-border rounded-2xl flex items-center justify-center text-muted-foreground/30 mb-6 shadow-sm">
                      <Terminal size={32} />
                   </div>
                   <h3 className="text-sm font-black uppercase tracking-widest mb-2 text-foreground">Zero Logs Found</h3>
                   <p className="text-muted-foreground/40 mb-8 max-w-xs mx-auto text-[11px] font-medium leading-relaxed italic">The operation registry is currently empty. Initialize your first employee unit to begin recording activity.</p>
                   <Button onClick={() => router.push('/marketplace')} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] px-8 h-10 shadow-lg shadow-indigo-500/10">
                     Access Marketplace
                   </Button>
                </div>
              ) : (
                 <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                      <thead>
                         <tr className="bg-muted border-b border-border">
                            <th className="px-6 py-4 text-[9px] font-black text-muted-foreground/60 uppercase tracking-[0.15em]">Employee Unit</th>
                            <th className="px-6 py-4 text-[9px] font-black text-muted-foreground/60 uppercase tracking-[0.15em]">Instruction Status</th>
                            <th className="px-6 py-4 text-[9px] font-black text-muted-foreground/60 uppercase tracking-[0.15em] text-right">Execution Sequence</th>
                         </tr>
                      </thead>
                       <tbody className="divide-y divide-border">
                          {runs.map((run: any) => (
                            <tr key={run.id} className="hover:bg-muted/50 transition-all group">
                              <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-muted border border-border flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
                                       <Bot size={16} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                       <div className="font-bold text-[13px] text-foreground truncate">{run.employeeName}</div>
                                       <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest shrink-0">UID: {run.id.slice(0, 8)}</span>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <StatusBadge status={run.status} />
                              </td>
                              <td className="px-6 py-4 text-right">
                                 <span className="text-[10px] font-bold text-muted-foreground/60 tabular-nums">
                                    {run.startTime ? new Date(run.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--:--'}
                                 </span>
                              </td>
                            </tr>
                          ))}
                       </tbody>
                   </table>
                 </div>
              )}
            </Card>
          </div>

          {/* Side Panels */}
          <div className="lg:col-span-1 flex flex-col gap-6 pt-0 lg:pt-14">
             {/* Feed Panel */}
             <Card className="p-6 bg-card border-border shadow-sm flex flex-col rounded-2xl h-fit">
                <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
                   <h3 className="font-black text-[11px] uppercase tracking-[0.2em] text-foreground">Operational Pulse</h3>
                   <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse" />
                </div>
                <div className="space-y-5">
                   {runs?.slice(0, 5).map((run: any, i: number) => (
                      <div key={i} className="flex gap-4 group items-start">
                         <div className="w-2 h-8 rounded-full bg-muted border border-border group-hover:bg-indigo-600 transition-all shrink-0" />
                         <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold truncate text-foreground leading-tight">{run.employeeName}</p>
                            <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest mt-1">Status: {run.status}</p>
                         </div>
                      </div>
                   ))}
                   {(!runs || runs.length === 0) && (
                      <div className="py-20 border border-border border-dashed rounded-xl flex items-center justify-center text-center px-6">
                         <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 italic">No cycles recorded</span>
                      </div>
                   )}
                </div>
             </Card>

             {/* Action Prompt */}
             <Card className="bg-indigo-600 border-none text-white p-8 relative overflow-hidden group shadow-xl rounded-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 transition-all duration-1000 group-hover:rotate-0 group-hover:scale-125">
                   <Bot size={140} className="fill-current" />
                </div>
                <div className="relative z-10 space-y-6">
                   <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center text-white backdrop-blur-sm border border-white/10">
                      <LayoutGrid size={22} strokeWidth={2.5} />
                   </div>
                   <div>
                      <h3 className="text-xl font-bold leading-tight mb-2">Architect Solutions</h3>
                      <p className="text-white/70 text-[11px] font-medium leading-relaxed italic">Construct custom logic schemas and publish new specialized employee units to your registry.</p>
                   </div>
                   <Button 
                     onClick={() => router.push('/skills/builder')} 
                     className="w-full bg-white text-indigo-600 hover:bg-white/90 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] h-10 shadow-lg border-none"
                   >
                     Initialize Schema
                   </Button>
                </div>
             </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, loading, icon, trend, color }: any) {
  return (
    <Card className="p-6 transition-all shadow-sm border-border relative overflow-hidden group bg-card rounded-2xl hover:border-indigo-600/30">
      <div className="flex flex-col relative z-10">
         <div className="flex items-center justify-between mb-5">
            <div className={`w-10 h-10 flex items-center justify-center rounded-xl border ${color === 'primary' ? 'bg-indigo-600 text-white border-indigo-700 shadow-md' : 'bg-muted text-muted-foreground/60 border-border'}`}>
               {React.cloneElement(icon as React.ReactElement<any>, { size: 18, strokeWidth: 2.5 })}
            </div>
            <div className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${color === 'primary' ? 'text-indigo-600 bg-indigo-500/10 border border-indigo-500/10' : 'text-muted-foreground/60 bg-muted border border-border'}`}>{trend}</div>
         </div>
         <div className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.15em] mb-1">{title}</div>
         {loading ? (
            <div className="h-8 w-20 bg-muted animate-pulse rounded-lg"></div>
         ) : (
            <div className="text-3xl font-black tracking-tight text-foreground leading-none tabular-nums">{value}</div>
         )}
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: any = {
    completed: { icon: <CheckCircle size={12} strokeWidth={3} />, bg: 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20', label: 'Completed' },
    failed: { icon: <XCircle size={12} strokeWidth={3} />, bg: 'bg-red-500/5 text-red-500 border-red-500/20', label: 'Terminal Error' },
    running: { icon: <Loader2 size={12} strokeWidth={3} className="animate-spin text-indigo-600" />, bg: 'bg-indigo-500/5 text-indigo-600 border-indigo-500/20', label: 'Processing' },
    pending: { icon: <Clock size={12} strokeWidth={3} />, bg: 'bg-muted text-muted-foreground/60 border-border', label: 'Syncing' },
  };

  const config = configs[status] || configs.pending;

  return (
    <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border ${config.bg} w-fit`}>
      {config.icon}
      <span className="text-[9px] font-black uppercase tracking-widest">{config.label}</span>
    </div>
  );
}
