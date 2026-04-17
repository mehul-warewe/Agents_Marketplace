'use client';

import SidebarLayout from '@/components/SidebarLayout';
import { useManager, useUpdateManager, useManagerStream } from '@/hooks/useManager';
import { useWorkers } from '@/hooks/useApi';
import { MODEL_TYPES } from '@/components/builder/toolRegistry';
import { Bot, Play, ChevronRight, Edit3, Activity, Users, Target, Cpu, X, Sparkles, Network, Save, MessageSquare, List, Settings, Send, Terminal, Loader2, Zap, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function ManagerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: manager, isLoading } = useManager(id as string);
  const { data: workerFleet } = useWorkers();
  const { mutate: updateManager, isPending: isUpdating } = useUpdateManager();
  const stream = useManagerStream(id as string);

  const [activeTab, setActiveTab] = useState<'chat' | 'config' | 'employees' | 'history'>('chat');
  const [formData, setFormData] = useState<any>(null);
  const [chatInput, setChatInput] = useState('');
  const [runHistory, setRunHistory] = useState<any[]>([]);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  useEffect(() => {
    if (manager) {
      setFormData({
        name: manager.name,
        description: manager.description || '',
        goal: manager.goal || '',
        systemPrompt: manager.systemPrompt || '',
        model: manager.model,
        workerIds: manager.workerIds || []
      });
    }
  }, [manager]);

  // Load run history
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetch(`/managers/${id}/runs`);
        if (response.ok) {
          const data = await response.json();
          setRunHistory(data);
        }
      } catch (err) {
        console.error('Failed to load run history:', err);
      }
    };
    if (id) loadHistory();
  }, [id]);

  const handleSave = () => {
    updateManager({ id: id as string, data: formData });
  };

  const handleStartRun = () => {
     if (!chatInput.trim()) return;
     stream.startRun(chatInput);
     setChatInput('');
  };

  if (isLoading || !formData) {
    return (
      <SidebarLayout title="STRATEGIC_CORE // LOADING...">
         <div className="flex flex-col items-center justify-center py-40 h-full">
            <div className="w-10 h-10 border border-accent border-t-transparent animate-spin mb-6"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Uplink_Pending</p>
         </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title={`COMMAND_DECK // ${manager?.name}`}>
      <div className="flex flex-col h-full bg-background overflow-hidden">
        
        {/* Navigation Bar */}
        <header className="h-11 bg-card border-b border-border flex items-center justify-between px-4 shrink-0 z-50">
          <div className="flex items-center gap-4">
             <button onClick={() => router.push('/manager')} className="p-1 px-2.5 bg-foreground/5 rounded-lg hover:bg-foreground/10 transition-all text-foreground/40 hover:text-foreground border border-border/10">
                <ChevronRight size={14} strokeWidth={3} className="rotate-180" />
             </button>
             <div className="flex items-center gap-2.5">
                <div className="size-7 rounded-lg bg-indigo-600/10 text-indigo-600 flex items-center justify-center border border-indigo-600/20">
                   <Users size={14} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                   <span className="text-[7px] font-bold uppercase tracking-widest text-foreground/30 leading-none">Command</span>
                   <h1 className="text-[11px] font-bold tracking-tight text-foreground leading-none">{manager?.name}</h1>
                </div>
                <div className={`px-2 py-0.5 rounded-md border text-[7px] font-bold uppercase tracking-wider ${stream.status === 'running' ? 'animate-pulse bg-indigo-500/10 border-indigo-500/20 text-indigo-500' : 'bg-foreground/5 border-border/10 text-muted'}`}>
                  {stream.status === 'running' ? 'Active' : 'Idle'}
                </div>
             </div>
          </div>

          <nav className="flex items-center bg-secondary/50 rounded-lg p-0.5 border border-border/10 relative">
             {[
               { id: 'chat', label: 'Command', icon: MessageSquare },
               { id: 'config', label: 'Strategy', icon: Settings },
               { id: 'employees', label: 'Fleet', icon: Cpu },
               { id: 'history', label: 'History', icon: List }
             ].map(t => (
               <button
                 key={t.id}
                 onClick={() => setActiveTab(t.id as any)}
                 className={`relative px-4 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 z-10 ${activeTab === t.id ? 'text-indigo-500' : 'text-foreground/30 hover:text-foreground/50'}`}
               >
                 {activeTab === t.id && (
                   <motion.div 
                     layoutId="managerDetailTab"
                     className="absolute inset-0 bg-card rounded-lg shadow-sm border border-border/5"
                     transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                   />
                 )}
                 <t.icon size={11} strokeWidth={activeTab === t.id ? 2.5 : 2} className="relative z-20" />
                 <span className="relative z-20">{t.label}</span>
               </button>
             ))}
          </nav>

          <div className="flex items-center gap-2">
             <button
                onClick={handleSave}
                disabled={isUpdating}
                className="h-7 px-3 bg-indigo-600 text-white rounded-lg text-[8px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-1.5 border-none"
             >
                {isUpdating ? 'Saving...' : 'Sync'} 
                <Save size={10} strokeWidth={2.5} />
             </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative flex">
          
          {/* TAB: COMMAND_INPUT (Chat) */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col h-full">
              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-8 no-scrollbar">
                {stream.status === 'idle' && stream.steps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full opacity-30 text-center">
                    <Terminal size={60} strokeWidth={1} className="mb-8" />
                    <h3 className="text-2xl font-black uppercase tracking-[0.2em] mb-4 italic">Awaiting_Input</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] max-w-xs">Initialize a mission protocol via the command input below.</p>
                  </div>
                ) : (
                  <div className="space-y-10 max-w-5xl mx-auto w-full">
                     {stream.status !== 'idle' && (
                        <>
                           {/* User Message */}
                           <div className="flex items-start gap-8 flex-row-reverse">
                              <div className="w-12 h-12 bg-accent rounded-2xl border border-accent/20 flex items-center justify-center text-accent-foreground shrink-0 shadow-xl shadow-accent/20">
                                 <Target size={20} strokeWidth={3} />
                              </div>
                              <div className="bg-card border border-border/60 p-8 rounded-[2rem] rounded-tr-none shadow-xl max-w-2xl text-lg font-bold italic tracking-tight uppercase opacity-80">
                                 {/* Find the init step to get the input or display from manager */}
                                 {stream.steps[0]?.type === 'init' ? manager?.name || 'Mission Initialized' : 'Processing Input...'}
                              </div>
                           </div>

                           {/* Manager Thinking Steps */}
                           {stream.steps?.map((step: any, idx: number) => {
                              if (step.type === 'init') return null;
                              if (step.type === 'worker_called') {
                                 const calledWorker = workerFleet?.find((w: any) => w.id === step.workerId);
                                 const displayName = calledWorker?.name ?? step.workerId ?? 'Employee';
                                 return (
                                    <div key={idx} className="flex items-center gap-8 text-accent">
                                       <div className="w-12 h-12 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center shrink-0">
                                          <Loader2 size={18} className="animate-spin" />
                                       </div>
                                       <div className="flex flex-col gap-1">
                                          <span className="text-[11px] font-black uppercase tracking-[0.5em] italic">Delegating_To_Employee</span>
                                          <span className="text-[13px] font-black text-accent uppercase tracking-tight">{displayName}</span>
                                       </div>
                                    </div>
                                 );
                              }
                              return (
                                 <div key={idx} className="flex items-start gap-8">
                                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-xl ${step.type === 'final' ? 'bg-foreground text-background border-foreground' : 'bg-foreground/5 border-border/40 text-accent'}`}>
                                       {step.type === 'final' ? <CheckCircle2 size={24} strokeWidth={2.5} /> : <Activity size={24} strokeWidth={2.5} className="animate-pulse" />}
                                    </div>
                                    <div className="flex-1 space-y-6">
                                       <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] opacity-40 italic">
                                          <span>REASONING_STEP_{idx + 1}</span>
                                          <ChevronRight size={10} />
                                          <span>{step.action || 'THINKING'}</span>
                                       </div>
                                       <div className={`bg-card border p-10 rounded-[2.5rem] rounded-tl-none shadow-2xl relative overflow-hidden transition-all ${step.type === 'final' ? 'border-foreground shadow-foreground/5' : 'border-border/60'}`}>
                                          {step.tool && (
                                             <div className="mb-6 flex items-center gap-4 py-3 px-6 bg-accent/5 border border-accent/20 rounded-full w-fit">
                                                <Zap size={14} className="text-accent" fill="currentColor" />
                                                <span className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">
                                                   {step.tool === 'call_worker' ? 'DELEGATING_TO_EMPLOYEE' : step.tool.toUpperCase()}
                                                </span>
                                             </div>
                                          )}
                                          <div className={`text-lg font-bold leading-relaxed italic ${step.type === 'final' ? 'text-foreground' : 'text-muted'}`}>
                                             {step.thought || step.output || 'Processing internal logic chain...'}
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                              );
                           })}

                           {stream.status === 'running' && (
                              <div className="flex items-center gap-8 animate-pulse text-accent">
                                 <div className="w-12 h-12 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center shrink-0">
                                    <Loader2 size={18} className="animate-spin" />
                                 </div>
                                 <span className="text-[11px] font-black uppercase tracking-[0.5em] italic">Synthesizing_Core_Logic...</span>
                              </div>
                           )}
                        </>
                     )}
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-10 border-t border-border/40 shrink-0">
                <div className="max-w-5xl mx-auto relative group">
                  <div className="absolute inset-0 bg-accent/5 rounded-[3rem] blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <div className="relative flex items-center gap-6 p-4 bg-foreground/[0.03] border border-border/60 rounded-[3rem] focus-within:bg-background focus-within:border-accent transition-all shadow-xl shadow-foreground/5">
                    <div className="w-12 h-12 bg-background border border-border/40 rounded-full shrink-0 flex items-center justify-center text-muted group-focus-within:text-accent transition-colors">
                      <Terminal size={20} strokeWidth={3} />
                    </div>
                    <input 
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleStartRun()}
                      className="flex-1 bg-transparent border-none outline-none font-black text-lg p-4 placeholder:opacity-30 uppercase tracking-tight italic"
                      placeholder="INITIATE_MISSION_PROTOCOL..."
                    />
                    <button
                      onClick={handleStartRun}
                      disabled={stream.status === 'running' || !chatInput.trim()}
                      className="w-16 h-16 bg-foreground text-background rounded-full hover:scale-110 active:scale-95 transition-all flex items-center justify-center disabled:opacity-30 disabled:scale-100 shadow-2xl shadow-foreground/20"
                    >
                      {stream.status === 'running' ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} strokeWidth={3} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: STRATEGY_PARAMS (Config) */}
          {activeTab === 'config' && (
            <div className="flex-1 overflow-y-auto no-scrollbar p-6">
               <div className="max-w-4xl mx-auto space-y-20">
                  <header>
                     <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-2">Core_Strategy_Protocol</h2>
                     <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-30 italic">Logical_Reconfiguration_Matrix</p>
                  </header>

                  <div className="grid grid-cols-1 gap-16">
                     <div className="space-y-6">
                        <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] px-4 opacity-50 italic">
                           Registry_Name
                        </label>
                        <input
                           value={formData.name}
                           onChange={e => setFormData({ ...formData, name: e.target.value })}
                           className="w-full bg-foreground/[0.03] border border-border/60 rounded-[2rem] px-10 py-8 outline-none focus:bg-background focus:border-foreground transition-all font-black text-2xl tracking-tighter italic shadow-inner"
                        />
                     </div>

                     <div className="space-y-6">
                        <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] px-4 opacity-50 italic">
                           LLM_Model
                        </label>
                        <select
                           value={formData.model || ''}
                           onChange={e => setFormData({ ...formData, model: e.target.value })}
                           className="w-full bg-foreground/[0.03] border border-border/60 rounded-[2rem] px-10 py-8 outline-none focus:bg-background focus:border-foreground transition-all font-black text-base tracking-tighter italic shadow-inner"
                        >
                           <option value="">Select a model...</option>
                           {MODEL_TYPES.map(model => (
                              <option key={model.id} value={model.id}>
                                 {model.label} ({model.provider})
                              </option>
                           ))}
                        </select>
                     </div>

                     <div className="space-y-6">
                        <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] px-4 opacity-50 italic">
                           Mission_Standing_Objective
                        </label>
                        <textarea 
                           value={formData.goal}
                           onChange={e => setFormData({ ...formData, goal: e.target.value })}
                           className="w-full bg-foreground/[0.03] border border-border/60 rounded-[2.5rem] px-10 py-10 outline-none focus:bg-background focus:border-foreground transition-all font-bold text-lg tracking-tight italic shadow-inner min-h-[140px] resize-none"
                        />
                     </div>

                     <div className="space-y-6">
                        <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] px-4 opacity-50 italic">
                           Behavioral_Constraints (System Prompt)
                        </label>
                        <textarea 
                           value={formData.systemPrompt}
                           onChange={e => setFormData({ ...formData, systemPrompt: e.target.value })}
                           className="w-full bg-foreground/[0.03] border border-border/60 rounded-[2.5rem] px-10 py-10 outline-none focus:bg-background focus:border-foreground transition-all font-mono text-xs shadow-inner min-h-[250px] resize-none"
                        />
                     </div>
                  </div>

                  <button 
                     onClick={handleSave}
                     disabled={isUpdating}
                     className="bg-accent text-accent-foreground px-20 py-8 rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] flex items-center justify-center gap-6 shadow-2xl shadow-accent/20 hover:scale-[1.05] transition-all"
                  >
                     {isUpdating ? 'SYNCHRONIZING...' : 'COMMIT_RECONFIGURATION'} <Save size={18} strokeWidth={3} />
                  </button>
               </div>
            </div>
          )}

          {/* TAB: EMPLOYEES (Employee Fleet Selector) */}
          {activeTab === 'employees' && (
            <div className="flex-1 overflow-y-auto no-scrollbar p-6">
               <div className="max-w-4xl mx-auto space-y-20">
                  <header>
                     <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-2">Employee_Fleet_Assignment</h2>
                     <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-30 italic">Active_Employees: {formData.workerIds.length}</p>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {workerFleet?.map((worker: any) => {
                        const isSelected = formData.workerIds.includes(worker.id);
                        return (
                           <div 
                              key={worker.id}
                              onClick={() => {
                                 setFormData({
                                    ...formData,
                                    workerIds: isSelected 
                                       ? formData.workerIds.filter((id: any) => id !== worker.id)
                                       : [...formData.workerIds, worker.id]
                                 });
                              }}
                              className={`p-10 border transition-all duration-500 rounded-[3rem] cursor-pointer relative overflow-hidden flex flex-col items-center text-center gap-6 ${isSelected ? 'bg-foreground text-background border-foreground shadow-2xl' : 'bg-card border-border/60 hover:border-foreground/20'}`}
                           >
                              <div className={`w-20 h-20 rounded-[1.75rem] border flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:scale-110 ${isSelected ? 'bg-background/20 border-background/20' : 'bg-foreground/5 border-border/40'}`}>
                                 <Bot size={32} strokeWidth={2} />
                              </div>
                              <div>
                                 <h3 className="text-xl font-black uppercase tracking-tighter italic mb-3">{worker.name}</h3>
                                 <p className={`text-[10px] font-black opacity-50 italic uppercase tracking-widest ${isSelected ? 'text-background' : 'text-muted'}`}>
                                    {worker.workerDescription || 'No description found'}
                                 </p>
                              </div>
                              {isSelected && (
                                 <div className="absolute top-8 right-8 text-accent animate-in fade-in zoom-in duration-500">
                                    <Shield size={24} fill="currentColor" strokeWidth={0} />
                                 </div>
                              )}
                           </div>
                        );
                     })}
                  </div>

                  <button
                     onClick={handleSave}
                     disabled={isUpdating}
                     className="bg-accent text-accent-foreground px-20 py-8 rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] flex items-center justify-center gap-6 shadow-2xl shadow-accent/20 hover:scale-[1.05] transition-all"
                  >
                     {isUpdating ? 'UPDATING_ASSIGNMENTS...' : 'ASSIGN_EMPLOYEES'} <Save size={18} strokeWidth={3} />
                  </button>
               </div>
            </div>
          )}

          {/* TAB: HISTORY (Past Runs) */}
          {activeTab === 'history' && (
            <div className="flex-1 overflow-y-auto no-scrollbar p-6">
               <div className="max-w-4xl mx-auto space-y-20">
                  <header>
                     <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-2">Execution_History</h2>
                     <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-30 italic">Past_Runs: {runHistory.length}</p>
                  </header>

                  {runHistory.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-20 text-center border border-border/60 bg-card rounded-[3rem] shadow-2xl shadow-foreground/5 overflow-hidden relative">
                        <div className="absolute inset-0 bg-foreground/[0.01] pointer-events-none" />
                        <div className="w-20 h-20 bg-foreground/5 rounded-[2rem] flex items-center justify-center text-muted mb-8 border border-border/50 relative z-10">
                           <List size={32} strokeWidth={1} />
                        </div>
                        <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter italic relative z-10">No_History</h3>
                        <p className="text-muted font-bold max-w-sm mx-auto leading-tight uppercase opacity-40 relative z-10">Execute a mission to see run history here.</p>
                     </div>
                  ) : (
                     <div className="space-y-6">
                        {runHistory.map((run: any) => (
                           <div
                              key={run.id}
                              className="p-8 border border-border/60 bg-card rounded-[2rem] cursor-pointer hover:border-foreground/40 transition-all"
                              onClick={() => setExpandedHistoryId(expandedHistoryId === run.id ? null : run.id)}
                           >
                              <div className="flex items-start justify-between gap-6">
                                 <div className="flex-1 space-y-4">
                                    <div className="flex items-center gap-4">
                                       <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">
                                          {new Date(run.createdAt || run.startTime).toLocaleString()}
                                       </span>
                                       <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                          run.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' :
                                          run.status === 'failed' ? 'bg-red-500/10 text-red-600' :
                                          'bg-amber-500/10 text-amber-600'
                                       }`}>
                                          {run.status}
                                       </div>
                                    </div>
                                    <p className="text-sm font-bold italic text-muted/80">
                                       {run.input ? (run.input.length > 100 ? run.input.substring(0, 100) + '...' : run.input) : 'No input'}
                                    </p>
                                    {expandedHistoryId === run.id && run.steps && (
                                       <div className="mt-6 pt-6 border-t border-border/40 space-y-4">
                                          {run.steps.map((step: any, idx: number) => (
                                             <div key={idx} className="text-[10px] text-muted/70">
                                                <span className="font-black uppercase">{step.action || 'Step'}: </span>
                                                <span className="italic">{step.thought?.substring(0, 150) || 'Processing...'}</span>
                                             </div>
                                          ))}
                                       </div>
                                    )}
                                 </div>
                                 <div className="text-[10px] font-black text-muted/50 uppercase tracking-widest">
                                    {run.steps?.length || 0} steps
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
