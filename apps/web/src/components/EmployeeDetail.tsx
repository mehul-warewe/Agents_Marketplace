'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  useEmployee, useAssignSkill, useRemoveSkill, 
  useEmployeeRuns, useRunEmployee, useAssignKnowledge, useRemoveKnowledge,
  useUpdateEmployee
} from '@/hooks/useEmployees';
import { usePublishedSkills } from '@/hooks/useSkills';
import { useKnowledge, useCreateKnowledge } from '@/hooks/useKnowledge';
import { 
  Bot, Zap, Settings, Plus, X, ArrowLeft, Target, Terminal, Activity, 
  Layers, CheckCircle, Clock, XCircle, Play, MoreHorizontal, ShieldCheck,
  BookOpen, FileText, Share2, Database, Search, MessageSquare, 
  Bell, Brain, Variable, ChevronRight, Save, Trash2, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/Toast';

type TabType = 'build' | 'run' | 'monitor';
type SubTabType = 'prompt' | 'tools' | 'knowledge' | 'triggers' | 'memory' | 'variables';

export default function EmployeeDetail() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const toast = useToast();
  
  const [activeTab, setActiveTab] = useState<TabType>('build');
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('prompt');
  
  const [localEmployee, setLocalEmployee] = useState<any>(null);
  const [missionText, setMissionText] = useState('');
  const [showSkillPicker, setShowSkillPicker] = useState(false);
  const [showKnowledgeCreator, setShowKnowledgeCreator] = useState(false);
  const [newKnowledge, setNewKnowledge] = useState({ title: '', content: '' });

  const { data: employee, isLoading: empLoading } = useEmployee(id as string);
  const { data: allSkills } = usePublishedSkills();
  const { data: myKnowledge } = useKnowledge();
  const { data: runs } = useEmployeeRuns(id as string);

  const { mutate: updateEmployee, isPending: isUpdating } = useUpdateEmployee();
  const { mutate: assignSkill } = useAssignSkill();
  const { mutate: removeSkill } = useRemoveSkill();
  const { mutate: runEmployee, isPending: isRunningMission } = useRunEmployee();
  const { mutate: assignKnowledge } = useAssignKnowledge();
  const { mutate: removeKnowledge } = useRemoveKnowledge();
  const { mutate: createKnowledge } = useCreateKnowledge();

  useEffect(() => {
    if (employee) {
      setLocalEmployee(employee);
    }
  }, [employee]);

  const handleSave = () => {
    const { id: _, createdAt: __, updatedAt: ___, ...updateData } = localEmployee;
    updateEmployee({ id: id as string, data: updateData }, {
      onSuccess: () => toast.success('Operative profile synced to grid.'),
      onError: (err: any) => toast.error(`Sync failure: ${err.message}`)
    });
  };

  const handleRunMission = () => {
    if (!missionText.trim()) return;
    runEmployee({ employeeId: id as string, task: missionText }, {
      onSuccess: (data) => {
        toast.success('Mission protocol initiated.');
        setMissionText('');
        setActiveTab('monitor');
      },
      onError: (err: any) => toast.error(`Mission failure: ${err.message}`)
    });
  };

  if (empLoading || !localEmployee) return (
     <div className="flex-1 bg-background flex flex-col items-center justify-center p-12 h-full">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="mt-8 text-muted font-black text-[10px] uppercase tracking-[0.4em]">Mounting Operative Volume...</p>
     </div>
  );

  return (
    <div className="flex-1 bg-background flex flex-col h-full overflow-hidden font-inter text-foreground">
      
      {/* ── TOP NAVIGATION BAR ────────────────────────────────────────── */}
      <header className="h-16 border-b border-border/40 bg-card/50 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-6">
           <button onClick={() => router.push('/employees')} className="p-2 hover:bg-foreground/5 rounded-xl transition-all text-muted hover:text-foreground">
              <ArrowLeft size={18} strokeWidth={2.5} />
           </button>
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center border border-primary/20 shadow-lg">
                <Bot size={18} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-sm font-black italic uppercase tracking-tighter leading-none">{localEmployee.name}</h1>
                <span className="text-[8px] font-black text-primary uppercase tracking-[0.3em] opacity-60">Published</span>
              </div>
           </div>
        </div>

        <nav className="flex items-center bg-foreground/5 rounded-2xl p-1 border border-border/40">
           {(['build', 'run', 'monitor'] as TabType[]).map(tab => (
             <button 
               key={tab} 
               onClick={() => setActiveTab(tab)}
               className={`px-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all ${activeTab === tab ? 'bg-card text-foreground shadow-xl border border-border/60' : 'text-muted hover:text-foreground'}`}
             >
               {tab}
             </button>
           ))}
        </nav>

        <div className="flex items-center gap-3">
           <button className="flex items-center gap-2 px-4 py-2 hover:bg-foreground/5 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest text-muted">
              <Share2 size={14} /> Share
           </button>
           <div className="w-px h-6 bg-border/40" />
           <button 
             onClick={handleSave}
             disabled={isUpdating}
             className="flex items-center gap-3 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-black text-[10px] uppercase tracking-[0.3em] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
           >
              {isUpdating ? <Clock size={14} className="animate-spin" /> : <Save size={14} strokeWidth={3} />}
              Save_Profile
           </button>
        </div>
      </header>

      {/* ── MAIN CONTENT AREA ─────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT SUB-NAV (Mini Sidebar) */}
        <aside className="w-20 border-r border-border/40 bg-card/30 flex flex-col items-center py-8 gap-1 shrink-0">
           {[
             { id: 'prompt', icon: MessageSquare, label: 'Prompt' },
             { id: 'tools', icon: Zap, label: 'Tools' },
             { id: 'knowledge', icon: BookOpen, label: 'Knowledge' },
             { id: 'triggers', icon: Target, label: 'Triggers' },
             { id: 'memory', icon: Brain, label: 'Memory' },
             { id: 'variables', icon: Variable, label: 'Variables' },
           ].map(item => (
             <button 
               key={item.id}
               onClick={() => { setActiveTab('build'); setActiveSubTab(item.id as any); }}
               className={`w-14 h-14 flex flex-col items-center justify-center gap-1.5 rounded-2xl transition-all group relative ${activeSubTab === item.id && activeTab === 'build' ? 'bg-primary/10 text-primary border border-primary/20 shadow-inner' : 'text-muted hover:text-foreground hover:bg-foreground/5'}`}
               title={item.label}
             >
               <item.icon size={20} strokeWidth={activeSubTab === item.id ? 3 : 2} />
               <span className="text-[7px] font-black uppercase tracking-tight opacity-40 group-hover:opacity-100">{item.label}</span>
               {activeSubTab === item.id && activeTab === 'build' && (
                 <motion.div layoutId="left-nav-indicator" className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-l-full shadow-lg h-10" />
               )}
             </button>
           ))}
           <div className="mt-auto pt-6 border-t border-border/40 w-12 flex flex-col items-center gap-2">
              <button className="p-3 text-muted hover:text-foreground" title="Settings"><Settings size={18} /></button>
              <button className="p-3 text-muted hover:text-foreground" title="Alerts"><Bell size={18} /></button>
           </div>
        </aside>

        {/* CENTER CONTENT */}
        <main className="flex-1 flex flex-col bg-background overflow-hidden relative">
           
           <AnimatePresence mode="wait">
             {activeTab === 'build' && (
               <motion.div 
                 key="build-view"
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: 20 }}
                 className="flex-1 flex flex-col p-10 lg:p-14 overflow-y-auto no-scrollbar max-w-5xl mx-auto w-full space-y-12"
               >
                  {activeSubTab === 'prompt' && (
                    <div className="space-y-10 animate-fade-in">
                       <header className="space-y-4">
                          <h2 className="text-4xl font-black italic uppercase tracking-tighter">Instructions</h2>
                          <p className="text-muted text-xs font-bold uppercase tracking-[0.2em] opacity-50">Define the core persona and operational logic for this operative.</p>
                       </header>
                       
                       <section className="bg-card rounded-[2.5rem] border border-border/60 p-10 shadow-xl space-y-10">
                          <div className="space-y-6">
                             <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic">Operative_Directive (Instructions)</label>
                                <button className="text-[9px] font-black uppercase tracking-widest text-muted hover:text-primary transition-colors flex items-center gap-2">
                                   Refine with AI <Sparkles size={12} className="text-primary" />
                                </button>
                             </div>
                             <textarea 
                                value={localEmployee.systemPrompt || ''}
                                onChange={e => setLocalEmployee({ ...localEmployee, systemPrompt: e.target.value })}
                                placeholder="E.G. YOU ARE AN EXPERT SOCIAL MEDIA MANAGER SPECIALISING IN INSTAGRAM AND LINKEDIN CONTENT..."
                                className="w-full bg-background border border-border/40 rounded-[2rem] p-10 text-sm font-bold uppercase focus:outline-none focus:border-primary transition-all min-h-[500px] resize-none leading-relaxed tracking-tight shadow-inner"
                             />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="p-8 bg-foreground/[0.03] border border-border/40 rounded-3xl space-y-4">
                                <div className="flex items-center justify-between">
                                   <h4 className="text-[10px] font-black uppercase tracking-widest text-muted">ModelSelection</h4>
                                   <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                </div>
                                <select className="w-full bg-card border border-border/60 rounded-xl px-4 py-3 text-[10px] font-black uppercase italic outline-none focus:border-primary">
                                   <option>Gemini 1.5 Pro (Optimized)</option>
                                   <option>GPT-4o Complex Intelligence</option>
                                   <option>Claude 3.5 Sonnet Precision</option>
                                </select>
                             </div>
                             <div className="p-8 bg-foreground/[0.03] border border-border/40 rounded-3xl space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted">Verification</h4>
                                <button className="w-full py-3 bg-foreground text-background rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] transition-all">
                                   Test_Agent_Loop
                                </button>
                             </div>
                          </div>
                       </section>
                    </div>
                  )}

                  {activeSubTab === 'tools' && (
                    <div className="space-y-10 animate-fade-in">
                       <div className="flex justify-between items-end">
                          <header className="space-y-4">
                             <h2 className="text-4xl font-black italic uppercase tracking-tighter">Tools & Logic</h2>
                             <p className="text-muted text-xs font-bold uppercase tracking-[0.2em] opacity-50">Assigned vertical functional modules for complex operations.</p>
                          </header>
                          <button onClick={() => setShowSkillPicker(true)} className="bg-primary text-primary-foreground px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-xl shadow-primary/20 hover:scale-[1.05] transition-all flex items-center gap-3">
                             <Plus size={16} strokeWidth={3} /> Add_Module
                          </button>
                       </div>
                       
                       <div className="grid grid-cols-1 gap-6">
                          {localEmployee.skillIds?.map((sid: string) => (
                             <SkillAssignmentCard key={sid} skillId={sid} onRemove={() => removeSkill({ employeeId: id as string, skillId: sid })} />
                          ))}
                          {!localEmployee.skillIds?.length && <EmptyState icon={Layers} title="Tabula Rasa" desc="No logic modules assigned to this operative yet." />}
                       </div>
                    </div>
                  )}

                  {activeSubTab === 'knowledge' && (
                    <div className="space-y-10 animate-fade-in">
                       <div className="flex justify-between items-end">
                          <header className="space-y-4">
                             <h2 className="text-4xl font-black italic uppercase tracking-tighter">Knowledge Retrieval</h2>
                             <p className="text-muted text-xs font-bold uppercase tracking-[0.2em] opacity-50">Grounding documentation and specialized memory clusters.</p>
                          </header>
                          <button onClick={() => setShowKnowledgeCreator(true)} className="bg-foreground text-background px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-xl hover:scale-[1.05] transition-all flex items-center gap-3">
                             <Plus size={16} strokeWidth={3} /> Inject_Knowledge
                          </button>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {localEmployee.knowledgeIds?.map((kid: string) => (
                             <KnowledgeAssignmentCard key={kid} knowledgeId={kid} onRemove={() => removeKnowledge({ employeeId: id as string, knowledgeId: kid })} />
                          ))}
                          {!localEmployee.knowledgeIds?.length && <EmptyState icon={Database} title="Memory Empty" desc="No private knowledge grounded to this operative." />}
                       </div>
                    </div>
                  )}
               </motion.div>
             )}

             {activeTab === 'run' && (
                <motion.div 
                  key="run-view"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  className="flex-1 flex flex-col p-14 h-full"
                >
                   <div className="max-w-4xl mx-auto w-full h-full flex flex-col gap-10">
                      <header className="space-y-4 flex justify-between items-end">
                         <div>
                            <h2 className="text-4xl font-black italic uppercase tracking-tighter">Interactive_Mission</h2>
                            <p className="text-muted text-xs font-bold uppercase tracking-[0.2em] opacity-50">Direct execution context for the operative.</p>
                         </div>
                         <div className="px-6 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[9px] font-black uppercase tracking-[0.4em]">Grid_Active</div>
                      </header>

                      <div className="flex-1 bg-card rounded-[3rem] border border-primary/20 p-10 shadow-2xl flex flex-col relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
                            <Terminal size={300} />
                         </div>
                         <div className="flex-1 flex flex-col gap-8 relative z-10">
                            <div className="flex items-center gap-4 text-primary">
                               <Terminal size={20} strokeWidth={3} />
                               <span className="text-[11px] font-black uppercase tracking-[0.5em] italic">Command_Buffer</span>
                            </div>
                            <textarea 
                               value={missionText}
                               onChange={e => setMissionText(e.target.value)}
                               placeholder="SPECIFY THE MISSION OBJECTIVE..."
                               className="flex-1 bg-background/50 border border-border/40 rounded-[2rem] p-12 text-sm font-bold uppercase focus:outline-none focus:border-primary transition-all resize-none shadow-inner leading-relaxed"
                            />
                            <button 
                               onClick={handleRunMission}
                               disabled={isRunningMission || !missionText.trim()}
                               className="h-24 bg-primary text-primary-foreground rounded-[2rem] font-black text-sm uppercase tracking-[0.5em] shadow-2xl shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-6"
                            >
                               {isRunningMission ? <Clock className="animate-spin" /> : <Play className="fill-current" />}
                               INITIALIZE_MISSION_SEQUENCE
                            </button>
                         </div>
                      </div>
                   </div>
                </motion.div>
             )}

             {activeTab === 'monitor' && (
                <motion.div 
                  key="monitor-view"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex-1 p-14 overflow-y-auto no-scrollbar"
                >
                   <div className="max-w-[1400px] mx-auto space-y-12">
                      <header className="flex justify-between items-end">
                         <div className="space-y-4">
                            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-foreground">Mission_Telemetry</h2>
                            <p className="text-muted text-xs font-bold uppercase tracking-[0.2em] opacity-40">Live stream of operative execution cycles and handoffs.</p>
                         </div>
                         <div className="flex gap-4">
                            <button className="px-8 py-4 bg-foreground/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-foreground/10 transition-all">Clear_Logs</button>
                            <button className="px-8 py-4 bg-primary/10 text-primary rounded-2xl text-[10px] font-black uppercase tracking-widest border border-primary/20 transition-all">Export_Report</button>
                         </div>
                      </header>
                      <TelemetryView runs={runs || []} />
                   </div>
                </motion.div>
             )}
           </AnimatePresence>
        </main>

        {/* RIGHT CONFIGURATION PANE (Sub-panels) */}
        <aside className="w-[450px] border-l border-border/40 bg-card/10 flex flex-col shrink-0 overflow-y-auto no-scrollbar">
           
           <div className="p-10 space-y-12 pb-32">
              {/* Profile Config */}
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted italic">Operative_ID</h3>
                    <div className="px-3 py-1 bg-foreground/5 rounded-lg text-[8px] font-mono opacity-40">HEX::{String(id).slice(0, 12).toUpperCase()}</div>
                 </div>
                 <div className="p-8 bg-foreground/[0.03] border border-border/40 rounded-3xl space-y-6 shadow-inner">
                    <div className="space-y-3">
                       <label className="text-[8px] font-black uppercase tracking-widest text-muted opacity-60">Designation</label>
                       <input 
                         value={localEmployee.name}
                         onChange={e => setLocalEmployee({ ...localEmployee, name: e.target.value })}
                         className="w-full bg-transparent border-b border-border/60 py-2 font-black italic uppercase tracking-tighter text-xl focus:outline-none focus:border-primary transition-all"
                       />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[8px] font-black uppercase tracking-widest text-muted opacity-60">Tactical_Bio</label>
                       <textarea 
                         value={localEmployee.description || ''}
                         onChange={e => setLocalEmployee({ ...localEmployee, description: e.target.value })}
                         className="w-full bg-transparent border-b border-border/60 py-2 font-bold uppercase tracking-tight text-[10px] focus:outline-none focus:border-primary transition-all resize-none h-16 no-scrollbar"
                       />
                    </div>
                 </div>
              </div>

              {/* Triggers Section */}
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <Target size={16} className="text-muted" />
                       <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted italic">Triggers</h3>
                    </div>
                    <button className="p-2 hover:bg-foreground/5 rounded-lg"><Plus size={14} /></button>
                 </div>
                 <div className="space-y-4">
                    <div className="p-6 bg-card border border-border/60 rounded-2xl flex items-center justify-between group hover:border-primary/40 transition-all">
                       <div className="flex items-center gap-4">
                          <Clock size={16} className="text-primary" />
                          <div>
                             <p className="text-[10px] font-black uppercase tracking-tight">Recurring Sync</p>
                             <p className="text-[8px] font-black text-muted opacity-40">DAILY @ 09:00 AM</p>
                          </div>
                       </div>
                       <ChevronRight size={14} className="text-muted group-hover:text-primary" />
                    </div>
                    <button className="w-full py-4 border border-dashed border-border/60 rounded-2xl text-[9px] font-black uppercase tracking-widest text-muted hover:bg-foreground/5 transition-all">Add_Trigger_Event</button>
                 </div>
              </div>

              {/* Tools Section */}
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <Zap size={16} className="text-muted" />
                       <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted italic">Logic Modules</h3>
                    </div>
                    <button onClick={() => setShowSkillPicker(true)} className="p-2 hover:bg-foreground/5 rounded-lg"><Plus size={14} /></button>
                 </div>
                 <div className="space-y-4">
                    {localEmployee.skillIds?.map((sid: string) => {
                      const skill = allSkills?.find((s: any) => s.id === sid);
                      return (
                        <div key={sid} className="p-6 bg-card border border-border/60 rounded-2xl flex items-center justify-between group hover:bg-primary/5 hover:border-primary/40 transition-all">
                           <div className="flex items-center gap-4">
                              <Zap size={16} className="text-primary" />
                              <p className="text-[10px] font-black uppercase tracking-tight">{skill?.name || 'LOGIC_NODE'}</p>
                           </div>
                           <button onClick={() => removeSkill({ employeeId: id as string, skillId: sid })} className="opacity-0 group-hover:opacity-100 p-2 text-muted hover:text-red-500 transition-all">
                              <X size={14} />
                           </button>
                        </div>
                      )
                    })}
                    {!localEmployee.skillIds?.length && (
                      <div className="p-8 border border-dashed border-border/60 rounded-2xl text-center text-[9px] font-black uppercase tracking-widest text-muted/20 italic">No assigned logic units</div>
                    )}
                 </div>
              </div>

              {/* Knowledge Base */}
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <Database size={16} className="text-muted" />
                       <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted italic">Grounding</h3>
                    </div>
                    <button onClick={() => setShowKnowledgeCreator(true)} className="p-2 hover:bg-foreground/5 rounded-lg"><Plus size={14} /></button>
                 </div>
                 <div className="space-y-4">
                    {localEmployee.knowledgeIds?.map((kid: string) => {
                       const item = myKnowledge?.find((k: any) => k.id === kid);
                       return (
                         <div key={kid} className="p-6 bg-card border border-border/60 rounded-2xl flex items-center justify-between group hover:border-foreground/40 transition-all">
                            <div className="flex items-center gap-4">
                               <BookOpen size={16} className="text-muted" />
                               <p className="text-[10px] font-black uppercase tracking-tight truncate max-w-[200px]">{item?.title || 'MEMORY_CELL'}</p>
                            </div>
                            <button onClick={() => removeKnowledge({ employeeId: id as string, knowledgeId: kid })} className="p-2 text-muted hover:text-red-500"><X size={14} /></button>
                         </div>
                       )
                    })}
                    {!localEmployee.knowledgeIds?.length && (
                      <div className="p-8 border border-dashed border-border/60 rounded-2xl text-center text-[9px] font-black uppercase tracking-widest text-muted/20 italic">Memory cluster void</div>
                    )}
                 </div>
              </div>

              {/* Variables */}
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <Variable size={16} className="text-muted" />
                       <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted italic">Variables</h3>
                    </div>
                    <button className="p-2 hover:bg-foreground/5 rounded-lg"><Plus size={14} /></button>
                 </div>
                 <div className="bg-foreground/[0.03] border border-border/40 rounded-3xl p-8 space-y-4 text-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted opacity-40 leading-relaxed italic">Want to reuse values throughout your agent? Turn them into a variable that you can access with {'{{'}.</p>
                    <button className="w-full py-4 bg-foreground text-background rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl">Manage_Variables</button>
                 </div>
              </div>

           </div>

        </aside>
      </div>

      {/* MODALS (Shared) */}
      <AnimatePresence>
         {showSkillPicker && (
            <SkillPickerModal 
              onClose={() => setShowSkillPicker(false)} 
              onSelect={(val: any) => {
                 assignSkill({ employeeId: id as string, skillId: val.id, instruction: val.instruction }, {
                    onSuccess: () => {
                       setShowSkillPicker(false);
                       toast.success('Skill logical-link established.');
                    }
                 });
              }}
            />
         )}
         {showKnowledgeCreator && (
            <KnowledgeCreatorModal 
               onClose={() => setShowKnowledgeCreator(false)} 
               onSave={(val: any) => {
                  createKnowledge(val, {
                     onSuccess: (data) => {
                        assignKnowledge({ employeeId: id as string, knowledgeId: data.id }, {
                           onSuccess: () => {
                              setShowKnowledgeCreator(false);
                              toast.success('Internal knowledge grounded.');
                           }
                        });
                     }
                  });
               }}
            />
         )}
      </AnimatePresence>
    </div>
  );
}

// ── REFACTORED SUB-COMPONENTS ──────────────────────────────────────────

function SkillAssignmentCard({ skillId, onRemove }: { skillId: string, onRemove: () => void }) {
  const { data: allSkills } = usePublishedSkills();
  const skill = allSkills?.find((s: any) => s.id === skillId);
  if (!skill) return null;

  return (
    <div className="bg-card rounded-3xl border border-border/60 p-8 flex flex-col gap-6 group hover:border-primary/30 transition-all duration-500 shadow-xl overflow-hidden relative">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shadow-inner">
               <Zap size={20} strokeWidth={3} className="fill-current" />
            </div>
            <div>
               <h4 className="text-lg font-black italic tracking-tighter uppercase leading-none">{skill.name}</h4>
               <span className="text-[7px] font-black text-muted uppercase tracking-[0.4em] opacity-40">MODULE_MAPPED</span>
            </div>
         </div>
         <div className="flex items-center gap-3">
            <button className="p-3 bg-foreground/5 hover:bg-foreground/10 rounded-xl transition-all">
               <Settings size={14} />
            </button>
            <button onClick={onRemove} className="p-3 bg-foreground/5 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all">
               <Trash2 size={14} />
            </button>
         </div>
      </div>
      <p className="text-muted text-[10px] font-bold uppercase tracking-widest line-clamp-2 opacity-50 min-h-[3ch] leading-relaxed">{skill.description}</p>
      <div className="pt-6 border-t border-border/40 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <Layers size={14} className="text-primary" />
            <span className="text-[10px] font-black italic uppercase tracking-tighter">{skill.workflow?.nodes?.length || 0} Nodes</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[8px] font-black uppercase text-muted">SECURED</span>
         </div>
      </div>
    </div>
  );
}

function KnowledgeAssignmentCard({ knowledgeId, onRemove }: { knowledgeId: string, onRemove: () => void }) {
  const { data: allKnowledge } = useKnowledge();
  const item = allKnowledge?.find((k: any) => k.id === knowledgeId);
  if (!item) return null;

  return (
    <div className="bg-card rounded-3xl border border-border/60 p-8 flex flex-col gap-6 group hover:border-foreground/20 transition-all duration-500 shadow-xl relative overflow-hidden">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-foreground/5 text-foreground rounded-xl flex items-center justify-center">
               <BookOpen size={20} strokeWidth={2.5} />
            </div>
            <div>
               <h4 className="text-lg font-black italic tracking-tighter uppercase leading-none truncate max-w-[150px]">{item.title}</h4>
               <span className="text-[7px] font-black text-muted uppercase tracking-[0.4em] opacity-40">MEMORY_CELL</span>
            </div>
         </div>
         <button onClick={onRemove} className="p-3 bg-foreground/5 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all">
            <Trash2 size={14} />
         </button>
      </div>
      <p className="text-muted text-[10px] font-bold uppercase tracking-widest line-clamp-3 opacity-50 leading-relaxed min-h-[4ch]">{item.content}</p>
      <div className="pt-6 border-t border-border/40 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="px-3 py-1 bg-foreground/5 rounded-lg text-[7px] font-black uppercase tracking-widest text-muted">VEC_01</div>
            <div className="px-3 py-1 bg-foreground/5 rounded-lg text-[7px] font-black uppercase tracking-widest text-muted">{item.content.length} CHARS</div>
         </div>
      </div>
    </div>
  );
}

function TelemetryView({ runs }: { runs: any[] }) {
   if (!runs || runs.length === 0) return <EmptyState icon={Activity} title="No Signals" desc="Telemetry stream waiting for first execution protocol." />;
   return (
      <div className="bg-card rounded-[2.5rem] border border-border/60 overflow-hidden shadow-2xl">
         <div className="divide-y divide-border/20">
            {runs.map((run: any) => (
               <div key={run.id} className="p-8 flex items-center justify-between hover:bg-foreground/[0.01] transition-all group">
                  <div className="flex items-center gap-8">
                     <div className={`p-4 rounded-xl ${run.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : run.status === 'failed' ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary animate-pulse'}`}>
                        <Activity size={20} strokeWidth={3} />
                     </div>
                     <div>
                        <div className="flex items-center gap-4 mb-2">
                           <span className="font-black italic uppercase tracking-tighter text-sm">RUN::${run.id.slice(0, 8)}</span>
                           {run.skillName && (
                              <span className="px-3 py-1 bg-primary/10 text-primary text-[8px] font-black uppercase rounded-lg border border-primary/20">{run.skillName}</span>
                           )}
                        </div>
                        <div className="text-[8px] font-black text-muted uppercase tracking-[0.3em] opacity-40">
                           INIT_TIME: {new Date(run.startTime).toLocaleString()}
                        </div>
                     </div>
                  </div>
                  <div className="flex items-center gap-10">
                     <div className={`flex items-center gap-3 px-6 py-2 rounded-full border ${run.status === 'completed' ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20' : run.status === 'failed' ? 'bg-red-500/5 text-red-500 border-red-500/20' : 'bg-primary/5 text-primary border-primary/20'} text-[8px] font-black uppercase tracking-[0.4em]`}>
                        {run.status === 'completed' ? <CheckCircle size={12} strokeWidth={3} /> : run.status === 'failed' ? <XCircle size={12} strokeWidth={3} /> : <Clock size={12} strokeWidth={3} className="animate-spin" />}
                        {run.status}
                     </div>
                     <button className="flex items-center gap-2 p-3 text-muted hover:text-foreground transition-all hover:bg-foreground/5 rounded-xl text-[9px] font-black opacity-20 hover:opacity-100">
                        View_Detail <ChevronRight size={14} />
                     </button>
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
}

function EmptyState({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
   return (
      <div className="w-full py-32 flex flex-col items-center justify-center bg-card/30 rounded-[3rem] border-2 border-border/40 border-dashed text-center">
         <div className="w-20 h-20 bg-foreground/[0.03] rounded-[1.75rem] flex items-center justify-center text-muted/20 mb-8 shadow-inner">
            <Icon size={32} />
         </div>
         <h3 className="text-xl font-black italic uppercase tracking-tighter text-muted/60">{title}</h3>
         <p className="text-[9px] text-muted/30 font-bold uppercase tracking-[0.3em] mt-3">{desc}</p>
      </div>
   );
}

function SkillPickerModal({ onClose, onSelect }: any) {
   const { data: allSkills } = usePublishedSkills();
   const [selectedId, setSelectedId] = useState<string | null>(null);
   const [instruction, setInstruction] = useState('');

   return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/95 backdrop-blur-3xl" onClick={onClose} />
         <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-5xl max-h-[85vh] bg-card border border-border/60 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-10 border-b border-border/40 flex justify-between items-center bg-foreground/[0.01]">
               <div className="space-y-2">
                  <div className="flex items-center gap-3 text-primary">
                     <Layers size={18} strokeWidth={3} />
                     <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">CapabilityMount</span>
                  </div>
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter">Mount_Logic_Module</h2>
               </div>
               <button onClick={onClose} className="p-4 bg-foreground/5 rounded-2xl hover:bg-foreground/10 transition-all font-black text-xs uppercase group">
                  <X size={20} />
               </button>
            </div>
            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {allSkills?.map((skill: any) => (
                     <div key={skill.id} onClick={() => setSelectedId(skill.id)} className={`p-8 rounded-3xl border-2 transition-all cursor-pointer relative group ${selectedId === skill.id ? 'bg-primary/5 border-primary shadow-xl shadow-primary/5' : 'bg-background border-border/40 hover:border-primary/20'}`}>
                        <div className="flex items-center justify-between mb-6">
                           <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${selectedId === skill.id ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-foreground/5 text-muted group-hover:bg-primary/10 group-hover:text-primary'}`}>
                              <Zap size={20} strokeWidth={3} />
                           </div>
                           {selectedId === skill.id && <CheckCircle className="text-primary" size={24} strokeWidth={3} />}
                        </div>
                        <h4 className="text-xl font-black italic uppercase tracking-tighter mb-2">{skill.name}</h4>
                        <p className="text-[9px] text-muted font-bold uppercase opacity-40 line-clamp-2 tracking-widest leading-relaxed">{skill.description}</p>
                     </div>
                  ))}
               </div>
               {selectedId && (
                  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 bg-foreground/[0.03] p-10 rounded-[2.5rem] border border-primary/20">
                     <div className="flex items-center gap-3 ml-2 mb-2">
                        <Terminal size={14} className="text-primary" />
                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Directive</label>
                     </div>
                     <textarea value={instruction} onChange={e => setInstruction(e.target.value)} placeholder="SPECIFY MISSION CONTEXT FOR THIS LOGIC MODULE..."
                        className="w-full bg-background border border-border/40 rounded-2xl p-8 text-xs font-bold uppercase focus:outline-none focus:border-primary transition-all resize-none shadow-inner min-h-[140px]" />
                  </motion.div>
               )}
            </div>
            <div className="p-10 border-t border-border/40 bg-foreground/[0.01]">
               <button onClick={() => onSelect({ id: selectedId, instruction })} disabled={!selectedId} className="w-full h-16 bg-primary text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-[0.4em] hover:scale-[1.01] transition-all disabled:opacity-50 shadow-2xl flex items-center justify-center gap-4">
                  Deploy_Module <CheckCircle size={18} strokeWidth={3} />
               </button>
            </div>
         </motion.div>
      </div>
   );
}

function KnowledgeCreatorModal({ onClose, onSave }: any) {
  const [data, setData] = useState({ title: '', content: '' });
   return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/95 backdrop-blur-3xl" onClick={onClose} />
         <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-3xl bg-card border border-border/60 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col p-12 space-y-10">
            <div className="flex justify-between items-center">
               <div className="space-y-2">
                  <div className="flex items-center gap-3 text-primary">
                     <BookOpen size={20} strokeWidth={3} />
                     <span className="text-[10px] font-black uppercase tracking-[0.5em] italic">KnowledgeGrounding</span>
                  </div>
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Inject_Memory_Cluster</h2>
               </div>
               <button onClick={onClose} className="p-4 bg-foreground/5 rounded-2xl hover:bg-foreground/10 transition-all">
                  <X size={20} />
               </button>
            </div>
            <div className="space-y-8">
               <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted ml-4">Descriptor</label>
                  <input value={data.title} onChange={e => setData({ ...data, title: e.target.value })} placeholder="E.G. COMPANY_DATA_V1" 
                     className="w-full bg-background border border-border/40 rounded-xl px-6 py-4 text-xs font-black uppercase focus:border-primary focus:outline-none shadow-inner" />
               </div>
               <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted ml-4">Content_Stream</label>
                  <textarea value={data.content} onChange={e => setData({ ...data, content: e.target.value })} placeholder="PASTE FULL TEXTUAL DATA..." 
                     className="w-full bg-background border border-border/40 rounded-2xl px-6 py-6 text-xs font-bold uppercase focus:border-primary focus:outline-none shadow-inner min-h-[250px] resize-none" />
               </div>
            </div>
            <button onClick={() => onSave(data)} disabled={!data.title || !data.content} className="w-full h-16 bg-foreground text-background rounded-2xl font-black text-xs uppercase tracking-[0.4em] hover:bg-primary hover:text-white transition-all shadow-xl">
               Mount_Knowledge_Node
            </button>
         </motion.div>
      </div>
   );
}

function Sparkles(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  )
}
