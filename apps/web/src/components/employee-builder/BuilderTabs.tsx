'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Terminal, Layers, Activity, Brain, FileUp, 
  ExternalLink, HelpCircle, Bot, MoreHorizontal, Plus, 
  ChevronDown, Settings, Shield, Wand2, FileText, Zap
} from 'lucide-react';
import { SkillAssignmentCard, KnowledgeAssignmentCard } from './AssignmentCards';
import { TelemetryView } from './TelemetryView';
import ModelSelector from './ModelSelector';
import RunTabContent from './RunTabContent';
import { useModels } from '@/hooks/useModels';
import { useToast } from '@/components/ui/Toast';
import api from '@/lib/api';

interface BuilderTabsProps {
  activeSubTab: string;
  localEmployee: any;
  setLocalEmployee: (val: any) => void;
  removeSkill: (sid: string) => void;
  setShowSkillPicker: (val: boolean) => void;
  removeKnowledge: (kid: string) => void;
  setShowKnowledgeCreator: (val: boolean) => void;
  allSkills?: any[];
}

export function BuildTabContent({ 
  activeSubTab, 
  localEmployee, 
  setLocalEmployee, 
  removeSkill, 
  setShowSkillPicker,
  removeKnowledge,
  setShowKnowledgeCreator,
  allSkills
}: BuilderTabsProps) {
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const { data: models } = useModels();
  const toast = useToast();

  const selectedModel = models?.find(m => m.id === localEmployee.model) ||
                       models?.find(m => m.id === 'google/gemini-2.0-flash-001');

  const handleDraftWithAI = async () => {
    if (!localEmployee.name || !localEmployee.description) {
      toast.error('Please enter a name and description first.');
      return;
    }

    setIsDrafting(true);
    try {
      const { data } = await api.post('/employees/draft-prompt', {
        name: localEmployee.name,
        description: localEmployee.description,
        model: localEmployee.model || 'google/gemini-2.0-flash-001'
      });
      setLocalEmployee({ ...localEmployee, systemPrompt: data.prompt });
      toast.success('System prompt generated successfully.');
    } catch (err: any) {
      toast.error(`Failed to generate prompt: ${err.message}`);
    } finally {
      setIsDrafting(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto min-h-full">
      {activeSubTab === 'prompt' && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5 py-4">
          
          {/* ── AGENT IDENTITY ────────────────────────── */}
          <div className="bg-secondary/20 rounded-xl border border-border/40 p-5 relative group">
            <header className="flex items-center gap-6 relative z-10">
               <div className="size-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shrink-0 group-hover:scale-105 transition-transform duration-500">
                  <Bot size={24} strokeWidth={2.5} />
               </div>
               
               <div className="flex-1 space-y-1">
                  <div className="flex flex-col">
                     <span className="text-[8px] font-bold uppercase tracking-widest text-foreground/30">Employee Identity</span>
                     <input 
                       value={localEmployee.name}
                       onChange={e => setLocalEmployee({ ...localEmployee, name: e.target.value })}
                       placeholder="Enter employee name..."
                       className="bg-transparent border-none text-2xl font-bold tracking-tight text-foreground outline-none w-full transition-all placeholder:text-foreground/10"
                     />
                  </div>
               </div>
               
               <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-card text-foreground rounded-lg text-[8px] font-bold uppercase tracking-widest border border-border/10 shadow-sm">
                    <Shield size={10} className="text-emerald-500" /> Active Registry
                  </div>
               </div>
            </header>
          </div>

          <div className="px-2 space-y-0.5">
            <span className="text-[8px] font-bold uppercase tracking-widest text-foreground/20">Short Description</span>
            <input 
              value={localEmployee.description || ''}
              onChange={e => setLocalEmployee({ ...localEmployee, description: e.target.value })}
              placeholder="Briefly describe the employee's role..."
              className="w-full bg-transparent border-none text-sm font-medium text-foreground/60 outline-none transition-all placeholder:text-foreground/10"
            />
          </div>

          {/* ── MODEL CONFIG ───────────────────────── */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border/40 pb-6 px-4">
               <div className="flex flex-col">
                  <h3 className="text-sm font-bold text-foreground">Model Configuration</h3>
                  <p className="text-[10px] font-medium text-foreground/20 uppercase tracking-widest">Configure base engine and behavior settings</p>
               </div>
               
               <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowModelSelector(true)}
                    className="h-9 border border-border/40 bg-foreground/5 rounded-lg px-4 flex items-center justify-between gap-4 hover:bg-foreground/10 transition-all text-[11px] font-bold min-w-[200px] shadow-sm focus:bg-card"
                  >
                     <div className="flex items-center gap-2">
                        <Zap size={12} className="text-foreground fill-current" />
                        <span className="text-foreground tracking-tight">
                          {selectedModel?.name?.replace('Google: ', '') || 'Select Model'}
                        </span>
                     </div>
                     <ChevronDown size={12} className="text-foreground/20" />
                  </button>

                  <button
                    onClick={handleDraftWithAI}
                    disabled={isDrafting}
                    className="h-9 bg-primary text-primary-foreground hover:scale-105 active:scale-95 rounded-lg px-6 flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg text-[9px] font-bold uppercase tracking-widest"
                  >
                     {isDrafting ? <Activity size={12} className="animate-spin" /> : <Sparkles size={12} strokeWidth={2.5} />}
                     <span>{isDrafting ? 'Generating...' : 'Assist with AI'}</span>
                  </button>
               </div>
            </div>

            {/* ── SYSTEM PROMPT EDITOR ──────────────────────────── */}
            <div className="relative group">
               <div className="absolute top-6 left-8 flex items-center gap-3 pointer-events-none z-10">
                  <Terminal size={14} className="text-foreground/20" />
                  <span className="text-[9px] font-bold text-foreground/20 uppercase tracking-widest">Behavioral Instructions</span>
               </div>
               
               <textarea 
                 value={localEmployee.systemPrompt}
                 onChange={e => setLocalEmployee({ ...localEmployee, systemPrompt: e.target.value })}
                 placeholder="Provide detailed instructions for the employee to follow..."
                 className="w-full min-h-[350px] bg-secondary/50 border border-border/40 rounded-xl text-[11px] leading-relaxed p-6 pt-12 outline-none focus:border-border/60 focus:bg-card transition-all resize-none placeholder:text-foreground/5 font-medium font-mono shadow-inner"
               />
               
               <div className="absolute bottom-6 right-6 flex items-center gap-4">
                  <div className="px-3 py-1 bg-card border border-border/40 rounded-md text-[8px] font-bold text-foreground/40 flex items-center gap-2 shadow-sm uppercase tracking-widest">
                     <Layers size={10} /> {localEmployee.systemPrompt?.length || 0} chars
                  </div>
               </div>
            </div>
          </div>

          {/* ── TEMPERATURE ────────────────────────── */}
          <section className="space-y-4 px-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-bold text-foreground">Temperature</label>
                <p className="text-[10px] text-muted/60 mt-0.5">Focus vs Creativity</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-primary">{(localEmployee.temperature ?? 0.1).toFixed(2)}</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={localEmployee.temperature ?? 0.1}
              onChange={(e) => setLocalEmployee({ ...localEmployee, temperature: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-foreground/10 rounded-full appearance-none cursor-pointer accent-primary"
            />
          </section>

          <AnimatePresence>
             {showModelSelector && (
               <ModelSelector 
                 value={localEmployee.model || 'google/gemini-2.0-flash-001'}
                 onChange={val => setLocalEmployee({ ...localEmployee, model: val })}
                 onClose={() => setShowModelSelector(false)}
               />
             )}
          </AnimatePresence>
        </motion.div>
      )}

      {activeSubTab === 'tools' && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 h-full flex flex-col pt-6">
           <header className="flex justify-between items-end border-b border-border pb-6 px-4">
              <div className="space-y-1">
                 <h2 className="text-2xl font-bold tracking-tight text-foreground">Employee Skills</h2>
                 <p className="text-muted text-sm font-medium">Enable specialized tools and functional capabilities for this employee.</p>
              </div>
              <button 
                onClick={() => setShowSkillPicker(true)} 
                className="h-10 px-6 bg-primary text-primary-foreground rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 outline-none"
              >
                <Plus size={16} strokeWidth={2.5} /> Add Skill
              </button>
           </header>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-32 px-4">
              {localEmployee.skillIds?.map((sid: string) => (
                 <SkillAssignmentCard 
                    key={sid} 
                    skillId={sid} 
                    instruction={localEmployee.skillInstructions?.[sid]}
                    allSkills={allSkills}
                    onRemove={() => removeSkill(sid)} 
                 />
              ))}
              {!localEmployee.skillIds?.length && (
                 <div className="col-span-full py-40 border border-border/40 border-dashed rounded-3xl flex flex-col items-center justify-center text-center opacity-40">
                    <Layers size={40} className="text-muted mb-6" />
                    <p className="text-lg font-bold">No skills assigned</p>
                    <p className="text-[10px] font-medium mt-1 uppercase tracking-widest">Add skills to enable complex task execution</p>
                 </div>
              )}
           </div>
        </motion.div>
      )}

      {activeSubTab === 'knowledge' && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 pt-6 px-4">
           <header className="flex justify-between items-end border-b border-border pb-6">
              <div className="space-y-1">
                 <h2 className="text-2xl font-bold tracking-tight text-foreground">Knowledge Base</h2>
                 <p className="text-muted text-sm font-medium">Attach documents and background context to anchor the employee's knowledge.</p>
              </div>
              <button 
                onClick={() => setShowKnowledgeCreator(true)}
                className="h-10 px-6 bg-foreground text-background rounded-xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-lg outline-none"
              >
                Upload Data
              </button>
           </header>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-32">
              {localEmployee.knowledgeIds?.map((kid: string) => (
                 <KnowledgeAssignmentCard 
                    key={kid} 
                    knowledgeId={kid} 
                    onRemove={() => removeKnowledge(kid)} 
                 />
              ))}
              {!localEmployee.knowledgeIds?.length && (
                <div className="col-span-full py-40 border border-border/40 border-dashed rounded-3xl text-center opacity-40">
                   <FileText size={40} className="mx-auto text-muted mb-6" />
                   <p className="text-lg font-bold">No knowledge sources</p>
                </div>
              )}
           </div>
        </motion.div>
      )}
    </div>
  );
}

export function MonitorTabContent({ runs, setSelectedRun }: any) {
  return (
    <div className="max-w-[1200px] mx-auto space-y-8 pt-6 pb-32 px-4">
       <header className="flex justify-between items-end border-b border-border pb-6">
          <div className="space-y-1">
             <h2 className="text-2xl font-bold tracking-tight text-foreground">Activity History</h2>
             <p className="text-muted text-sm font-medium">Review execution logs and performance metrics for this agent.</p>
          </div>
          <div className="flex gap-3">
             <button className="h-9 px-4 bg-muted text-foreground rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-muted/80 transition-all outline-none">Clear Logs</button>
             <button className="h-9 px-4 bg-card text-foreground border border-border rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-all shadow-sm outline-none">Export</button>
          </div>
       </header>
       <TelemetryView runs={runs || []} onSelect={setSelectedRun} />
    </div>
  );
}
