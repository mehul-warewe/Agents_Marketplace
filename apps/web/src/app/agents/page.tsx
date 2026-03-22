'use client';

import SidebarLayout from '@/components/SidebarLayout';
import { useMyAgents, useRunAgent, usePublishAgent, useDeleteAgent } from '@/hooks/useApi';
import { Bot, Plus, Clock, Globe, Lock, Play, ChevronRight, Edit3, Share2, X, DollarSign, Tag, Trash2, Shield, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const CATEGORIES = ['Automation', 'Intelligence', 'Deep Research', 'Complex Ops', 'Creative', 'Discovery'];

export default function MyAgentsPage() {
  const { data: agents, isLoading } = useMyAgents();
  const { mutate: runAgent } = useRunAgent();
  const { mutate: deleteAgent } = useDeleteAgent();
  const { mutate: publishAgent, isPending: isPublishing } = usePublishAgent();
  const router = useRouter();

  const [publishingAgent, setPublishingAgent] = useState<any>(null);
  const [publishPrice, setPublishPrice] = useState('0');
  const [publishCategory, setPublishCategory] = useState(CATEGORIES[0]);

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

  return (
    <SidebarLayout title="ENTITY_GRID // MY_FLEET">
      <div className="flex-1 bg-background min-h-full text-foreground p-6 sm:p-10 lg:p-14 overflow-y-auto w-full no-scrollbar font-inter">
        <div className="max-w-[1400px] mx-auto space-y-16">
          
          {/* Page Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-border/60 pb-16">
            <div className="space-y-6">
              <div className="flex flex-col gap-4">
                <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none">Autonomous_Fleet</h1>
                <div className="w-fit bg-foreground/5 text-foreground text-[10px] font-black px-5 py-2 uppercase tracking-[0.3em] border border-border/50 rounded-full">
                  Node_Capacity: {agents?.length || 0}/Unlimited
                </div>
              </div>
              <p className="text-muted font-bold text-lg leading-tight uppercase opacity-40 max-w-xl">Manage and synthesize your private entity grid with high-fidelity control.</p>
            </div>
            <button
              onClick={() => router.push('/builder')}
              className="bg-foreground text-background hover:scale-[1.02] px-14 py-5 rounded-[1.75rem] font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-2xl shadow-foreground/10 active:scale-[0.98]"
            >
              <Plus size={18} strokeWidth={3} /> New Entity
            </button>
          </header>

          {/* Fleet Content */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-40 text-muted">
              <div className="w-10 h-10 border border-accent border-t-transparent animate-spin mb-6"></div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Polling_Private_Net</p>
            </div>
          ) : !agents || agents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-40 text-center border border-border/60 bg-card rounded-[3rem] shadow-2xl shadow-foreground/5 overflow-hidden relative">
              <div className="absolute inset-0 bg-foreground/[0.01] pointer-events-none" />
              <div className="w-24 h-24 bg-foreground/5 rounded-[2.5rem] flex items-center justify-center text-muted mb-12 border border-border/50 relative z-10">
                <Bot size={40} strokeWidth={1} />
              </div>
              <h3 className="text-3xl font-black mb-4 uppercase tracking-tighter italic relative z-10">Fleet_Offline</h3>
              <p className="text-muted font-bold mb-12 max-w-sm mx-auto leading-tight uppercase opacity-40 relative z-10">Synthesize your first autonomous agent to initialize the grid.</p>
              <button
                onClick={() => router.push('/builder')}
                className="bg-foreground text-background px-14 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:scale-[1.05] transition-all relative z-10 shadow-xl"
              >
                Initialize Node
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
                        {agent.isPublished ? 'PUBLIC_LNK' : 'SECURE_NODE'}
                      </div>
                      <div className="flex items-center gap-2.5 px-5 py-2 rounded-full border border-border/60 bg-foreground/[0.03] text-muted text-[9px] font-black uppercase tracking-[0.2em] shadow-inner">
                        <Activity size={12} strokeWidth={3} className="animate-pulse" />
                        UPLINK_LIVE
                      </div>
                    </div>

                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                      <button 
                        onClick={() => { if(confirm('Purge this entity permanently?')) deleteAgent(agent.id); }}
                        className="w-12 h-12 bg-red-500/5 rounded-2xl border border-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-lg shadow-red-500/5"
                        title="Purge node"
                      >
                        <Trash2 size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>

                  {/* Header */}
                  <div className="flex items-start gap-10 mb-12 relative z-10">
                    <div className="w-20 h-20 rounded-[1.75rem] border border-border/60 bg-foreground/[0.03] flex items-center justify-center text-foreground shrink-0 group-hover:bg-foreground group-hover:text-background transition-all duration-700 shadow-inner group-hover:shadow-2xl group-hover:scale-105">
                      <Bot size={36} strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0 pt-2">
                       <span className="text-[9px] font-black text-muted uppercase tracking-[0.4em] mb-2 block opacity-30 italic">Logical_Core_ID</span>
                      <h3 className="text-3xl font-black tracking-tighter uppercase italic leading-none truncate mb-4">{agent.name}</h3>
                      <p className="text-[12px] text-muted font-bold uppercase tracking-tight opacity-50 leading-tight line-clamp-2 italic">
                        {agent.description || "No customized technical instruction matrix detected for this operational unit."}
                      </p>
                    </div>
                  </div>

                  {/* Actions Matrix */}
                  <div className="grid grid-cols-3 gap-6 mt-auto pt-12 relative z-10 border-t border-border/40">
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
                      onClick={() => runAgent({ agentId: agent.id })}
                      className="flex flex-col items-center justify-center gap-4 py-8 bg-foreground/[0.03] hover:bg-foreground hover:text-background transition-all duration-500 rounded-3xl group/opt border border-border/40 shadow-xl shadow-foreground/5 hover:translate-y-[-4px]"
                    >
                      <Play size={24} fill="currentColor" strokeWidth={0} />
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60 group-hover/opt:opacity-100">TRIGGER</span>
                    </button>
                  </div>

                  {/* Footer Metadata */}
                  <div className="mt-10 flex items-center justify-between text-[10px] font-black text-muted uppercase tracking-[0.2em] opacity-30 italic">
                    <div className="flex items-center gap-3">
                      <Clock size={16} strokeWidth={3} />
                      REF::{new Date(agent.createdAt).toLocaleDateString().replace(/\//g, '-')}
                    </div>
                    {agent.isPublished && (
                      <div className="text-foreground font-black bg-foreground/10 px-4 py-1.5 rounded-full not-italic tracking-[0.1em]">
                        VAL::{agent.price === 0 ? 'FREE' : `${agent.price}Cr`}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
                      <span className="text-[10px] font-black text-muted uppercase tracking-[0.4em] opacity-40">UPLINK_DISTRIBUTION</span>
                   </div>
                  <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">{publishingAgent.isPublished ? 'REGISTRY_SYNC' : 'INITIAL_MARKET_LINK'}</h2>
                </div>
                <button onClick={() => setPublishingAgent(null)} className="w-12 h-12 bg-foreground/5 rounded-2xl hover:bg-foreground hover:text-background transition-all border border-border/40 flex items-center justify-center">
                  <X size={20} strokeWidth={3} />
                </button>
              </header>

              <div className="space-y-12">
                <div className="space-y-6">
                  <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] px-4 opacity-50 italic">
                    Marketplace_Valuation (Cr)
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
                    Logical_Categorization
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
                  {isPublishing ? 'SYNCHRONIZING_CORE...' : publishingAgent.isPublished ? 'PUSH_UPDATE_TO_RECORDS' : 'INITIATE_PUBLIC_BRIDGE'}
                  <ChevronRight size={20} strokeWidth={3} />
                </button>

                {publishingAgent.isPublished && (
                  <button
                    onClick={() => {
                        publishAgent({ id: publishingAgent.id, published: false }, { onSuccess: () => setPublishingAgent(null) });
                    }}
                    className="w-full py-4 text-[10px] font-black text-red-500 uppercase tracking-[0.4em] hover:opacity-50 transition-all mt-4 italic underline underline-offset-8"
                  >
                    Withdraw_Protocol_From_Registry
                  </button>
                )}
              </footer>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}

