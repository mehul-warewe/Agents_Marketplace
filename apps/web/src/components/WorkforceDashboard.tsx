'use client';

import React, { useEffect } from 'react';
import { Activity, CheckCircle, XCircle, Clock, Zap, Bot, Terminal, ChevronRight, LayoutGrid, ArrowUpRight, Search, Play, Plus } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useDashboardStats, useWorkforceRuns } from '@/hooks/useApi';
import { motion } from 'framer-motion';
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
      <div className="flex-1 bg-background min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-4 border-foreground border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-6 text-muted font-black text-xs uppercase tracking-widest">Initializing Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 text-foreground space-y-3 p-2 lg:p-4 bg-secondary/5">
      <div className="space-y-3">
        
        {/* Premium Dashboard Header & Graph Area */}
        <Card className="p-6 relative overflow-hidden border-border/40 shadow-sm bg-card rounded-2xl">
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

           <div className="relative z-10 flex flex-col md:flex-row justify-between gap-4 items-center">
              <div className="space-y-1">
                 <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-display text-foreground">
                   Welcome Back, <span className="text-indigo-500">{user?.name?.split(' ')[0] || 'Manager'}</span>
                 </h1>
                 <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest leading-none">Status: All systems operational</p>
              </div>
              <div className="flex justify-end">
                 <Button 
                    onClick={() => router.push('/employees/new')}
                    size="sm"
                    className="h-9 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 border-none transition-all"
                 >
                    <Plus size={14} strokeWidth={2.5} /> Create Employee
                 </Button>
              </div>
           </div>
        </Card>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Active Workforce" 
            value={stats?.activeWorkforce || 0} 
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
            trend="CYCLES"
          />
          <StatCard 
            title="Consumption" 
            value={stats?.aiUsage || "0"} 
            loading={statsLoading} 
            icon={<Activity size={28} />} 
            trend="TOKENS"
          />
          <StatCard 
            title="Stability" 
            value={`${stats?.successRate || 98}%`} 
            loading={statsLoading} 
            icon={<Zap size={28} />} 
            trend="PEAK"
          />
        </div>

        {/* Intelligence Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          
          {/* Recent Activity Table */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
               <h2 className="text-2xl font-bold tracking-tight font-display">Workforce Logs</h2>
               <Button 
                variant="ghost"
                size="sm"
                onClick={() => router.push('/employees')}
                className="text-muted-foreground"
               >
                Full Fleet <ArrowUpRight size={14} className="text-indigo-500" />
               </Button>
            </div>

            <Card className="overflow-hidden">
              {runsLoading ? (
                <div className="flex flex-col items-center justify-center py-32">
                  <Activity className="w-8 h-8 text-primary animate-spin opacity-50 mb-4" />
                  <p className="text-sm font-medium text-muted-foreground">Gathering workspace data...</p>
                </div>
              ) : !runs || runs.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-32 text-center px-12">
                   <div className="w-16 h-16 bg-secondary rounded-lg flex items-center justify-center text-muted-foreground mb-6 shadow-sm border border-border/40">
                      <Terminal size={32} />
                   </div>
                   <h3 className="text-xl font-bold font-display mb-2">No Runs Detected</h3>
                   <p className="text-muted-foreground mb-8 max-w-xs mx-auto text-sm">You haven't run any logic units yet. Head to the dashboard to start.</p>
                   <Button onClick={() => router.push('/marketplace')} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest px-6 h-10 shadow-lg shadow-indigo-500/20">
                     Open Registry
                   </Button>
                </div>
              ) : (
                 <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="bg-muted/50 border-b border-border">
                            <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase">Employee Assignment</th>
                            <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase">Execution Status</th>
                            <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase text-right">Last Active</th>
                         </tr>
                      </thead>
                       <tbody className="divide-y divide-border">
                          {runs.map((run: any) => (
                            <tr key={run.id} className="hover:bg-muted/30 transition-all group">
                              <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-secondary border border-border/60 flex items-center justify-center text-foreground shadow-sm">
                                       <Bot size={16} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                       <div className="font-bold text-sm truncate">{run.employeeName}</div>
                                       <span className="text-xs text-muted-foreground">{run.id.slice(0, 8)}</span>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <StatusBadge status={run.status} />
                              </td>
                              <td className="px-6 py-4 text-right font-medium text-xs text-muted-foreground">
                                 {run.startTime ? new Date(run.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--:--'}
                              </td>
                            </tr>
                          ))}
                       </tbody>
                   </table>
                 </div>
              )}
            </Card>
          </div>

          {/* Side Panels - Dedicated Right Column */}
          <div className="lg:col-span-1 flex flex-col gap-6 pt-12">
             {/* Feed Panel */}
             <Card className="p-6 flex-1 flex flex-col shadow-sm">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="font-bold text-lg font-display">Status Feed</h3>
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="space-y-4 flex-1">
                   {runs?.slice(0, 5).map((run: any, i: number) => (
                      <div key={i} className="flex gap-3 group items-center">
                         <div className="w-8 h-8 rounded-lg bg-secondary border border-border/60 flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-sm">
                            <Activity size={14} />
                         </div>
                         <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold truncate">{run.employeeName}</p>
                            <p className="text-xs text-muted-foreground uppercase">{run.status}</p>
                         </div>
                      </div>
                   ))}
                   {!runs?.length && (
                      <div className="flex-1 flex items-center justify-center border border-border border-dashed rounded-[10px] p-6">
                         <span className="text-xs font-medium text-muted-foreground">No recent activity</span>
                      </div>
                   )}
                </div>
             </Card>

             {/* Action Prompt */}
             <Card className="bg-foreground border-none text-background p-6 relative overflow-hidden group shadow-sm">
                <div className="absolute top-0 right-0 p-6 opacity-[0.05] rotate-12 transition-all duration-1000">
                   <Bot size={120} className="text-background fill-current" />
                </div>
                <div className="relative z-10 space-y-6">
                   <div className="w-10 h-10 bg-background rounded-[10px] flex items-center justify-center text-foreground">
                      <LayoutGrid size={20} />
                   </div>
                   <div>
                      <h3 className="text-xl font-bold font-display mb-1">Scale Workforce</h3>
                      <p className="text-background/70 text-sm">Add new specialized employees to your team.</p>
                   </div>
                   <Button 
                     variant="secondary"
                     className="w-full"
                     onClick={() => router.push('/skills/builder')} 
                   >
                     Create Now
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
    <Card className="p-6 transition-all shadow-md hover:shadow-lg border-border/40 relative overflow-hidden group bg-card">
      <div className="flex flex-col relative z-10">
         <div className="flex items-center justify-between mb-4">
            <div className={`w-10 h-10 flex items-center justify-center rounded-lg shadow-sm border border-border/50 ${color === 'primary' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/10' : 'bg-secondary text-muted-foreground'}`}>
               {React.cloneElement(icon as React.ReactElement<any>, { size: 20 })}
            </div>
            <div className={`text-xs font-bold px-2 py-0.5 rounded-md ${color === 'primary' ? 'text-indigo-500 bg-indigo-500/10 border border-indigo-500/10' : 'text-muted-foreground bg-secondary border border-border/40'}`}>{trend}</div>
         </div>
         <div className="text-sm font-medium text-muted-foreground mb-1">{title}</div>
         {loading ? (
            <div className="h-8 w-20 bg-muted animate-pulse rounded-[10px]"></div>
         ) : (
            <div className="text-3xl font-bold font-display tracking-tight text-foreground leading-none">{value}</div>
         )}
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: any = {
    completed: { icon: <CheckCircle size={14} />, bg: 'bg-emerald-500/10 text-emerald-500 border-none', label: 'Success' },
    failed: { icon: <XCircle size={14} />, bg: 'bg-red-500/10 text-red-500 border-none', label: 'Error' },
    running: { icon: <Activity size={14} className="animate-pulse" />, bg: 'bg-primary/10 text-primary border-none', label: 'Running' },
    pending: { icon: <Clock size={14} />, bg: 'bg-muted text-muted-foreground border-none', label: 'Queued' },
  };

  const config = configs[status] || configs.pending;

  return (
    <div className={`flex items-center gap-2 px-2.5 py-1 rounded-[10px] border ${config.bg} w-fit`}>
      {config.icon}
      <span className="text-xs font-medium">{config.label}</span>
    </div>
  );
}
