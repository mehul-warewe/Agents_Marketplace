import SidebarLayout from '@/components/SidebarLayout';
import { useManagers, useCreateManager, useDeleteManager } from '@/hooks/useManager';
import { useWorkers } from '@/hooks/useApi';
import { Bot, Plus, Clock, Terminal, Shield, Play, ChevronRight, Edit3, Trash2, Activity, Users, Target, Cpu, X, Sparkles, Network, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

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
      <div className="flex-1 text-foreground space-y-6 p-6 bg-secondary/5 h-full">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
             <div className="space-y-1">
                <div className="flex items-center gap-2 mb-2">
                   <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                      <Shield size={16} />
                   </div>
                   <span className="text-[10px] font-bold text-indigo-500/60 uppercase tracking-[0.3em]">Fleet Management</span>
                </div>
                <h1 className="text-4xl font-bold font-display tracking-tight text-foreground">
                  Manager Fleet
                </h1>
                <p className="text-muted-foreground font-medium text-[12px] max-w-xl leading-relaxed">
                   Designate autonomous orchestration units to coordinate complex operations across your workforce mesh.
                </p>
             </div>
             
             <Button
                onClick={() => router.push('/manager/builder')}
                className="h-11 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all gap-3"
             >
                <Plus size={16} strokeWidth={2.5} /> Deploy Manager
             </Button>
          </div>
 
          {/* Managers List */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-card/50 border border-border/40 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : !managers || managers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center px-10 border border-border border-dashed rounded-[2.5rem] bg-card/30 backdrop-blur-sm shadow-sm max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 border border-indigo-500/20 mb-8 shadow-inner">
                 <Users size={32} />
              </div>
              <h3 className="text-2xl font-bold font-display mb-3 text-foreground tracking-tight">Fleet Repository Empty</h3>
              <p className="text-muted-foreground mb-10 max-w-sm mx-auto text-[13px] font-medium leading-relaxed">
                No active orchestration units detected. Start by deploying a manager to coordinate your specialized employee fleet.
              </p>
              <Button
                onClick={() => router.push('/manager/builder')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest h-11 px-8 shadow-lg shadow-indigo-500/20"
              >
                Deploy First Manager
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {managers.map((manager: any) => (
                <div 
                  key={manager.id} 
                  className="group bg-card p-6 relative transition-all duration-500 rounded-3xl border border-border/40 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/5 hover:-translate-y-1 flex flex-col overflow-hidden cursor-pointer" 
                  onClick={() => router.push(`/manager/${manager.id}`)}
                >
                  {/* Decorative Gradient */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />

                  <div className="flex items-center justify-between shrink-0 mb-6 relative z-10">
                     <div className="w-11 h-11 rounded-2xl bg-secondary border border-border/40 flex items-center justify-center text-foreground group-hover:bg-indigo-600 group-hover:text-white group-hover:border-transparent transition-all duration-500 shadow-inner group-hover:rotate-3">
                        <Users size={20} />
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="px-2 py-0.5 rounded-md border border-indigo-500/20 bg-indigo-500/10 text-indigo-500 text-[9px] font-bold uppercase tracking-widest">
                           Manager Unit
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/manager/builder?id=${manager.id}`); }}
                          className="p-2 rounded-xl text-muted-foreground hover:bg-indigo-500/10 hover:text-indigo-500 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); if(confirm('Sync deletion of this manager unit?')) deleteManager(manager.id); }}
                          className="p-2 rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={15} />
                        </button>
                     </div>
                  </div>

                  <div className="space-y-2 mb-6 relative z-10">
                     <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold font-display tracking-tight text-foreground truncate group-hover:text-indigo-400 transition-colors">{manager.name}</h3>
                        <span className="text-[9px] px-2 py-0.5 bg-secondary border border-border/40 rounded font-mono text-muted-foreground uppercase">{manager.model.split('/').pop()}</span>
                     </div>
                     <p className="text-[12px] text-muted-foreground font-medium line-clamp-2 leading-relaxed">
                        {manager.goal || "Orchestrating strategic objectives for this operational node..."}
                     </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-8 relative z-10">
                     <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-[10px] font-bold text-indigo-400 shadow-xs uppercase tracking-tight">
                        <Network size={12} strokeWidth={2.5} /> {manager.workerIds?.length || 0} Workforce Operatives
                     </div>
                  </div>

                  <div className="pt-5 mt-auto border-t border-border/5 flex items-center justify-between relative z-10">
                     <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-foreground/20">
                        <Globe size={12} /> Registry Verified
                     </div>
                     <div className="flex items-center gap-1.5 text-indigo-500 font-bold text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                        Architect <ChevronRight size={14} strokeWidth={3} />
                     </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── CREATE MANAGER OVERLAY (REFINED) ─────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-card border border-border/40 w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-10 border-b border-border/40 flex justify-between items-center bg-card/50">
               <div className="space-y-1">
                  <div className="flex items-center gap-2">
                     <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                        <Sparkles size={16} />
                     </div>
                     <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Deployment Wizard</span>
                  </div>
                  <h2 className="text-3xl font-bold font-display text-foreground tracking-tight">Deploy Manager Unit</h2>
               </div>
               <button 
                onClick={() => setIsModalOpen(false)} 
                className="w-10 h-10 rounded-xl bg-secondary hover:bg-foreground hover:text-background transition-all border border-border/40 flex items-center justify-center shadow-sm"
               >
                 <X size={20} />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                
                {/* Configuration Left Col */}
                <div className="space-y-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">
                       Identifer
                    </label>
                    <input 
                      value={newManager.name}
                      onChange={e => setNewManager(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-secondary/50 border border-border/60 rounded-2xl px-6 py-5 outline-none focus:bg-background focus:border-indigo-500/40 transition-all font-bold text-xl tracking-tight shadow-inner"
                      placeholder="e.g. Strategic Operations AI"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">
                      Objective Statement (Goal)
                    </label>
                    <textarea 
                      value={newManager.goal}
                      onChange={e => setNewManager(prev => ({ ...prev, goal: e.target.value }))}
                      className="w-full bg-secondary/50 border border-border/60 rounded-2xl px-6 py-6 outline-none focus:bg-background focus:border-indigo-500/40 transition-all font-medium text-[13px] leading-relaxed shadow-inner min-h-[120px] resize-none"
                      placeholder="Specify the long-term objective for this unit..."
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">
                      Executive Directives (System Prompt)
                    </label>
                    <textarea
                      value={newManager.systemPrompt}
                      onChange={e => setNewManager(prev => ({ ...prev, systemPrompt: e.target.value }))}
                      className="w-full bg-secondary/50 border border-border/60 rounded-2xl px-6 py-6 outline-none focus:bg-background focus:border-indigo-500/40 transition-all font-mono text-[11px] leading-relaxed shadow-inner min-h-[160px] resize-none"
                      placeholder="Provide core instructions for orchestration..."
                    />
                  </div>
                </div>

                {/* Workforce Selection Right Col */}
                <div className="space-y-6">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">
                    Workforce Orchestration Fleet
                  </label>
                  <div className="bg-secondary/20 rounded-3xl p-6 border border-border/40 min-h-full">
                    <div className="space-y-3">
                      {workers?.length === 0 ? (
                        <div className="p-12 text-center border border-dashed border-border/60 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-muted-foreground/40">
                          No operatives detected. Build and verify operatives first.
                        </div>
                      ) : (
                        workers?.map((worker: any) => (
                          <div 
                            key={worker.id} 
                            onClick={() => toggleWorker(worker.id)}
                            className={`p-5 border transition-all duration-300 rounded-2xl cursor-pointer flex items-center gap-4 ${newManager.workerIds.includes(worker.id) ? 'bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-600/20' : 'bg-card hover:bg-secondary/80 border-border/40'}`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${newManager.workerIds.includes(worker.id) ? 'bg-white/10' : 'bg-secondary'}`}>
                              <Bot size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-bold uppercase tracking-tight truncate">{worker.name}</p>
                              <p className={`text-[9px] font-medium opacity-60 line-clamp-1 italic ${newManager.workerIds.includes(worker.id) ? 'text-indigo-100' : 'text-muted-foreground'}`}>
                                {worker.workerDescription || 'General Purpose Operative'}
                              </p>
                            </div>
                            {newManager.workerIds.includes(worker.id) && <Shield size={16} />}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-10 bg-secondary/20 border-t border-border/40 flex justify-end shrink-0">
               <Button
                onClick={handleCreate}
                disabled={isCreating}
                className="h-12 px-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all flex items-center gap-3"
               >
                 {isCreating ? <Activity size={16} className="animate-spin" /> : <Shield size={16} fill="white" />}
                 {isCreating ? 'Synchronizing Node...' : 'Deploy Manager Unit'}
               </Button>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}
