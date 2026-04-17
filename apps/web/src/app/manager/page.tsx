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
      <div className="flex-1 text-foreground space-y-3 p-2 lg:p-4 bg-secondary/5">
        <div className="space-y-4">
          
          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 px-1">
             <div className="space-y-1">
                <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight text-foreground">
                  Manager Fleet
                </h1>
                <p className="text-muted-foreground font-medium text-[11px] max-w-md">
                   Designate autonomous orchestration units to coordinate complex operations across your workforce.
                </p>
             </div>
             
             <button
                onClick={() => router.push('/manager/builder')}
                className="h-9 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 border-none transition-all flex items-center gap-2"
             >
                <Plus size={14} strokeWidth={2.5} /> Deploy Manager
             </button>
          </div>
 
          {/* Managers List */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !managers || managers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-10 border border-border border-dashed rounded-2xl mx-2 bg-card shadow-sm">
              <div className="w-14 h-14 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500 border border-indigo-500/20 mb-6">
                 <Users size={28} />
              </div>
              <h3 className="text-lg font-bold font-display mb-1 uppercase tracking-tight">Fleet Empty</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto text-[11px] font-medium leading-relaxed">
                No orchestration units detected. Start by deploying a manager to coordinate your specialized agents.
              </p>
              <button
                onClick={() => router.push('/manager/builder')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest h-9 px-6 transition-all shadow-lg shadow-indigo-500/20 border-none"
              >
                Deploy First Manager
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-2">
              {managers.map((manager: any) => (
                <div 
                  key={manager.id} 
                  className="bg-card p-4 group relative transition-all duration-300 rounded-2xl border border-border/40 shadow-md hover:shadow-xl hover:-translate-y-1 flex flex-col overflow-hidden cursor-pointer" 
                  onClick={() => router.push(`/manager/${manager.id}`)}
                >
                  <div className="flex items-center justify-between shrink-0 mb-4">
                     <div className="w-9 h-9 rounded-xl bg-secondary border border-border/60 flex items-center justify-center text-foreground group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                        <Users size={16} />
                     </div>
                     <div className="flex items-center gap-1.5 transition-all">
                        <div className="px-2 py-0.5 rounded-md border border-indigo-500/20 bg-indigo-500/10 text-indigo-500 text-[8px] font-bold uppercase shadow-xs tracking-widest">
                           Manager
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/manager/builder?id=${manager.id}`); }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-indigo-500/10 hover:text-indigo-500 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); if(confirm('Purge this manager unit?')) deleteManager(manager.id); }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                     </div>
                  </div>

                  <div className="space-y-1 min-h-[60px] mb-4">
                     <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold font-display tracking-tight text-foreground truncate">{manager.name}</h3>
                        <span className="text-[8px] px-1.5 py-0.5 bg-secondary rounded font-mono text-muted-foreground uppercase">{manager.model.split('/').pop()}</span>
                     </div>
                     <p className="text-[10px] text-muted-foreground font-medium line-clamp-2 leading-relaxed">
                        {manager.goal || "Orchestrating strategic objectives for this operational node..."}
                     </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                     <div className="flex items-center gap-2 px-2 py-1 bg-secondary/80 border border-border/60 rounded-md text-[9px] font-bold text-foreground/50 shadow-xs uppercase tracking-tighter">
                        <Network size={10} className="text-indigo-500" /> {manager.workerIds?.length || 0} Workforce Fleet
                     </div>
                  </div>

                  <div className="pt-3 mt-auto border-t border-border/5 flex items-center justify-between">
                     <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-foreground/40">
                        <span>Updated {new Date(manager.createdAt).toLocaleDateString()}</span>
                     </div>
                     <div className="flex items-center gap-1 text-indigo-500 font-bold text-[9px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                        Orchestrate <ChevronRight size={12} strokeWidth={3} />
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
