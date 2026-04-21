'use client';
import SidebarLayout from '@/components/SidebarLayout';
import { useManagers, useCreateManager, useDeleteManager } from '@/hooks/useManager';
import { useEmployees as useWorkers } from '@/hooks/useEmployees';
import { Bot, Plus, Clock, Terminal, Shield, Play, ChevronRight, Edit3, Trash2, Activity, Users, Target, Cpu, X, Sparkles, Network, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function ManagerDashboard() {
  const { data: managers, isLoading } = useManagers();
  const { data: workers } = useWorkers();
  const { mutate: createManager, isPending: isCreating } = useCreateManager();
  const { mutate: deleteManager } = useDeleteManager();
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newManager, setNewManager] = useState({
    name: '',
    description: '',
    goal: '',
    systemPrompt: '',
    model: 'google/gemini-2.0-flash-001',
    workerIds: [] as string[]
  });

  const handleCreate = () => {
    if (!newManager.name) return;
    createManager(newManager, {
      onSuccess: () => {
        setIsModalOpen(false);
        setNewManager({
          name: '',
          description: '',
          goal: '',
          systemPrompt: '',
          model: 'google/gemini-2.0-flash-001',
          workerIds: []
        });
      }
    });
  };

  const toggleWorker = (id: string) => {
    setNewManager(prev => ({
      ...prev,
      workerIds: prev.workerIds.includes(id) 
        ? prev.workerIds.filter(wId => wId !== id)
        : [...prev.workerIds, id]
    }));
  };

  return (
    <SidebarLayout title="Managers">
      <div className="flex-1 text-foreground space-y-6 p-4 lg:p-6 bg-secondary/5 h-full">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
             <div className="space-y-1">
                <div className="flex items-center gap-2 mb-1">
                   <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/10 shadow-sm">
                      <Shield size={16} />
                   </div>
                   <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest leading-none">Intelligence Hub</span>
                </div>
                <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">
                  Manager Registry
                </h1>
                <p className="text-muted-foreground font-medium text-[11px] max-w-xl leading-snug uppercase tracking-wide opacity-70">
                   Assign autonomous intelligence units to coordinate professional tasks across your workforce.
                </p>
             </div>
             
             <Button
                onClick={() => router.push('/manager/builder')}
                className="h-10 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all gap-3 shrink-0"
             >
                <Plus size={16} strokeWidth={2.5} /> Create Manager
             </Button>
          </div>
 
          {/* Managers List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
               <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Active Managers</h2>
               <div className="text-[10px] font-bold text-muted-foreground/40 uppercase">Count: {managers?.length || 0}</div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-64 bg-card border border-border/40 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : !managers || managers.length === 0 ? (
              <Card className="flex flex-col items-center justify-center py-24 text-center px-10 border-border/40 rounded-2xl bg-card shadow-sm max-w-2xl mx-auto">
                <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center text-muted-foreground mb-6 shadow-sm border border-border/40">
                   <Users size={32} />
                </div>
                <h3 className="text-xl font-bold font-display mb-2 text-foreground tracking-tight">Manager Registry Empty</h3>
                <p className="text-muted-foreground mb-8 max-w-xs mx-auto text-[13px] font-medium leading-relaxed">
                  No active managers detected. Start by creating a manager to coordinate your specialized employee team.
                </p>
                <Button
                  onClick={() => router.push('/manager/builder')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest h-10 px-8 shadow-lg shadow-indigo-500/20 border-none"
                >
                  Create First Manager
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {managers.map((manager: any) => (
                  <Card 
                    key={manager.id} 
                    className="group p-6 relative transition-all duration-300 rounded-2xl border-border/40 shadow-sm hover:shadow-md hover:border-indigo-500/20 flex flex-col overflow-hidden cursor-pointer bg-card" 
                    onClick={() => router.push(`/manager/${manager.id}`)}
                  >
                    <div className="flex items-center justify-between shrink-0 mb-6 relative z-10">
                       <div className="w-10 h-10 rounded-xl bg-secondary border border-border/40 flex items-center justify-center text-foreground group-hover:bg-indigo-500 group-hover:text-white group-hover:border-transparent transition-all duration-300 shadow-sm">
                          <Users size={18} />
                       </div>
                       <div className="flex items-center gap-2">
                          <div className="px-2 py-0.5 rounded-md border border-indigo-500/20 bg-indigo-500/10 text-indigo-500 text-[9px] font-bold uppercase tracking-widest">
                             MANAGER
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/manager/builder?id=${manager.id}`); }}
                            className="p-1.5 rounded-lg text-muted-foreground/40 hover:bg-indigo-500/10 hover:text-indigo-500 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); if(confirm('Delete this manager\?')) deleteManager(manager.id); }}
                            className="p-1.5 rounded-lg text-muted-foreground/40 hover:bg-red-500/10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={13} />
                          </button>
                       </div>
                    </div>

                    <div className="space-y-2 mb-6 relative z-10">
                       <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold font-display tracking-tight text-foreground truncate group-hover:text-indigo-500 transition-colors">{manager.name}</h3>
                       </div>
                       <p className="text-[12px] text-muted-foreground font-medium line-clamp-2 leading-snug">
                          {manager.goal || "Managing strategic responsibilities for this hub..."}
                       </p>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6 relative z-10">
                       <div className="flex items-center gap-2 px-2.5 py-1 bg-indigo-500/5 border border-indigo-500/10 rounded-lg text-[9px] font-bold text-indigo-500 uppercase tracking-tight">
                          <Network size={12} strokeWidth={2.5} /> {manager.workerIds?.length || 0} EMPLOYEES
                       </div>
                       <div className="flex items-center gap-2 px-2.5 py-1 bg-secondary border border-border/40 rounded-lg text-[9px] font-bold text-muted-foreground uppercase tracking-tight">
                          <Cpu size={12} /> {manager.model.split('/').pop()}
                       </div>
                    </div>

                    <div className="pt-4 mt-auto border-t border-border/40 flex items-center justify-between relative z-10">
                       <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                          <Target size={12} /> ACTIVE
                       </div>
                       <div className="flex items-center gap-1.5 text-indigo-500 font-bold text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all">
                          ARCHITECT <ChevronRight size={14} strokeWidth={3} />
                       </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── CREATE MANAGER OVERLAY (SOLID DESIGN) ─────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/40">
          <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />
          <Card className="relative w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col bg-card border-border/40">
            
            {/* Modal Header */}
            <div className="p-8 border-b border-border/40 flex justify-between items-center bg-muted/30">
               <div className="space-y-1">
                  <div className="flex items-center gap-2">
                     <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/10 shadow-sm">
                        <Sparkles size={16} />
                     </div>
                     <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Setup Assistant</span>
                  </div>
                  <h2 className="text-2xl font-bold font-display text-foreground tracking-tight">Create Manager Unit</h2>
               </div>
               <button 
                onClick={() => setIsModalOpen(false)} 
                className="w-8 h-8 rounded-lg bg-secondary hover:bg-foreground hover:text-background transition-all border border-border/40 flex items-center justify-center shadow-sm"
               >
                 <X size={16} />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                
                {/* Configuration Left Col */}
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] px-1">
                       Manager Name
                    </label>
                    <input 
                      value={newManager.name}
                      onChange={e => setNewManager(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-secondary/50 border border-border/60 rounded-xl px-5 py-4 outline-none focus:bg-background focus:border-indigo-500/40 transition-all font-bold text-lg tracking-tight shadow-inner"
                      placeholder="e.g. Strategic Operations AI"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] px-1">
                      Core Responsibilities
                    </label>
                    <textarea 
                      value={newManager.goal}
                      onChange={e => setNewManager(prev => ({ ...prev, goal: e.target.value }))}
                      className="w-full bg-secondary/50 border border-border/60 rounded-xl px-5 py-5 outline-none focus:bg-background focus:border-indigo-500/40 transition-all font-medium text-[13px] leading-relaxed shadow-inner min-h-[100px] resize-none"
                      placeholder="Specify the long-term objective for this unit..."
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] px-1">
                      Instruction Set (System Prompt)
                    </label>
                    <textarea
                      value={newManager.systemPrompt}
                      onChange={e => setNewManager(prev => ({ ...prev, systemPrompt: e.target.value }))}
                      className="w-full bg-secondary/50 border border-border/60 rounded-xl px-5 py-5 outline-none focus:bg-background focus:border-indigo-500/40 transition-all font-mono text-[11px] leading-relaxed shadow-inner min-h-[140px] resize-none"
                      placeholder="Provide core instructions for orchestration..."
                    />
                  </div>
                </div>

                {/* Workforce Selection Right Col */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] px-1">
                    Managed Workforce
                  </label>
                  <div className="bg-secondary/20 rounded-2xl p-5 border border-border/40 min-h-full">
                    <div className="space-y-2">
                      {workers?.length === 0 ? (
                        <div className="p-10 text-center border border-dashed border-border/60 rounded-xl text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30">
                          No EMPLOYEES detected. Build and verify EMPLOYEES first.
                        </div>
                      ) : (
                        workers?.map((worker: any) => (
                          <div 
                            key={worker.id} 
                            onClick={() => toggleWorker(worker.id)}
                            className={`p-4 border transition-all duration-200 rounded-xl cursor-pointer flex items-center gap-4 ${newManager.workerIds.includes(worker.id) ? 'bg-indigo-600 text-white border-transparent shadow-md' : 'bg-card hover:bg-secondary/80 border-border/40'}`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${newManager.workerIds.includes(worker.id) ? 'bg-white/10' : 'bg-secondary'}`}>
                              <Bot size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-bold uppercase tracking-tight truncate">{worker.name}</p>
                            </div>
                            {newManager.workerIds.includes(worker.id) && <Shield size={14} />}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-muted/30 border-t border-border/40 flex justify-end shrink-0">
               <Button
                onClick={handleCreate}
                disabled={isCreating}
                className="h-11 px-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all flex items-center gap-3"
               >
                 {isCreating ? <Activity size={16} className="animate-spin" /> : <Shield size={16} fill="white" />}
                 {isCreating ? 'Creating Manager...' : 'Create Manager Unit'}
               </Button>
            </div>
          </Card>
        </div>
      )}
    </SidebarLayout>
  );
}
