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
      <div className="flex-1 bg-background min-h-full text-foreground p-6 sm:p-10 lg:p-14 overflow-y-auto w-full no-scrollbar font-inter">
        <div className="max-w-[1400px] mx-auto space-y-16">
          
          {/* Page Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-border/60 pb-16">
            <div className="space-y-6">
              <div className="flex flex-col gap-4">
                <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none">Managers</h1>
                <div className="w-fit bg-foreground/5 text-foreground text-[10px] font-black px-5 py-2 uppercase tracking-[0.3em] border border-border/50 rounded-full">
                  Count: {managers?.length || 0}/Unlimited
                </div>
              </div>
              <p className="text-muted font-bold text-lg leading-tight uppercase opacity-40 max-w-xl">Orchestrate high-level autonomous managers to synthesize complex mission parameters with your employee fleet.</p>
            </div>
            <button
              onClick={() => router.push('/manager/builder')}
              className="bg-foreground text-background hover:scale-[1.02] px-14 py-5 rounded-[1.75rem] font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-2xl shadow-foreground/10 active:scale-[0.98]"
            >
              <Plus size={18} strokeWidth={3} /> CREATE_MANAGER
            </button>
          </header>

          {/* Managers List */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-40 text-muted">
              <div className="w-10 h-10 border border-accent border-t-transparent animate-spin mb-6"></div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Loading...</p>
            </div>
          ) : !managers || managers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-40 text-center border border-border/60 bg-card rounded-[3rem] shadow-2xl shadow-foreground/5 overflow-hidden relative">
              <div className="absolute inset-0 bg-foreground/[0.01] pointer-events-none" />
              <div className="w-24 h-24 bg-foreground/5 rounded-[2.5rem] flex items-center justify-center text-muted mb-12 border border-border/50 relative z-10 text-accent">
                <Users size={40} strokeWidth={1} />
              </div>
              <h3 className="text-3xl font-black mb-4 uppercase tracking-tighter italic relative z-10">No managers</h3>
              <p className="text-muted font-bold mb-12 max-w-sm mx-auto leading-tight uppercase opacity-40 relative z-10">No managers found. Create your first Manager to orchestrate your employee fleet.</p>
              <button
                onClick={() => router.push('/manager/builder')}
                className="bg-foreground text-background px-14 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:scale-[1.05] transition-all relative z-10 shadow-xl"
              >
                Create_Manager
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 3xl:grid-cols-3 gap-12">
              {managers.map((manager: any) => (
                <div key={manager.id} className="bg-card p-12 group relative transition-all duration-500 rounded-[3.5rem] border border-border/60 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] hover:border-foreground/20 hover:shadow-2xl hover:shadow-foreground/5 flex flex-col overflow-hidden cursor-pointer" onClick={() => router.push(`/manager/${manager.id}`)}>
                  <div className="absolute top-0 right-0 w-48 h-48 bg-foreground/[0.02] rounded-full -mr-24 -mt-24 group-hover:scale-150 transition-transform duration-1000" />
                  
                  {/* Status Badges */}
                  <div className="flex items-center justify-between mb-12 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2.5 px-5 py-2 rounded-full border border-border/60 bg-foreground/[0.03] text-muted text-[9px] font-black uppercase tracking-[0.2em] shadow-inner">
                        <Users size={12} strokeWidth={3} />
                        MANAGER
                      </div>
                      <div className="flex items-center gap-2.5 px-5 py-2 rounded-full border border-border/60 bg-foreground/[0.03] text-muted text-[9px] font-black uppercase tracking-[0.2em] shadow-inner">
                        <Cpu size={12} strokeWidth={3} />
                        {manager.workerIds?.length || 0} EMPLOYEES
                      </div>
                    </div>

                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/manager/builder?id=${manager.id}`); }}
                        className="w-12 h-12 bg-foreground/5 rounded-2xl border border-border/40 text-muted hover:bg-foreground hover:text-background transition-all flex items-center justify-center shadow-lg shadow-foreground/5"
                        title="Edit Strategy"
                      >
                        <Edit3 size={18} strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); if(confirm('Delete this manager?')) deleteManager(manager.id); }}
                        className="w-12 h-12 bg-red-500/5 rounded-2xl border border-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-lg shadow-red-500/5"
                        title="Delete Manager"
                      >
                        <Trash2 size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>

                  {/* Header */}
                  <div className="flex items-start gap-10 mb-12 relative z-10">
                    <div className="w-20 h-20 rounded-[1.75rem] border border-border/60 bg-foreground/[0.03] flex items-center justify-center text-foreground shrink-0 group-hover:bg-foreground group-hover:text-background transition-all duration-700 shadow-inner group-hover:shadow-2xl group-hover:scale-105">
                      <Users size={36} strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0 pt-2 text-left">
                       <span className="text-[9px] font-black text-muted uppercase tracking-[0.4em] mb-2 block opacity-30 italic">Manager ID</span>
                      <h3 className="text-3xl font-black tracking-tighter uppercase italic leading-none truncate mb-4">{manager.name}</h3>
                      <p className="text-[12px] text-muted font-bold uppercase tracking-tight opacity-50 leading-tight line-clamp-2 italic">
                        {manager.goal || "No strategic standing objective currently synthesized for this node."}
                      </p>
                    </div>
                  </div>

                  {/* Strategy Info */}
                  <div className="mt-auto space-y-6 pt-12 relative z-10 border-t border-border/40">
                    <div className="flex items-center justify-between p-6 bg-foreground/[0.02] border border-border/40 rounded-3xl group-hover:bg-background transition-colors duration-500">
                      <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-muted opacity-60">
                        <Network size={16} /> Employee Fleet
                      </div>
                      <div className="text-xs font-black italic">{manager.workerIds?.length || 0} Employees</div>
                    </div>
                    
                    <button 
                      className="w-full py-8 bg-foreground text-background rounded-3xl font-black text-[10px] uppercase tracking-[0.4em] shadow-xl shadow-foreground/10 hover:scale-[1.02] transition-all flex items-center justify-center gap-4"
                    >
                      Open manager <ChevronRight size={14} strokeWidth={3} />
                    </button>
                  </div>

                  {/* Footer Metadata */}
                  <div className="mt-10 flex items-center justify-between text-[10px] font-black text-muted uppercase tracking-[0.2em] opacity-30 italic">
                    <div className="flex items-center gap-3">
                      <Clock size={16} strokeWidth={3} />
                      INITIATED::{new Date(manager.createdAt).toLocaleDateString().replace(/\//g, '-')}
                    </div>
                    <div className="text-foreground font-black bg-foreground/10 px-4 py-1.5 rounded-full not-italic tracking-[0.1em]">
                      MODEL::{manager.model.split('/').pop().toUpperCase()}
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
