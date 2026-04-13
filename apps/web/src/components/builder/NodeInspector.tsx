'use client';

import React, { useState } from 'react';
import { X, Sparkles, Target, Shield, Info, Users, Cpu, Zap, MessageSquare, Trash2, ArrowRight, Search, Loader2, Calendar, Globe, Bell, Check, ChevronRight, Bot } from 'lucide-react';
import { usePipedreamApps } from '@/hooks/usePipedreamApps';
import { usePipedreamTriggers } from '@/hooks/useApi';

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
  const [triggerMode, setTriggerMode] = useState<'NATIVE' | 'APP'>('NATIVE');
  const [selectedApp, setSelectedApp] = useState<any>(null);
  
  const isManager = selectedNode?.type === 'hub';
  const isEmployee = selectedNode?.type === 'employee';
  const isTrigger = selectedNode?.type === 'trigger';
  const isEdge = !!selectedEdge;
  const isPlaceholder = selectedNode?.data.isPlaceholder;

  // App discovery for triggers
  const { data: pipedreamApps, isLoading: isAppsLoading } = usePipedreamApps(search, 50, 0, !!(isTrigger && triggerMode === 'APP' && !selectedApp));
  const { data: appTriggers, isLoading: isTriggersLoading } = usePipedreamTriggers(selectedApp?.id);

  if (!selectedNode && !selectedEdge) return null;

  const tabs = isEdge ? ['Directive'] : ['Prompt', 'Tools', 'Knowledge', 'Memory'];

  const filteredFleet = workerFleet?.filter(w => 
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.workerDescription?.toLowerCase().includes(search.toLowerCase())
  );

  const NATIVE_TRIGGERS = [
    { id: 'webhook', name: 'Inbound Webhook', description: 'Trigger via HTTP Request', icon: <Globe size={18} />, color: 'text-blue-400' },
    { id: 'schedule', name: 'Recurring Schedule', description: 'Run on a CRON interval', icon: <Calendar size={18} />, color: 'text-emerald-400' },
    { id: 'form', name: 'User Interaction', description: 'Trigger via manual form/chat', icon: <Bell size={18} />, color: 'text-purple-400' },
  ];

  return (
    <div className="absolute top-24 right-10 bottom-24 w-[28rem] bg-card/60 backdrop-blur-3xl border border-border/20 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right-10 duration-700 z-50">
      {/* Header */}
      <header className="p-6 border-b border-border/10">
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center text-accent">
                {isManager ? <Users size={16} /> : isEdge ? <MessageSquare size={16} /> : <Cpu size={16} />}
             </div>
             <h2 className="text-[10px] font-black uppercase tracking-[0.2em] italic text-foreground">
               {isPlaceholder ? `Configure ${selectedNode.type}` : (selectedNode?.data.name || selectedEdge?.id || 'Unit Config')}
             </h2>
          </div>
          <button onClick={onClose} className="p-2 text-muted hover:text-foreground transition-all"><X size={16} strokeWidth={3} /></button>
        </div>

        {!isPlaceholder && (
          <div className="flex items-center gap-6 px-2 border-b border-border/5">
             {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-[9px] font-black uppercase tracking-widest transition-all relative ${
                    activeTab === tab ? 'text-accent' : 'text-muted hover:text-foreground'
                  }`}
                >
                  {tab}
                  {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
                </button>
             ))}
          </div>
        )}
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar bg-background/20">
        {isPlaceholder ? (
           <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              {isTrigger ? (
                <div className="space-y-8">
                  {/* Trigger Mode Toggle */}
                  <div className="flex items-center bg-foreground/[0.03] p-1.5 rounded-2xl border border-border/10">
                    <button 
                      onClick={() => { setTriggerMode('NATIVE'); setSelectedApp(null); }}
                      className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${triggerMode === 'NATIVE' ? 'bg-background border border-border/10 text-accent shadow-lg' : 'text-muted opacity-40 hover:opacity-100'}`}
                    >
                      Native
                    </button>
                    <button 
                      onClick={() => setTriggerMode('APP')}
                      className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${triggerMode === 'APP' ? 'bg-background border border-border/10 text-accent shadow-lg' : 'text-muted opacity-40 hover:opacity-100'}`}
                    >
                      App Event
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
                          className="w-full p-5 bg-foreground/[0.03] border border-border/10 rounded-[2rem] hover:bg-foreground/[0.05] hover:border-accent/40 transition-all text-left flex items-start gap-4 group"
                        >
                          <div className={`w-12 h-12 bg-background border border-border/10 rounded-2xl flex items-center justify-center ${t.color} group-hover:scale-110 transition-transform`}>
                            {t.icon}
                          </div>
                          <div className="min-w-0 flex-1 pt-1">
                            <h4 className="text-[11px] font-black uppercase tracking-tight text-foreground">{t.name}</h4>
                            <p className="text-[9px] font-bold text-muted italic mt-1">{t.description}</p>
                          </div>
                          <ChevronRight size={14} className="text-muted mt-2 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-6">
                       {!selectedApp ? (
                         <div className="space-y-6">
                            <div className="relative group">
                              <Search size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-muted opacity-40 group-focus-within:opacity-100 transition-opacity" />
                              <input 
                                type="text"
                                placeholder="Search apps (Slack, Gmail...)"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-foreground/[0.03] border border-border/20 rounded-2xl pl-14 pr-6 py-4 outline-none focus:border-accent transition-all font-black text-[10px] uppercase tracking-widest italic text-foreground"
                              />
                            </div>
                            
                            {isAppsLoading ? (
                               <div className="p-20 flex flex-col items-center justify-center gap-4">
                                  <Loader2 className="animate-spin text-accent" size={24} />
                               </div>
                            ) : (
                               <div className="grid grid-cols-2 gap-3">
                                  {(pipedreamApps || []).map((app: any) => (
                                    <button
                                      key={app.id}
                                      onClick={() => setSelectedApp(app)}
                                      className="p-4 bg-foreground/[0.03] border border-border/10 rounded-2xl hover:bg-foreground/[0.05] hover:border-accent/60 transition-all text-center flex flex-col items-center gap-3 group"
                                    >
                                       <div className="w-12 h-12 bg-background border border-border/10 rounded-xl flex items-center justify-center shadow-inner group-hover:shadow-accent/20 transition-all">
                                          {app.icon ? <img src={app.icon} className="w-8 h-8 grayscale group-hover:grayscale-0 transition-all" alt="" /> : <Globe size={20} className="text-muted" />}
                                       </div>
                                       <span className="text-[9px] font-black uppercase tracking-widest text-muted group-hover:text-foreground truncate w-full">{app.name}</span>
                                    </button>
                                  ))}
                               </div>
                            )}
                         </div>
                       ) : (
                         <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                           <button 
                             onClick={() => setSelectedApp(null)}
                             className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-muted hover:text-accent transition-all mb-4"
                           >
                              <ChevronRight className="rotate-180" size={10} /> Change Platform
                           </button>

                           <div className="flex items-center gap-4 p-4 bg-accent/5 border border-accent/20 rounded-2xl mb-8">
                              <img src={selectedApp.icon} className="w-10 h-10" alt="" />
                              <div>
                                 <h4 className="text-[11px] font-black uppercase tracking-widest text-foreground">{selectedApp.name}</h4>
                                 <p className="text-[8px] font-bold text-accent italic uppercase tracking-widest">Select event source</p>
                              </div>
                           </div>

                           {isTriggersLoading ? (
                              <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-accent" /></div>
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
                                     className="w-full p-5 bg-foreground/[0.03] border border-border/10 rounded-[1.5rem] hover:bg-foreground/[0.05] hover:border-accent/40 transition-all text-left flex items-start gap-4 group"
                                   >
                                      <div className="min-w-0 flex-1">
                                         <h4 className="text-[10px] font-black uppercase tracking-tight text-foreground group-hover:text-accent transition-colors">{trigger.name}</h4>
                                         <p className="text-[9px] font-bold text-muted line-clamp-2 italic mt-1">{trigger.description}</p>
                                      </div>
                                      <ArrowRight size={14} className="text-muted opacity-0 group-hover:opacity-100 transition-all mt-1" />
                                   </button>
                                 ))}
                                 {appTriggers?.length === 0 && (
                                    <div className="p-10 text-center space-y-3">
                                       <Info size={24} className="mx-auto text-muted opacity-20" />
                                       <p className="text-[9px] font-black uppercase tracking-widest text-muted opacity-40 italic">No native events found for this platform yet.</p>
                                    </div>
                                 )}
                              </div>
                           )}
                         </div>
                       )}
                    </div>
                  )}
                </div>
              ) : (
                /* Agent / Fleet Discovery (Original Logic) */
                <div className="space-y-6">
                  <div className="relative group">
                    <Search size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-muted opacity-40 group-focus-within:opacity-100 transition-opacity" />
                    <input 
                      type="text"
                      placeholder="Search agency marketplace..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full bg-foreground/[0.03] border border-border/20 rounded-2xl pl-14 pr-6 py-4 outline-none focus:border-accent transition-all font-black text-[10px] uppercase tracking-widest italic text-foreground"
                    />
                  </div>

                  <div className="space-y-4">
                     <div className="flex items-center justify-between px-2">
                        <span className="text-[8px] font-black uppercase tracking-widest text-muted">Company Registry</span>
                        <span className="text-[8px] font-black uppercase tracking-widest text-accent italic">Browse all 1000+ units</span>
                     </div>
                     
                     {isFleetLoading ? (
                        <div className="p-20 flex flex-col items-center justify-center gap-4">
                           <Loader2 className="animate-spin text-accent" size={24} />
                        </div>
                     ) : (
                        <div className="grid grid-cols-1 gap-3">
                           {filteredFleet.map((worker) => (
                              <button
                                key={worker.id}
                                onClick={() => onUpdateNode(selectedNode.id, { ...worker, isPlaceholder: false })}
                                className="w-full p-4 bg-foreground/[0.03] border border-border/10 rounded-2xl hover:bg-foreground/[0.05] hover:border-accent/40 transition-all text-left flex items-start gap-4 group"
                              >
                                 <div className="w-10 h-10 bg-background border border-border/10 rounded-xl flex items-center justify-center text-muted group-hover:text-accent transition-colors">
                                    <Cpu size={18} />
                                 </div>
                                 <div className="min-w-0 flex-1">
                                    <h4 className="text-[10px] font-black uppercase tracking-tight text-foreground truncate">{worker.name}</h4>
                                    <p className="text-[8px] font-bold text-muted line-clamp-1 italic mt-1">{worker.description || 'No description provided.'}</p>
                                 </div>
                                 <ArrowRight size={14} className="text-muted opacity-0 group-hover:opacity-100 transition-all" />
                              </button>
                           ))}
                        </div>
                     )}
                  </div>
                </div>
              )}
           </div>
        ) : (
          /* Rest of existing tabs logic */
          activeTab === 'Prompt' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {isTrigger ? (
                  <div className="space-y-8">
                     <div className="p-5 bg-accent/5 border border-accent/20 rounded-3xl">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-accent mb-2 italic">Active Trigger:</h4>
                        <div className="text-[12px] font-black text-foreground uppercase tracking-tight">{selectedNode.data.name}</div>
                        <p className="text-[9px] font-bold text-muted italic mt-1">{selectedNode.data.workerDescription}</p>
                     </div>

                     <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                           <span className="text-[9px] font-black uppercase tracking-widest text-muted">Configuration Parameters</span>
                           <Sparkles size={12} className="text-accent/40" />
                        </div>
                        
                        {/* Dynamic Field Rendering Interface */}
                        <div className="space-y-5">
                           {Object.entries(selectedNode.data?.inputSchema?.properties || {}).map(([key, prop]: [string, any]) => (
                             <div key={key} className="space-y-2.5">
                                <label className="text-[9px] font-black text-muted uppercase tracking-[0.15em] px-1">{prop.description || key}</label>
                                <input 
                                  type="text"
                                  className="w-full bg-foreground/[0.03] border border-border/20 rounded-2xl px-6 py-4 outline-none focus:border-accent transition-all font-bold text-[10px] italic text-foreground/80"
                                  placeholder={`Enter ${key}...`}
                                />
                             </div>
                           ))}
                           {Object.keys(selectedNode.data?.inputSchema?.properties || {}).length === 0 && (
                              <div className="p-8 text-center border border-dashed border-border/10 rounded-3xl opacity-40">
                                 <p className="text-[9px] font-black uppercase tracking-widest text-muted italic">Self-executing trigger — no initial parameters required.</p>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                     <label className="text-[9px] font-black text-accent uppercase tracking-widest italic">Strategic Role:</label>
                      <textarea 
                        value={isManager ? selectedNode?.data.goal : selectedNode?.data.description}
                        onChange={(e) => isManager ? onUpdateNode(selectedNode.id, { ...selectedNode.data, goal: e.target.value }) : null}
                        className="w-full bg-foreground/[0.03] border border-border/20 rounded-2xl px-6 py-4 outline-none focus:border-accent transition-all font-bold text-[10px] italic resize-none h-64 text-foreground/80 leading-relaxed"
                      />
                  </div>
                )}
             </div>
          )
        )}
      </div>

      {!isPlaceholder && (
        <footer className="p-6 border-t border-border/10 bg-background/40 flex flex-col gap-4">
           <button className="w-full py-4 bg-foreground/10 hover:bg-foreground/20 border border-border/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all italic">
              Save Strategy Protocol
           </button>
           <button 
             onClick={() => onDelete(selectedNode?.id || selectedEdge?.id, selectedNode ? 'node' : 'edge')}
             className="text-[9px] font-black uppercase tracking-widest text-red-500/50 hover:text-red-500 transition-all flex items-center justify-center gap-2"
           >
             Terminate Unit
           </button>
        </footer>
      )}
    </div>
  );
}
