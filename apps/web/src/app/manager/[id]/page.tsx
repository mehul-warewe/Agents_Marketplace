'use client';

import SidebarLayout from '@/components/SidebarLayout';
import { useManager, useUpdateManager, useManagerStream } from '@/hooks/useManager';
import { useEmployees as useWorkers } from '@/hooks/useEmployees';
import { MODEL_TYPES } from '@/components/builder/toolRegistry';
import { Bot, Play, ChevronRight, Edit3, Activity, Users, Target, Cpu, X, Sparkles, Network, Save, MessageSquare, List, Settings, Send, Terminal, Loader2, Zap, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

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
      <SidebarLayout title="Manager Status">
         <div className="flex flex-col items-center justify-center py-40 h-full bg-secondary/5">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Establishing Uplink...</p>
         </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title={`Manager Command Center: ${manager?.name}`}>
      <div className="flex flex-col h-full bg-secondary/5 overflow-hidden">
        
        {/* Navigation Bar */}
        <header className="h-14 bg-card border-b border-border/40 flex items-center justify-between px-6 shrink-0 z-50 shadow-sm">
          <div className="flex items-center gap-6">
             <button onClick={() => router.push('/manager')} className="p-2 bg-secondary/50 rounded-xl hover:bg-foreground hover:text-background transition-all text-muted-foreground border border-border/40">
                <ChevronRight size={16} strokeWidth={3} className="rotate-180" />
             </button>
             <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center border border-indigo-500/10 shadow-sm">
                   <Users size={16} />
                </div>
                <div className="flex flex-col">
                   <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500/80 leading-none mb-1">Intelligence Hub</span>
                   <h1 className="text-sm font-bold tracking-tight text-foreground leading-none">{manager?.name}</h1>
                </div>
                <div className={`px-2.5 py-1 rounded-lg border text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 ${stream.status === 'running' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500' : 'bg-muted/30 border-border/40 text-muted-foreground'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${stream.status === 'running' ? 'bg-indigo-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
                  {stream.status === 'running' ? 'Active' : 'Offline'}
                </div>
             </div>
          </div>

          <nav className="flex items-center bg-secondary/50 rounded-xl p-1 border border-border/40">
             {[
               { id: 'chat', label: 'Command', icon: MessageSquare },
               { id: 'config', label: 'Strategy', icon: Settings },
               { id: 'employees', label: 'Fleet', icon: Cpu },
               { id: 'history', label: 'History', icon: List }
             ].map(t => (
               <button
                 key={t.id}
                 onClick={() => setActiveTab(t.id as any)}
                 className={`relative px-5 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all flex items-center gap-2.5 z-10 ${activeTab === t.id ? 'text-indigo-600' : 'text-muted-foreground hover:text-foreground'}`}
               >
                 {activeTab === t.id && (
                   <motion.div 
                     layoutId="managerTabActive"
                     className="absolute inset-0 bg-card rounded-lg shadow-sm border border-border/40"
                     transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                   />
                 )}
                 <t.icon size={12} strokeWidth={activeTab === t.id ? 2.5 : 2} className="relative z-20" />
                 <span className="relative z-20">{t.label}</span>
               </button>
             ))}
          </nav>

          <div className="flex items-center gap-3">
             <Button
                onClick={handleSave}
                disabled={isUpdating}
                className="h-9 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 border-none"
             >
                {isUpdating ? <Activity size={14} className="animate-spin" /> : <Save size={14} />}
                Update Manager
             </Button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          
          {/* TAB: COMMAND (Chat) */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col h-full">
              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                {stream.status === 'idle' && stream.steps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-10">
                    <div className="w-20 h-20 bg-card rounded-[2rem] border border-border/40 flex items-center justify-center text-muted-foreground/20 mb-8 shadow-sm">
                       <Terminal size={40} />
                    </div>
                    <h3 className="text-xl font-bold font-display tracking-tight mb-2 text-foreground">Ready for Command</h3>
                    <p className="text-[12px] font-medium text-muted-foreground/60 max-w-xs leading-relaxed uppercase tracking-wider">
                       Enter a request below to begin orchestration across the assigned workforce fleet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-12 max-w-5xl mx-auto w-full">
                     {stream.status !== 'idle' && (
                        <>
                           {/* User/Manager Message */}
                           <div className="flex items-start gap-6 flex-row-reverse">
                              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-600/20">
                                 <Target size={18} />
                              </div>
                              <div className="bg-indigo-600 text-white p-6 rounded-2xl rounded-tr-none shadow-xl max-w-2xl text-sm font-bold tracking-normal leading-relaxed">
                                 {stream.steps[0]?.type === 'init' ? manager?.name : 'Processing request sequence...'}
                              </div>
                           </div>

                           {/* Thinking Logs */}
                           <div className="space-y-6">
                              {stream.steps?.map((step: any, idx: number) => {
                                 if (step.type === 'init') return null;
                                 
                                 const isLast = idx === stream.steps.length - 1;
                                 const isFinal = step.type === 'final';
                                 
                                 return (
                                    <div key={idx} className="flex gap-6">
                                       <div className="flex flex-col items-center shrink-0">
                                          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-sm ${isFinal ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-card border-border/40 text-indigo-500'}`}>
                                             {isFinal ? <CheckCircle2 size={18} /> : step.tool ? <Zap size={16} fill="currentColor" /> : <Activity size={18} className="animate-spin text-muted-foreground/40" />}
                                          </div>
                                          {!isLast && <div className="w-px h-full bg-border/40 my-2" />}
                                       </div>
                                       
                                       <div className="flex-1 pt-1">
                                          <div className="flex items-center gap-3 mb-2">
                                             <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">PROCESS {idx + 1}</span>
                                             <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">•</span>
                                             <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                                                {step.tool ? `Delegating: ${step.tool}` : step.type === 'final' ? 'Response Output' : 'Internal Analysis'}
                                             </span>
                                          </div>
                                          
                                          <Card className={`p-6 rounded-2xl border-border/40 shadow-sm transition-all duration-300 ${isFinal ? 'bg-card border-indigo-500/20 ring-1 ring-indigo-500/10' : 'bg-card/50'}`}>
                                             <p className={`text-[13px] leading-relaxed font-medium ${isFinal ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                {step.thought || step.output || 'Analyzing request data...'}
                                             </p>
                                          </Card>
                                       </div>
                                    </div>
                                 );
                              })}
                           </div>

                           {stream.status === 'running' && (
                              <div className="flex gap-6 animate-pulse">
                                 <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center shrink-0 border border-border/40">
                                    <Loader2 size={16} className="animate-spin text-muted-foreground/40" />
                                 </div>
                                 <div className="pt-2">
                                    <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">Processing request...</span>
                                 </div>
                              </div>
                           )}
                        </>
                     )}
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-8 bg-card border-t border-border/40 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                <div className="max-w-5xl mx-auto flex items-center gap-4">
                  <div className="flex-1 relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground/30">
                       <Terminal size={18} />
                    </div>
                    <input 
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleStartRun()}
                      className="w-full bg-secondary/50 border border-border/60 rounded-2xl pl-14 pr-6 py-4 outline-none focus:bg-background focus:border-indigo-500/40 transition-all font-bold text-base tracking-tight shadow-inner"
                      placeholder="Enter execution request..."
                    />
                  </div>
                  <Button
                    onClick={handleStartRun}
                    disabled={stream.status === 'running' || !chatInput.trim()}
                    className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-600/20 transition-all gap-3 font-black text-[10px] uppercase tracking-[0.2em] shrink-0 border-none"
                  >
                    {stream.status === 'running' ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    Run Task
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: STRATEGY (Config) */}
          {activeTab === 'config' && (
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
               <div className="max-w-4xl mx-auto space-y-12">
                  <div className="space-y-1">
                     <h2 className="text-2xl font-bold font-display tracking-tight text-foreground">Strategic Configuration</h2>
                     <p className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest">Core Intelligence Parameters</p>
                  </div>

                  <Card className="p-8 space-y-10 border-border/40 shadow-sm bg-card rounded-3xl">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] px-1">
                              Manager Name
                           </label>
                           <input
                              value={formData.name}
                              onChange={e => setFormData({ ...formData, name: e.target.value })}
                              className="w-full bg-secondary/30 border border-border/60 rounded-xl px-5 py-4 outline-none focus:bg-background focus:border-indigo-500/40 transition-all font-bold text-lg tracking-tight shadow-inner"
                           />
                        </div>

                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] px-1">
                              Model Provider
                           </label>
                           <select
                              value={formData.model || ''}
                              onChange={e => setFormData({ ...formData, model: e.target.value })}
                              className="w-full bg-secondary/30 border border-border/60 rounded-xl px-5 py-4 outline-none focus:bg-background focus:border-indigo-500/40 transition-all font-bold text-[13px] tracking-tight shadow-inner"
                           >
                              <option value="">Select model...</option>
                              {MODEL_TYPES.map(model => (
                                 <option key={model.id} value={model.id}>
                                    {model.label}
                                 </option>
                              ))}
                           </select>
                        </div>
                     </div>

                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] px-1">
                           Primary Objective
                        </label>
                        <textarea 
                           value={formData.goal}
                           onChange={e => setFormData({ ...formData, goal: e.target.value })}
                           className="w-full bg-secondary/30 border border-border/60 rounded-xl px-6 py-5 outline-none focus:bg-background focus:border-indigo-500/40 transition-all font-medium text-[13px] leading-relaxed shadow-inner min-h-[100px] resize-none"
                        />
                     </div>

                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] px-1">
                           Instruction Set (System Prompt)
                        </label>
                        <textarea 
                           value={formData.systemPrompt}
                           onChange={e => setFormData({ ...formData, systemPrompt: e.target.value })}
                           className="w-full bg-secondary/30 border border-border/60 rounded-xl px-6 py-5 outline-none focus:bg-background focus:border-indigo-500/40 transition-all font-mono text-[11px] leading-relaxed shadow-inner min-h-[200px] resize-none"
                        />
                     </div>

                     <div className="pt-6 border-t border-border/40">
                        <Button 
                           onClick={handleSave}
                           disabled={isUpdating}
                           className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 transition-all"
                        >
                           {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                           Update Intelligence Base
                        </Button>
                     </div>
                  </Card>
               </div>
            </div>
          )}

          {/* TAB: FLEET (Employee Selection) */}
          {activeTab === 'employees' && (
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
               <div className="max-w-5xl mx-auto space-y-12">
                  <div className="space-y-1">
                     <h2 className="text-2xl font-bold font-display tracking-tight text-foreground">Managed Workforce</h2>
                     <p className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest">Assigned Employees: {formData.workerIds.length}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {workerFleet?.map((worker: any) => {
                        const isSelected = formData.workerIds.includes(worker.id);
                        return (
                           <Card 
                              key={worker.id}
                              onClick={() => {
                                 setFormData({
                                    ...formData,
                                    workerIds: isSelected 
                                       ? formData.workerIds.filter((id: any) => id !== worker.id)
                                          : [...formData.workerIds, worker.id]
                                    });
                                 }}
                                 className={`p-6 cursor-pointer group transition-all duration-300 rounded-2xl border-border/40 shadow-sm flex flex-col items-center text-center gap-4 ${isSelected ? 'bg-indigo-600 border-transparent shadow-lg shadow-indigo-600/20' : 'bg-card hover:border-indigo-500/40'}`}
                              >
                                 <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${isSelected ? 'bg-white/10 border-white/10 text-white' : 'bg-secondary border-border/40 text-muted-foreground'}`}>
                                    <Bot size={24} />
                                 </div>
                                 <div className="min-w-0">
                                    <h3 className={`text-[13px] font-bold uppercase tracking-tight mb-2 truncate ${isSelected ? 'text-white' : 'text-foreground'}`}>{worker.name}</h3>
                                    <p className={`text-[10px] font-medium line-clamp-2 leading-tight uppercase tracking-wide px-2 ${isSelected ? 'text-indigo-100/60' : 'text-muted-foreground/50'}`}>
                                       {worker.workerDescription || 'Standard Protocol Operative'}
                                    </p>
                                 </div>
                                 {isSelected && (
                                    <div className="absolute top-4 right-4 text-white/40">
                                       <Shield size={14} />
                                    </div>
                                 )}
                              </Card>
                           );
                        })}
                     </div>

                     <div className="pt-10 flex justify-center">
                        <Button
                           onClick={handleSave}
                           disabled={isUpdating}
                           className="h-12 px-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 transition-all"
                        >
                           {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                           Save Workforce Assignments
                        </Button>
                     </div>
                  </div>
               </div>
             )}

             {/* TAB: HISTORY (Past Runs) */}
             {activeTab === 'history' && (
               <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                  <div className="max-w-4xl mx-auto space-y-12">
                     <div className="space-y-1">
                        <h2 className="text-2xl font-bold font-display tracking-tight text-foreground">Execution History</h2>
                        <p className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest">Total Runs: {runHistory.length}</p>
                     </div>

                     {runHistory.length === 0 ? (
                        <Card className="flex flex-col items-center justify-center py-24 text-center border-border/40 bg-card rounded-3xl shadow-sm">
                           <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center text-muted-foreground/20 mb-6 border border-border/40">
                              <List size={32} />
                           </div>
                           <h3 className="text-lg font-bold font-display mb-1 text-foreground/80">History Empty</h3>
                           <p className="text-[12px] text-muted-foreground/60 uppercase tracking-widest">No previous execution history found for this manager.</p>
                        </Card>
                     ) : (
                        <div className="space-y-3">
                           {runHistory.map((run: any) => (
                              <Card
                                 key={run.id}
                                 className="p-6 border-border/40 bg-card rounded-2xl cursor-pointer hover:border-indigo-500/20 transition-all group shadow-sm"
                                 onClick={() => setExpandedHistoryId(expandedHistoryId === run.id ? null : run.id)}
                              >
                                 <div className="flex items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                       <div className={`w-2 h-10 rounded-full ${
                                          run.status === 'completed' ? 'bg-emerald-500' :
                                          run.status === 'failed' ? 'bg-red-500' : 'bg-amber-500'
                                       }`} />
                                       <div className="space-y-1">
                                          <div className="flex items-center gap-3">
                                             <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
                                                {new Date(run.createdAt || run.startTime).toLocaleString()}
                                             </span>
                                             <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                                run.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' :
                                                run.status === 'failed' ? 'bg-red-500/10 text-red-600' :
                                                'bg-amber-500/10 text-amber-600'
                                             }`}>
                                                {run.status}
                                             </span>
                                          </div>
                                          <p className="text-[13px] font-bold text-foreground/80 line-clamp-1">
                                             {run.input || 'No input data'}
                                          </p>
                                       </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">
                                       {run.steps?.length || 0} Steps
                                       <ChevronRight size={14} className={`transition-transform ${expandedHistoryId === run.id ? 'rotate-90' : ''}`} />
                                    </div>
                                 </div>
                                 {expandedHistoryId === run.id && run.steps && (
                                    <div className="mt-6 pt-6 border-t border-border/40 space-y-4">
                                       {run.steps.map((step: any, idx: number) => (
                                          <div key={idx} className="flex gap-4">
                                             <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/30 mt-1 shrink-0" />
                                             <div className="space-y-1">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">{step.action || 'Sequence'}: </span>
                                                <p className="text-[11px] font-medium text-muted-foreground leading-relaxed italic">"{step.thought || 'Processing node...'}"</p>
                                             </div>
                                          </div>
                                       ))}
                                    </div>
                                 )}
                              </Card>
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
