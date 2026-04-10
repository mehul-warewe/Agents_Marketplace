'use client';

import SidebarLayout from '@/components/SidebarLayout';
import { useMyAgents, useRunAgent, usePublishAgent, useDeleteAgent, usePublishAsWorker } from '@/hooks/useApi';
import { Bot, Plus, Clock, Globe, Lock, Play, ChevronRight, Edit3, Share2, X, DollarSign, Tag, Trash2, Shield, Activity, Zap, FileJson } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';

const CATEGORIES = ['Automation', 'Intelligence', 'Deep Research', 'Complex Ops', 'Creative', 'Discovery'];

export default function MyAgentsPage() {
  const { data: agents, isLoading } = useMyAgents();
  const { mutate: runAgent } = useRunAgent();
  const { mutate: deleteAgent } = useDeleteAgent();
  const { mutate: publishAgent, isPending: isPublishing } = usePublishAgent();
  const { mutate: publishAsWorker, isPending: isPublishingWorker } = usePublishAsWorker();
  const router = useRouter();
  const toast = useToast();

  const [publishingAgent, setPublishingAgent] = useState<any>(null);
  const [publishPrice, setPublishPrice] = useState('0');
  const [publishCategory, setPublishCategory] = useState(CATEGORIES[0]);

  const [publishingWorkerAgent, setPublishingWorkerAgent] = useState<any>(null);
  const [workerDescription, setWorkerDescription] = useState('');
  const [workerInputSchema, setWorkerInputSchema] = useState('{}');

  const [runningAgent, setRunningAgent] = useState<any>(null);
  const [runInput, setRunInput] = useState('');

  const handleOpenPublish = (agent: any) => {
    setPublishingAgent(agent);
    setPublishPrice(agent.price?.toString() || '0');
    setPublishCategory(agent.category || CATEGORIES[0]);
  };

  const handleConfirmPublish = () => {
    if (!publishingAgent) return;
    publishAgent({
      id: publishingAgent.id,
      published: !publishingAgent.isPublished,
      price: parseFloat(publishPrice),
      category: publishCategory
    }, {
      onSuccess: () => setPublishingAgent(null)
    });
  };

  const handleOpenWorkerPublish = (agent: any) => {
    setPublishingWorkerAgent(agent);
    setWorkerDescription(agent.workerDescription || '');
    setWorkerInputSchema(JSON.stringify(agent.workerInputSchema || {}, null, 2));
  };

  const handleConfirmWorkerPublish = () => {
    if (!publishingWorkerAgent) return;
    try {
      const schema = JSON.parse(workerInputSchema);
      publishAsWorker({
        id: publishingWorkerAgent.id,
        isWorker: true,
        workerDescription,
        workerInputSchema: schema
      }, {
        onSuccess: () => setPublishingWorkerAgent(null)
      });
    } catch (e) {
      alert('Invalid JSON schema');
    }
  };

  return (
    <SidebarLayout title="Employees">
      <div className="flex-1 bg-background min-h-full text-foreground p-6 sm:p-10 lg:p-14 overflow-y-auto w-full no-scrollbar font-inter">
        <div className="max-w-[1400px] mx-auto space-y-16">
          
          {/* Page Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-border/60 pb-16">
            <div className="space-y-6">
              <div className="flex flex-col gap-4">
                <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none">Employees</h1>
                <div className="w-fit bg-foreground/5 text-foreground text-[10px] font-black px-5 py-2 uppercase tracking-[0.3em] border border-border/50 rounded-full">
                  Count: {agents?.length || 0}/Unlimited
                </div>
              </div>
              <p className="text-muted font-bold text-lg leading-tight uppercase opacity-40 max-w-xl">Manage and delegate to your specialized employees with autonomous precision.</p>
            </div>
            <button
              onClick={() => router.push('/builder?mode=employee')}
              className="bg-foreground text-background hover:scale-[1.02] px-14 py-5 rounded-[1.75rem] font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-2xl shadow-foreground/10 active:scale-[0.98]"
            >
              <Plus size={18} strokeWidth={3} /> Build Employee
            </button>
          </header>

          {/* Fleet Content */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-40 text-muted">
              <div className="w-10 h-10 border border-accent border-t-transparent animate-spin mb-6"></div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Loading...</p>
            </div>
          ) : !agents || agents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-40 text-center border border-border/60 bg-card rounded-[3rem] shadow-2xl shadow-foreground/5 overflow-hidden relative">
              <div className="absolute inset-0 bg-foreground/[0.01] pointer-events-none" />
              <div className="w-24 h-24 bg-foreground/5 rounded-[2.5rem] flex items-center justify-center text-muted mb-12 border border-border/50 relative z-10">
                <Bot size={40} strokeWidth={1} />
              </div>
              <h3 className="text-3xl font-black mb-4 uppercase tracking-tighter italic relative z-10">No employees</h3>
              <p className="text-muted font-bold mb-12 max-w-sm mx-auto leading-tight uppercase opacity-40 relative z-10">Build your first employee to expand your workforce.</p>
              <button
                onClick={() => router.push('/builder?mode=employee')}
                className="bg-foreground text-background px-14 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:scale-[1.05] transition-all relative z-10 shadow-xl"
              >
                Build Employee
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 3xl:grid-cols-3 gap-12">
              {agents.map((agent: any) => (
                <div key={agent.id} className="bg-card p-12 group relative transition-all duration-500 rounded-[3.5rem] border border-border/60 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] hover:border-foreground/20 hover:shadow-2xl hover:shadow-foreground/5 flex flex-col overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-foreground/[0.02] rounded-full -mr-24 -mt-24 group-hover:scale-150 transition-transform duration-1000" />
                  
                  {/* Status Badges */}
                  <div className="flex items-center justify-between mb-12 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className={`flex items-center gap-2.5 px-5 py-2 rounded-full border text-[9px] font-black uppercase tracking-[0.2em] shadow-inner ${agent.isPublished ? 'bg-foreground text-background border-foreground' : 'bg-foreground/5 border-border/60 text-muted'}`}>
                        {agent.isPublished ? <Globe size={12} strokeWidth={3} /> : <Shield size={12} strokeWidth={3} />}
                        {agent.isPublished ? 'Public' : 'Private'}
                      </div>
                      {agent.isWorker && (
                        <div className="flex items-center gap-2.5 px-5 py-2 rounded-full border border-yellow-500/50 bg-yellow-500/10 text-yellow-500 text-[9px] font-black uppercase tracking-[0.2em] shadow-inner animate-pulse">
                          <Zap size={12} fill="currentColor" />
                          EMPLOYEE
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                      <button
                        onClick={() => handleOpenWorkerPublish(agent)}
                        className={`w-12 h-12 rounded-2xl border transition-all flex items-center justify-center shadow-lg ${agent.isWorker ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500 hover:bg-yellow-500 hover:text-white' : 'bg-foreground/5 border-border/40 text-muted hover:bg-foreground hover:text-background'}`}
                        title={agent.isWorker ? 'Update Employee Settings' : 'Promote to Employee'}
                      >
                        <Zap size={18} strokeWidth={2.5} fill={agent.isWorker ? "currentColor" : "none"} />
                      </button>
                      <button 
                        onClick={() => { if(confirm('Delete this employee permanently?')) deleteAgent(agent.id); }}
                        className="w-12 h-12 bg-red-500/5 rounded-2xl border border-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-lg shadow-red-500/5"
                        title="Delete employee"
                      >
                        <Trash2 size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>

                  {/* Header - Identity Card Style */}
                  <div className="flex items-start gap-10 mb-12 relative z-10">
                    <div className="w-24 h-24 rounded-[2rem] border border-border/60 bg-foreground/[0.03] flex items-center justify-center text-foreground shrink-0 group-hover:bg-foreground group-hover:text-background transition-all duration-700 shadow-inner group-hover:shadow-2xl group-hover:scale-105">
                      <Bot size={42} strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0 pt-2 flex-1">
                       <div className="flex items-center gap-3 mb-2">
                        <span className="text-[9px] font-black text-muted uppercase tracking-[0.4em] opacity-30 italic">Active unit</span>
                        <div className="h-[1px] flex-1 bg-border/40" />
                       </div>
                      <h3 className="text-4xl font-black tracking-tighter uppercase italic leading-none truncate mb-4">{agent.name}</h3>
                      <p className="text-[13px] text-muted font-bold uppercase tracking-tight opacity-50 leading-tight line-clamp-2 italic">
                        {agent.description || "No customized instructions found for this unit."}
                      </p>
                      
                      {agent.isWorker && agent.workerDescription && (
                        <div className="mt-6 p-6 bg-yellow-500/[0.03] border border-yellow-500/10 rounded-[2rem] space-y-2">
                          <p className="text-[9px] text-yellow-600 font-black uppercase tracking-[0.3em] italic opacity-60 flex items-center gap-2">
                            <Activity size={12} /> Specialization
                          </p>
                          <p className="text-sm text-foreground font-black italic opacity-80 leading-snug">{agent.workerDescription}</p>
                        </div>
                      )}

                      {agent.isWorker && agent.workerInputSchema && Object.keys(agent.workerInputSchema).length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {Object.keys(agent.workerInputSchema).map((key: string) => (
                            <span key={key} className="px-3 py-1 bg-foreground/5 border border-border/40 rounded-full text-[9px] font-black text-muted uppercase tracking-widest">
                              {key}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Operational Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-12 relative z-10 px-2">
                      <div className="p-4 bg-foreground/[0.02] border border-border/40 rounded-2xl">
                        <p className="text-[8px] font-black text-muted uppercase tracking-widest opacity-40 mb-1">Status</p>
                        <div className="text-[10px] font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
                        </div>
                     </div>
                     <div className="p-4 bg-foreground/[0.02] border border-border/40 rounded-2xl">
                        <p className="text-[8px] font-black text-muted uppercase tracking-widest opacity-40 mb-1">Architecture</p>
                        <p className="text-[10px] font-black text-foreground uppercase tracking-wider">Secure</p>
                     </div>
                  </div>

                  {/* Actions Matrix */}
                  <div className="grid grid-cols-3 gap-6 mt-auto pt-10 relative z-10 border-t border-border/40">
                    <button 
                      onClick={() => handleOpenPublish(agent)}
                      className="flex flex-col items-center justify-center gap-4 py-8 bg-foreground/[0.03] hover:bg-foreground hover:text-background transition-all duration-500 rounded-3xl group/opt border border-border/40 shadow-xl shadow-foreground/5 hover:translate-y-[-4px]"
                    >
                      <Share2 size={24} strokeWidth={2.5} />
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60 group-hover/opt:opacity-100">{agent.isPublished ? 'ADJUST' : 'PUBLISH'}</span>
                    </button>

                    <button 
                      onClick={() => router.push(`/builder?id=${agent.id}`)}
                      className="flex flex-col items-center justify-center gap-4 py-8 bg-foreground/[0.03] hover:bg-foreground hover:text-background transition-all duration-500 rounded-3xl group/opt border border-border/40 shadow-xl shadow-foreground/5 hover:translate-y-[-4px]"
                    >
                      <Edit3 size={24} strokeWidth={2.5} />
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60 group-hover/opt:opacity-100">LOGIC</span>
                    </button>

                    <button 
                      onClick={() => setRunningAgent(agent)}
                      className="flex flex-col items-center justify-center gap-4 py-8 bg-foreground text-background hover:bg-primary transition-all duration-500 rounded-3xl group/opt shadow-2xl shadow-foreground/20 hover:translate-y-[-4px]"
                    >
                      <Play size={24} fill="currentColor" strokeWidth={0} />
                      <span className="text-[9px] font-black uppercase tracking-[0.3em]">Run</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Run Modal (Empower Independence) ─────────────────────────── */}
      {runningAgent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-md" onClick={() => setRunningAgent(null)} />
          <div className="relative bg-card border border-border/60 w-full max-w-2xl rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            <div className="p-16 space-y-16">
              <header className="flex justify-between items-start border-b border-border/40 pb-12">
                <div className="space-y-6">
                   <div className="flex items-center gap-4">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black text-muted uppercase tracking-[0.4em] opacity-40">Execution Protocol</span>
                   </div>
                  <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none truncate max-w-md">Run {runningAgent.name}</h2>
                </div>
                <button onClick={() => setRunningAgent(null)} className="w-12 h-12 bg-foreground/5 rounded-2xl hover:bg-foreground hover:text-background transition-all border border-border/40 flex items-center justify-center">
                  <X size={20} strokeWidth={3} />
                </button>
              </header>

              <div className="space-y-12">
                {runningAgent.isWorker ? (
                  <div className="space-y-10">
                    <div className="p-8 bg-yellow-500/[0.03] border border-yellow-500/10 rounded-3xl space-y-4">
                       <h4 className="text-[10px] font-black text-yellow-600 uppercase tracking-widest italic flex items-center gap-3">
                          <Zap size={14} fill="currentColor" /> EMPLOYEE_CAPABILITY
                       </h4>
                       <p className="text-sm font-bold text-foreground opacity-70 italic leading-relaxed">{runningAgent.workerDescription}</p>
                    </div>

                    <div className="space-y-6">
                      <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] px-4 opacity-50 italic flex items-center gap-3">
                        <FileJson size={14} /> Mission Parameters (JSON)
                      </label>
                      <textarea 
                        value={runInput}
                        onChange={e => setRunInput(e.target.value)}
                        className="w-full bg-foreground/[0.03] border border-border/60 rounded-[2.5rem] px-12 py-10 outline-none focus:bg-background focus:border-foreground transition-all font-mono text-sm shadow-inner min-h-[200px] resize-none"
                        placeholder={JSON.stringify(runningAgent.workerInputSchema || {}, null, 2)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-8">
                     <div className="w-24 h-24 bg-foreground/5 rounded-[2.5rem] flex items-center justify-center text-foreground border border-border/60">
                        <Bot size={48} strokeWidth={1} />
                     </div>
                     <div className="space-y-2">
                        <h4 className="text-xl font-black uppercase tracking-tight italic">Global_Execution_Sequence</h4>
                        <p className="text-xs text-muted font-bold uppercase tracking-widest opacity-40 max-w-xs mx-auto">This entity will execute its complete logic-tree under standard operating parameters.</p>
                     </div>
                  </div>
                )}
              </div>

              <footer className="pt-12 border-t border-border/40">
                <button
                  onClick={() => {
                    let inputData = {};
                    try {
                      if (runningAgent.isWorker && runInput) {
                        inputData = JSON.parse(runInput);
                      }
                    } catch (e) {
                      alert('Invalid JSON input data');
                      return;
                    }
                    
                    runAgent({ agentId: runningAgent.id, inputData });
                    toast.success('Mission initiated successfully.');
                    setRunningAgent(null);
                  }}
                  className="w-full bg-foreground text-background py-10 rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.4em] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-6 shadow-2xl shadow-foreground/20"
                >
                   Launch
                  <Play size={20} fill="currentColor" strokeWidth={0} />
                </button>
              </footer>
            </div>
          </div>
        </div>
      )}

      {/* ── Publish Modal (warewe Style) ─────────────────────────────────── */}
      {publishingAgent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-md" onClick={() => setPublishingAgent(null)} />
          <div className="relative bg-card border border-border/60 w-full max-w-xl rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            <div className="p-16 space-y-16">
              <header className="flex justify-between items-start border-b border-border/40 pb-12">
                <div className="space-y-6">
                   <div className="flex items-center gap-4">
                      <div className="w-2.5 h-2.5 rounded-full bg-foreground" />
                      <span className="text-[10px] font-black text-muted uppercase tracking-[0.4em] opacity-40">Marketplace</span>
                   </div>
                  <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">{publishingAgent.isPublished ? 'Update Listing' : 'Publish to Market'}</h2>
                </div>
                <button onClick={() => setPublishingAgent(null)} className="w-12 h-12 bg-foreground/5 rounded-2xl hover:bg-foreground hover:text-background transition-all border border-border/40 flex items-center justify-center">
                  <X size={20} strokeWidth={3} />
                </button>
              </header>

              <div className="space-y-12">
                <div className="space-y-6">
                   <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] px-4 opacity-50 italic">
                    Credits per run
                  </label>
                  <div className="relative group">
                    <DollarSign size={24} strokeWidth={3} className="absolute left-8 top-1/2 -translate-y-1/2 text-muted opacity-40 group-focus-within:text-foreground group-focus-within:opacity-100 transition-all" />
                    <input 
                      type="number"
                      value={publishPrice}
                      onChange={e => setPublishPrice(e.target.value)}
                      className="w-full bg-foreground/[0.03] border border-border/60 rounded-[2.5rem] pl-20 pr-12 py-10 outline-none focus:bg-background focus:border-foreground transition-all font-black text-6xl tracking-tighter italic shadow-inner"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                   <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] px-4 opacity-50 italic">
                    Category
                  </label>
                  <div className="relative group">
                    <Tag size={18} strokeWidth={3} className="absolute left-8 top-1/2 -translate-y-1/2 text-muted opacity-40 group-hover:text-foreground transition-all" />
                    <select 
                      value={publishCategory}
                      onChange={e => setPublishCategory(e.target.value)}
                      className="w-full bg-foreground/[0.03] border border-border/60 px-20 py-8 outline-none focus:bg-background focus:border-foreground transition-all font-black text-xs uppercase tracking-[0.4em] appearance-none cursor-pointer rounded-[1.75rem] shadow-inner italic"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c} className="bg-card text-foreground">{c.toUpperCase()}</option>)}
                    </select>
                    <ChevronRight size={18} strokeWidth={3} className="absolute right-8 top-1/2 -translate-y-1/2 rotate-90 text-muted pointer-events-none opacity-40" />
                  </div>
                </div>
              </div>

              <footer className="pt-12 flex flex-col gap-6 border-t border-border/40">
                 <button
                  onClick={handleConfirmPublish}
                  disabled={isPublishing}
                  className="w-full bg-foreground text-background py-10 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-6 shadow-2xl shadow-foreground/20"
                >
                  {isPublishing ? 'Saving...' : publishingAgent.isPublished ? 'Save changes' : 'Publish'}
                  <ChevronRight size={20} strokeWidth={3} />
                </button>

                {publishingAgent.isPublished && (
                  <button
                    onClick={() => {
                        publishAgent({ id: publishingAgent.id, published: false }, { onSuccess: () => setPublishingAgent(null) });
                    }}
                    className="w-full py-4 text-[10px] font-black text-red-500 uppercase tracking-[0.4em] hover:opacity-50 transition-all mt-4 italic underline underline-offset-8"
                  >
                     Withdraw Listing
                  </button>
                )}
              </footer>
            </div>
          </div>
        </div>
      )}

      {/* ── Employee Protocol Modal (warewe Style) ─────────────────────────── */}
      {publishingWorkerAgent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-md" onClick={() => setPublishingWorkerAgent(null)} />
          <div className="relative bg-card border border-border/60 w-full max-w-2xl rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            <div className="p-16 space-y-16">
              <header className="flex justify-between items-start border-b border-border/40 pb-12">
                <div className="space-y-6">
                   <div className="flex items-center gap-4">
                      <Zap size={16} fill="currentColor" className="text-yellow-500" />
                      <span className="text-[10px] font-black text-muted uppercase tracking-[0.4em] opacity-40">Employee Settings</span>
                   </div>
                  <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">Promote to Employee</h2>
                </div>
                <button onClick={() => setPublishingWorkerAgent(null)} className="w-12 h-12 bg-foreground/5 rounded-2xl hover:bg-foreground hover:text-background transition-all border border-border/40 flex items-center justify-center">
                  <X size={20} strokeWidth={3} />
                </button>
              </header>

              <div className="space-y-12">
                <div className="space-y-6">
                   <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] px-4 opacity-50 italic flex items-center gap-3">
                    <Activity size={14} /> Description (For Manager)
                  </label>
                  <textarea
                    value={workerDescription}
                    onChange={e => setWorkerDescription(e.target.value)}
                    className="w-full bg-foreground/[0.03] border border-border/60 rounded-[2.5rem] px-12 py-10 outline-none focus:bg-background focus:border-foreground transition-all font-bold text-lg tracking-tight italic shadow-inner min-h-[120px] resize-none"
                    placeholder="Describe exactly what this employee can do so the Manager Agent knows when to call them..."
                  />
                </div>

                <div className="space-y-6">
                   <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] px-4 opacity-50 italic flex items-center gap-3">
                    <FileJson size={14} /> Input Schema (JSON)
                  </label>
                  <div className="relative group">
                    <textarea 
                      value={workerInputSchema}
                      onChange={e => setWorkerInputSchema(e.target.value)}
                      className="w-full bg-foreground/[0.03] border border-border/60 rounded-[2.5rem] px-12 py-10 outline-none focus:bg-background focus:border-foreground transition-all font-mono text-xs shadow-inner min-h-[150px] resize-none"
                      placeholder='{ "topic": "string" }'
                    />
                  </div>
                </div>
              </div>

              <footer className="pt-12 flex flex-col gap-6 border-t border-border/40">
                <button
                  onClick={handleConfirmWorkerPublish}
                  disabled={isPublishingWorker}
                  className="w-full bg-yellow-500 text-black py-10 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-6 shadow-2xl shadow-yellow-500/20"
                >
                   {isPublishingWorker ? 'Proccessing...' : publishingWorkerAgent.isWorker ? 'Update Employee' : 'Promote to Employee'}
                  <Zap size={20} fill="currentColor" />
                </button>
              </footer>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}

