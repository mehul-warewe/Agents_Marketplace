'use client';

import React, { useState } from 'react';
import { X, Sparkles, Target, Shield, Info, Users, Cpu, Zap, MessageSquare, Trash2, ArrowRight, Search, Loader2, Calendar, Globe, Bell, Check, ChevronRight, Bot, Hammer, Activity } from 'lucide-react';
import { usePipedreamApps } from '@/hooks/usePipedreamApps';
import { usePipedreamTriggers } from '@/hooks/useApi';
import { formatLabel } from '../ui/utils';
import { useDebounce } from '@/hooks/useDebounce';

interface NodeInspectorProps {
  selectedNode: any;
  selectedEdge: any;
  onClose: () => void;
  onUpdateNode: (id: string, data: any) => void;
  onUpdateEdge: (id: string, data: any) => void;
  onDelete: (id: string, type: 'node' | 'edge') => void;
  workerFleet: any[];
  isFleetLoading: boolean;
}

export default function NodeInspector({ 
  selectedNode, 
  selectedEdge, 
  onClose, 
  onUpdateNode, 
  onUpdateEdge,
  onDelete,
  workerFleet,
  isFleetLoading
}: NodeInspectorProps) {
  const [activeTab, setActiveTab] = useState('Prompt');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [triggerMode, setTriggerMode] = useState<'NATIVE' | 'APP'>('NATIVE');
  const [selectedApp, setSelectedApp] = useState<any>(null);
  
  const isManager = selectedNode?.type === 'hub';
  const isEmployee = selectedNode?.type === 'employee';
  const isTrigger = selectedNode?.type === 'trigger';
  const isEdge = !!selectedEdge;
  const isPlaceholder = selectedNode?.data.isPlaceholder;

  // App discovery for triggers
  const { data: pipedreamApps, isLoading: isAppsLoading } = usePipedreamApps(debouncedSearch, 50, 0, !!(isTrigger && triggerMode === 'APP' && !selectedApp));
  const { data: appTriggers, isLoading: isTriggersLoading } = usePipedreamTriggers(selectedApp?.id);

  if (!selectedNode && !selectedEdge) return null;

  const tabs = isEdge ? ['Instructions'] : ['Prompts', 'Skills', 'Knowledge', 'State'];

  const filteredFleet = workerFleet?.filter(w => 
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.workerDescription?.toLowerCase().includes(search.toLowerCase())
  );

  const NATIVE_TRIGGERS = [
    { id: 'webhook', name: 'Webhook', description: 'Trigger via HTTP Request', icon: <Globe size={18} />, color: 'text-blue-500' },
    { id: 'schedule', name: 'Schedule', description: 'Run on a timed interval', icon: <Calendar size={18} />, color: 'text-emerald-500' },
    { id: 'form', name: 'Manual', description: 'Trigger via chat or UI', icon: <Bell size={18} />, color: 'text-orange-500' },
  ];

  return (
    <div className="w-[30rem] bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right-10 duration-500 z-50 h-[calc(100vh-140px)] my-auto right-6 absolute">
      {/* ── HEADER ────────────────────────── */}
      <header className="p-6 pb-2">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <div className="size-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 border-none">
                {isManager ? <Users size={20} strokeWidth={2.5} /> : isEdge ? <MessageSquare size={20} strokeWidth={2.5} /> : <Bot size={20} strokeWidth={2.5} />}
             </div>
             <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-foreground/30">Configuration</span>
                <h2 className="text-lg font-bold tracking-tight text-foreground leading-none truncate max-w-[180px]">
                  {isPlaceholder ? `New ${formatLabel(selectedNode.type)}` : (formatLabel(selectedNode?.data.name || selectedEdge?.id || 'Configuration'))}
                </h2>
             </div>
          </div>
          <button onClick={onClose} className="p-2 bg-foreground/5 rounded-xl text-foreground/40 hover:text-foreground transition-all border border-border/10"><X size={18} strokeWidth={3} /></button>
        </div>

        {!isPlaceholder && (
          <div className="flex items-center gap-6 border-b border-border/10">
             {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-[10px] font-bold uppercase tracking-widest transition-all relative ${
                    activeTab === tab ? 'text-indigo-500' : 'text-foreground/30 hover:text-foreground'
                  }`}
                >
                  {tab}
                  {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 rounded-full" />}
                </button>
             ))}
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar bg-secondary/20">
        {isPlaceholder ? (
           <div className="space-y-4">
              {isTrigger ? (
                <div className="space-y-6">
                  <div className="flex items-center bg-secondary/50 p-1 rounded-2xl border border-border/10">
                    <button 
                      onClick={() => { setTriggerMode('NATIVE'); setSelectedApp(null); }}
                      className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${triggerMode === 'NATIVE' ? 'bg-card text-foreground shadow-sm' : 'text-foreground/30 hover:text-foreground'}`}
                    >
                      Native
                    </button>
                    <button 
                      onClick={() => setTriggerMode('APP')}
                      className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${triggerMode === 'APP' ? 'bg-card text-foreground shadow-sm' : 'text-foreground/30 hover:text-foreground'}`}
                    >
                      Integrations
                    </button>
                  </div>

                  {triggerMode === 'NATIVE' ? (
                    <div className="grid grid-cols-1 gap-3">
                      {NATIVE_TRIGGERS.map(t => (
                        <button
                          key={t.id}
                          onClick={() => onUpdateNode(selectedNode.id, { 
                            ...selectedNode.data, 
                            isPlaceholder: false, 
                            name: t.name, 
                            triggerType: t.id,
                            workerDescription: t.description 
                          })}
                          className="w-full p-5 bg-card border border-border/10 rounded-2xl hover:border-indigo-500/40 transition-all text-left flex items-start gap-4 group shadow-sm"
                        >
                          <div className={`size-12 bg-secondary rounded-xl flex items-center justify-center ${t.color} group-hover:scale-105 transition-transform`}>
                            {t.icon}
                          </div>
                          <div className="min-w-0 flex-1 pt-0.5">
                            <h4 className="text-[11px] font-bold text-foreground uppercase tracking-tight">{t.name}</h4>
                            <p className="text-[10px] font-medium text-foreground/40 italic mt-1">{t.description}</p>
                          </div>
                          <ChevronRight size={14} className="text-foreground/10 mt-2 group-hover:text-primary transition-all" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-6">
                       {!selectedApp ? (
                         <div className="space-y-6">
                            <div className="relative group">
                              <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-foreground/30" />
                              <input 
                                type="text"
                                placeholder="Search connectors..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-card border border-border rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-indigo-500/40 transition-all font-bold text-[10px] uppercase tracking-widest text-foreground placeholder:text-foreground/10"
                              />
                            </div>
                            
                            {isAppsLoading ? (
                               <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary" size={24} /></div>
                            ) : (
                               <div className="grid grid-cols-2 gap-3">
                                  {(pipedreamApps || []).map((app: any) => (
                                    <button
                                      key={app.id}
                                      onClick={() => setSelectedApp(app)}
                                      className="p-5 bg-card border border-border/10 rounded-2xl hover:border-primary/20 transition-all flex flex-col items-center gap-3 group shadow-sm"
                                    >
                                       <div className="size-12 bg-secondary rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-all">
                                          {app.icon ? <img src={app.icon} className="size-8" alt="" /> : <Globe size={18} className="text-foreground/20" />}
                                       </div>
                                       <span className="text-[9px] font-bold uppercase tracking-widest text-foreground/40 group-hover:text-foreground truncate w-full text-center">{formatLabel(app.name)}</span>
                                    </button>
                                  ))}
                               </div>
                            )}
                         </div>
                       ) : (
                         <div className="space-y-6">
                            <button 
                              onClick={() => setSelectedApp(null)}
                              className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-foreground/30 hover:text-primary transition-all"
                            >
                               <ChevronRight className="rotate-180" size={12} strokeWidth={3} /> Change connector
                            </button>

                            <div className="flex items-center gap-4 p-4 bg-primary/5 border border-primary/10 rounded-2xl shadow-inner">
                               <div className="size-12 bg-card rounded-xl flex items-center justify-center border border-border shadow-sm">
                                 <img src={selectedApp.icon} className="size-8" alt="" />
                               </div>
                               <div className="flex flex-col">
                                  <h4 className="text-sm font-bold text-foreground uppercase tracking-tight leading-none">{selectedApp.name}</h4>
                                  <span className="text-[9px] font-bold text-primary uppercase tracking-widest mt-1">Select Trigger</span>
                               </div>
                            </div>

                            {isTriggersLoading ? (
                               <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary" size={24} /></div>
                            ) : (
                               <div className="space-y-3">
                                  {(appTriggers || []).map((trigger: any) => (
                                    <button
                                      key={trigger.key}
                                      onClick={() => onUpdateNode(selectedNode.id, { 
                                        ...selectedNode.data, 
                                        isPlaceholder: false, 
                                        name: trigger.name,
                                        app: selectedApp.id,
                                        triggerKey: trigger.key,
                                        inputSchema: trigger.inputSchema,
                                        triggerType: 'APP',
                                        workerDescription: trigger.description
                                      })}
                                      className="w-full p-4 bg-card border border-border/10 rounded-2xl hover:border-primary/40 transition-all text-left flex items-start gap-4 group shadow-sm"
                                    >
                                       <div className="min-w-0 flex-1 pt-1">
                                          <h4 className="text-[11px] font-bold text-foreground uppercase tracking-tight group-hover:text-primary transition-colors">{trigger.name}</h4>
                                          <p className="text-[9px] font-medium text-foreground/40 line-clamp-2 italic mt-1.5">{trigger.description}</p>
                                       </div>
                                       <div className="size-8 bg-secondary rounded-lg flex items-center justify-center border border-border/10 opacity-0 group-hover:opacity-100 transition-all">
                                         <ArrowRight size={14} className="text-primary" />
                                       </div>
                                    </button>
                                  ))}
                               </div>
                            )}
                         </div>
                       )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="relative group">
                    <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-foreground/20" />
                    <input 
                      type="text"
                      placeholder="Search agents..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full bg-card border border-border rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-indigo-500/40 transition-all font-bold text-[10px] uppercase tracking-widest text-foreground placeholder:text-foreground/10"
                    />
                  </div>

                  <div className="space-y-4">
                     {isFleetLoading ? (
                        <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary" size={24} /></div>
                     ) : (
                        <div className="grid grid-cols-1 gap-3">
                           {filteredFleet.map((worker) => (
                              <button
                                key={worker.id}
                                onClick={() => onUpdateNode(selectedNode.id, { ...worker, isPlaceholder: false })}
                                className="w-full p-5 bg-card border border-border/10 rounded-2xl hover:border-primary/40 transition-all text-left flex items-center gap-4 group shadow-sm"
                              >
                                 <div className="size-12 bg-secondary rounded-xl flex items-center justify-center text-foreground/20 group-hover:text-primary transition-all shadow-inner group-hover:scale-105">
                                    <Bot size={20} strokeWidth={2.5} />
                                 </div>
                                 <div className="min-w-0 flex-1">
                                    <h4 className="text-[11px] font-bold text-foreground uppercase tracking-tight">{formatLabel(worker.name)}</h4>
                                    <p className="text-[9px] font-medium text-foreground/30 line-clamp-1 italic mt-1">{worker.description || 'No description available.'}</p>
                                 </div>
                                 <ArrowRight size={16} className="text-foreground/10 opacity-0 group-hover:opacity-100 transition-all" />
                              </button>
                           ))}
                        </div>
                     )}
                  </div>
                </div>
              )}
           </div>
        ) : (
          /* ACTIVE CONFIGURATION */
          activeTab === 'Prompts' && (
             <div className="space-y-6">
                {isTrigger ? (
                  <div className="space-y-8">
                     <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl shadow-inner">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-500/60 mb-2 block">Trigger Settings</span>
                        <div className="text-xl font-bold text-foreground uppercase tracking-tight">{selectedNode.data.name}</div>
                        <p className="text-[10px] font-medium text-foreground/40 italic mt-2 leading-relaxed">{selectedNode.data.workerDescription}</p>
                     </div>

                     <div className="space-y-6">
                        {Object.entries(selectedNode.data?.inputSchema?.properties || {}).map(([key, prop]: [string, any]) => (
                          <div key={key} className="space-y-2">
                             <label className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest px-1">{prop.description || key}</label>
                             <input 
                               type="text"
                               className="w-full bg-card border border-border rounded-xl px-4 py-3 outline-none focus:border-indigo-500/40 transition-all font-bold text-[10px] text-foreground font-mono"
                               placeholder={`Value for ${key}...`}
                             />
                          </div>
                        ))}
                        {Object.keys(selectedNode.data?.inputSchema?.properties || {}).length === 0 && (
                           <div className="p-8 text-center border border-dashed border-border/20 rounded-2xl opacity-40">
                              <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/40 italic">No manual input required</p>
                           </div>
                        )}
                     </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                     <label className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest px-1">Behavioral Instructions</label>
                      <textarea 
                        value={isManager ? selectedNode?.data.goal : selectedNode?.data.description}
                        onChange={(e) => isManager ? onUpdateNode(selectedNode.id, { ...selectedNode.data, goal: e.target.value }) : null}
                        className="w-full h-80 bg-card border border-border rounded-2xl px-6 py-6 outline-none focus:border-indigo-500/40 transition-all font-bold text-[11px] italic resize-none text-foreground/70 leading-relaxed shadow-sm"
                        placeholder="Define agent behavior and objectives..."
                      />
                  </div>
                )}
             </div>
          )
        )}
      </div>

      {!isPlaceholder && ( activeTab === 'Prompts' || isEdge ) && (
        <footer className="p-6 pt-2 border-t border-border bg-card flex flex-col gap-3">
           <button 
             onClick={() => onDelete(selectedNode?.id || selectedEdge?.id, selectedNode ? 'node' : 'edge')}
             className="w-full py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 active:scale-95"
           >
             <Trash2 size={12} /> Remove Node
           </button>
        </footer>
      )}
    </div>
  );
}
