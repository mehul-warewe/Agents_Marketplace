'use client';

import SidebarLayout from '@/components/SidebarLayout';
import { useManagers, useCreateManager, useDeleteManager } from '@/hooks/useManager';
import { useWorkers } from '@/hooks/useApi';
import { Bot, Plus, Clock, Terminal, Shield, Play, ChevronRight, Edit3, Trash2, Activity, Users, Target, Cpu, X, Sparkles, Network } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
      <div className="flex-1 bg-secondary min-h-full text-foreground p-6 sm:p-10 lg:p-14 overflow-y-auto w-full no-scrollbar">
        <div className="max-w-[1400px] mx-auto space-y-12">
          
          {/* Page Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold font-display tracking-tight leading-none text-foreground">Operational Managers</h1>
              <p className="text-muted-foreground font-medium text-sm max-w-xl">
                 Orchestrate high-level autonomous managers to synthesize complex parameters with your employee fleet.
              </p>
            </div>
            <button
              onClick={() => router.push('/manager/builder')}
              className="bg-primary text-primary-foreground hover:opacity-90 px-8 py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.98]"
            >
              <Plus size={18} strokeWidth={2.5} /> Create Manager
            </button>
          </header>

          {/* Managers List */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 3xl:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-[400px] bg-card/60 border border-border rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : !managers || managers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center border border-border/40 bg-card rounded-3xl shadow-md overflow-hidden relative">
              <div className="w-20 h-20 bg-secondary rounded-2xl flex items-center justify-center text-muted-foreground/20 mb-8 border border-border/20 relative z-10 shadow-sm">
                <Users size={32} strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-bold font-display text-foreground mb-3 relative z-10">Deploy your first manager</h3>
              <p className="text-muted-foreground font-medium text-sm mb-10 max-w-xs mx-auto relative z-10">No managers found in your current fleet instance.</p>
              <button
                onClick={() => router.push('/manager/builder')}
                className="bg-primary text-primary-foreground px-8 py-3.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all relative z-10 shadow-lg shadow-primary/20"
              >
                Create Manager
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 3xl:grid-cols-3 gap-8">
              {managers.map((manager: any) => (
                <div 
                  key={manager.id} 
                  className="bg-card p-10 group relative transition-all duration-300 rounded-2xl border border-border/40 shadow-md hover:shadow-xl hover:border-primary/20 flex flex-col overflow-hidden cursor-pointer" 
                  onClick={() => router.push(`/manager/${manager.id}`)}
                >
                  {/* Status Badges */}
                  <div className="flex items-center justify-between mb-10 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-border/40 bg-secondary text-muted-foreground text-[10px] font-bold uppercase tracking-wider shadow-sm">
                        <Users size={12} strokeWidth={2.5} />
                        Manager
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-border/40 bg-secondary text-muted-foreground text-[10px] font-bold uppercase tracking-wider shadow-sm">
                        <Cpu size={12} strokeWidth={2.5} />
                        {manager.workerIds?.length || 0} Fleet
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/manager/builder?id=${manager.id}`); }}
                        className="w-10 h-10 bg-secondary rounded-xl border border-border/40 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-center"
                        title="Edit Strategy"
                      >
                        <Edit3 size={18} strokeWidth={2} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); if(confirm('Delete this manager?')) deleteManager(manager.id); }}
                        className="w-10 h-10 bg-red-500/5 rounded-xl border border-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                        title="Delete Manager"
                      >
                        <Trash2 size={18} strokeWidth={2} />
                      </button>
                    </div>
                  </div>

                  {/* Header */}
                  <div className="flex items-start gap-6 mb-10 relative z-10">
                    <div className="w-16 h-16 rounded-xl border border-border/40 bg-secondary flex items-center justify-center text-foreground shrink-0 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300 shadow-sm overflow-hidden p-3.5">
                      <Users size={32} strokeWidth={2} />
                    </div>
                    <div className="min-w-0 pt-1 text-left">
                       <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mb-1 block">Operational Identity</span>
                      <h3 className="text-2xl font-bold font-display tracking-tight text-foreground leading-tight truncate mb-2">{manager.name}</h3>
                      <p className="text-sm text-muted-foreground font-medium leading-relaxed line-clamp-2">
                        {manager.goal || "Synthesizing strategic objectives for this operational node..."}
                      </p>
                    </div>
                  </div>

                  {/* Footer Info */}
                  <div className="mt-auto space-y-6 pt-10 relative z-10 border-t border-border/40">
                    <div className="flex items-center justify-between p-4 bg-secondary/60 rounded-xl group-hover:bg-secondary transition-colors">
                      <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                        <Network size={14} /> Fleet Size
                      </div>
                      <div className="text-xs font-bold text-foreground">{manager.workerIds?.length || 0} Specialized Units</div>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Clock size={14} strokeWidth={2.5} />
                        Updated {new Date(manager.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-primary font-bold bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10">
                        {manager.model.split('/').pop().toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── CREATE MANAGER MODAL ─────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-card border border-border/60 w-full max-w-4xl rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden animate-in fade-in zoom-in-95 duration-500 max-h-[90vh] flex flex-col">
            <div className="p-16 space-y-16 overflow-y-auto no-scrollbar">
              <header className="flex justify-between items-start border-b border-border/40 pb-12 shrink-0">
                <div className="space-y-6">
                   <div className="flex items-center gap-4">
                      <Sparkles size={16} fill="currentColor" className="text-primary" />
                      <span className="text-[10px] font-black text-muted uppercase tracking-[0.4em] opacity-40">MANAGER_SETUP</span>
                   </div>
                  <h2 className="text-5xl font-black tracking-tighter uppercase italic leading-none text-foreground">Create_Manager</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-14 h-14 bg-foreground/5 rounded-2xl hover:bg-foreground hover:text-background transition-all border border-border/40 flex items-center justify-center">
                  <X size={24} strokeWidth={3} />
                </button>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                <div className="space-y-12">
                  <div className="space-y-6">
                    <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] px-4 opacity-50 italic flex items-center gap-3">
                       Manager_Name
                    </label>
                    <input 
                      value={newManager.name}
                      onChange={e => setNewManager(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-foreground/[0.03] border border-border/60 rounded-[2rem] px-10 py-8 outline-none focus:bg-background focus:border-primary/40 transition-all font-black text-2xl tracking-tighter italic shadow-inner"
                      placeholder="e.g. OPERATIONS_GENERAL_V1"
                    />
                  </div>

                  <div className="space-y-6">
                    <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] px-4 opacity-50 italic flex items-center gap-3">
                      Mission_Objective (Goal)
                    </label>
                    <textarea 
                      value={newManager.goal}
                      onChange={e => setNewManager(prev => ({ ...prev, goal: e.target.value }))}
                      className="w-full bg-foreground/[0.03] border border-border/60 rounded-[2.5rem] px-10 py-10 outline-none focus:bg-background focus:border-primary/40 transition-all font-bold text-lg tracking-tight italic shadow-inner min-h-[140px] resize-none"
                      placeholder="Specify the long-term goal for this manager agent..."
                    />
                  </div>

                  <div className="space-y-6">
                    <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] px-4 opacity-50 italic flex items-center gap-3">
                      Core_Instructions (System Prompt)
                    </label>
                    <textarea
                      value={newManager.systemPrompt}
                      onChange={e => setNewManager(prev => ({ ...prev, systemPrompt: e.target.value }))}
                      className="w-full bg-foreground/[0.03] border border-border/60 rounded-[2.5rem] px-10 py-10 outline-none focus:bg-background focus:border-primary/40 transition-all font-mono text-xs shadow-inner min-h-[180px] resize-none"
                      placeholder="You are an autonomous operations manager. Your job is to delegate tasks to your specialized employee fleet..."
                    />
                  </div>
                </div>

                <div className="space-y-12 bg-foreground/[0.01] p-10 rounded-[3rem] border border-border/40">
                  <div className="space-y-6">
                    <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] px-4 opacity-50 italic flex items-center gap-3">
                      Authorized_Employee_Fleet
                    </label>
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 no-scrollbar">
                      {workers?.length === 0 ? (
                        <div className="p-10 text-center border border-dashed border-border/60 rounded-3xl text-[10px] font-black uppercase tracking-widest opacity-40">
                          No Employees Found. Build and promote employees first.
                        </div>
                      ) : (
                        workers?.map((worker: any) => (
                          <div 
                            key={worker.id} 
                            onClick={() => toggleWorker(worker.id)}
                            className={`p-6 border transition-all duration-300 rounded-3xl cursor-pointer flex items-center gap-6 ${newManager.workerIds.includes(worker.id) ? 'bg-primary text-primary-foreground border-primary shadow-[0_15px_30px_-10px_rgba(var(--primary-rgb),0.3)]' : 'bg-background hover:bg-foreground/5 border-border/40'}`}
                          >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${newManager.workerIds.includes(worker.id) ? 'bg-background/20' : 'bg-foreground/5'}`}>
                              <Bot size={20} strokeWidth={2} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-black uppercase tracking-tighter truncate">{worker.name}</p>
                              <p className={`text-[9px] font-bold uppercase tracking-tight opacity-50 line-clamp-1 italic ${newManager.workerIds.includes(worker.id) ? 'text-primary-foreground' : 'text-muted'}`}>
                                {worker.workerDescription || 'No cap description'}
                              </p>
                            </div>
                            {newManager.workerIds.includes(worker.id) && <Shield size={16} fill="currentColor" />}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <footer className="pt-12 flex flex-col gap-6 border-t border-border/40 shrink-0">
                <button
                  onClick={handleCreate}
                  disabled={isCreating}
                  className="w-full bg-primary text-primary-foreground py-10 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-6 shadow-2xl shadow-primary/20"
                >
                  {isCreating ? 'CREATING_MANAGER...' : 'INITIALIZE_MANAGER'}
                  <ChevronRight size={24} strokeWidth={3} />
                </button>
              </footer>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}
