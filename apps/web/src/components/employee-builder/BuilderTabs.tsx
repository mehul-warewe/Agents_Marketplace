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
      toast.error('Please fill in agent name and description first.');
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
    <div className="max-w-[1400px] mx-auto min-h-full">
      {activeSubTab === 'prompt' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
          
          {/* ── IDENTITY HEADER ────────────────────────── */}
          <header className="flex items-start gap-8 pb-10 border-b border-border/40 group relative">
             <div className="w-24 h-24 rounded-3xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20 shadow-xl overflow-hidden shrink-0 relative">
                <div className="absolute inset-0 bg-indigo-500/5 blur-xl pointer-events-none" />
                <Bot size={44} strokeWidth={2.5} className="relative z-10" />
             </div>
             
             <div className="flex-1 space-y-3 pt-2">
                <div className="flex items-center gap-4">
                   <input 
                     value={localEmployee.name}
                     onChange={e => setLocalEmployee({ ...localEmployee, name: e.target.value })}
                     placeholder="Name your agent..."
                     className="bg-transparent border-none text-3xl font-bold tracking-tight text-foreground outline-none focus:ring-0 p-0 placeholder:text-muted/20"
                   />
                   <div className="flex items-center gap-1.5 px-3 py-1 bg-foreground/5 rounded-lg border border-border/40 text-[10px] font-bold text-muted opacity-60">
                     <Shield size={12} /> Verified identity
                   </div>
                </div>
                <input 
                  value={localEmployee.description || ''}
                  onChange={e => setLocalEmployee({ ...localEmployee, description: e.target.value })}
                  placeholder="Give this agent a short description..."
                  className="w-full bg-transparent border-none text-sm font-medium text-muted outline-none p-0 focus:ring-0 placeholder:text-muted/10 italic"
                />
             </div>
             <button className="p-3 border border-border/40 rounded-2xl hover:bg-foreground/5 text-muted transition-all active:scale-90">
               <MoreHorizontal size={20} />
             </button>
          </header>

          {/* ── TOOLBAR ───────────────────────── */}
          <div className="flex items-center gap-4 py-2">
             <button 
               onClick={() => setShowModelSelector(true)}
               className="h-12 border border-primary/40 rounded-2xl px-6 flex items-center justify-between gap-6 hover:bg-primary/5 transition-all text-sm font-bold truncate max-w-sm group shadow-xl shadow-primary/5 bg-primary/5 border-primary/40"
             >
                <div className="flex items-center gap-3">
                   <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                      <Zap size={14} className="fill-current" />
                   </div>
                   <span className="text-primary font-bold text-xs">
                     {selectedModel?.name || 'Loading fleet...'}
                   </span>
                </div>
                <ChevronDown size={14} className="text-primary opacity-40 group-hover:opacity-100 transition-all shrink-0" />
             </button>

             <button
               onClick={handleDraftWithAI}
               disabled={isDrafting}
               className="h-12 bg-foreground/5 hover:bg-foreground/10 border border-border/40 rounded-2xl px-8 flex items-center gap-3 transition-all disabled:opacity-50"
             >
                {isDrafting ? <Activity size={16} className="text-primary animate-spin" /> : <Sparkles size={16} className="text-primary" strokeWidth={2.5} />}
                <span className="text-xs font-bold text-foreground">{isDrafting ? 'Drafting...' : 'Draft with AI'}</span>
             </button>
          </div>

          {/* ── INSTRUCTIONS ──────────────────────────── */}
          <section className="relative group pt-6">
            <textarea 
              value={localEmployee.systemPrompt}
              onChange={e => setLocalEmployee({ ...localEmployee, systemPrompt: e.target.value })}
              placeholder="Provide instructions for the agent to follow..."
              className="w-full min-h-[600px] bg-transparent border-none text-xl font-medium leading-relaxed outline-none focus:ring-0 transition-all resize-none no-scrollbar placeholder:text-muted/20 placeholder:italic"
            />
            
            <div className="absolute bottom-6 right-6 flex items-center gap-6">
               <div className="px-4 py-2 bg-background border border-border/40 rounded-xl text-[10px] font-bold shadow-xl text-muted/60 flex items-center gap-3">
                  <Terminal size={12} /> Character count: {localEmployee.systemPrompt?.length || 0}
               </div>
               <button
                 onClick={handleDraftWithAI}
                 disabled={isDrafting}
                 className="p-4 bg-primary/10 text-primary border border-primary/20 rounded-2xl hover:scale-110 active:scale-90 transition-all shadow-xl shadow-primary/5 disabled:opacity-50"
               >
                  {isDrafting ? <Activity size={24} className="animate-spin" /> : <Wand2 size={24} strokeWidth={2.5} />}
               </button>
            </div>
          </section>

          {/* ── TEMPERATURE SLIDER ────────────────────────── */}
          <section className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-bold text-foreground">Temperature</label>
                <p className="text-[10px] text-muted/60 mt-1">0 = precise and focused, 1 = creative and exploratory</p>
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
              className="w-full h-2 bg-foreground/10 rounded-full appearance-none cursor-pointer accent-primary"
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
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-12 h-full flex flex-col pt-10">
           <header className="flex justify-between items-end border-b border-border/40 pb-10">
              <div className="space-y-4">
                 <h2 className="text-4xl font-bold tracking-tight text-foreground leading-none">Skills and Tools</h2>
                 <p className="text-muted text-xs font-medium opacity-60 leading-none">Equip your agent with specialized functional skill modules.</p>
              </div>
              <button 
                onClick={() => setShowSkillPicker(true)} 
                className="px-12 py-5 bg-primary text-primary-foreground rounded-2xl text-xs font-bold shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
              >
                <Plus size={18} strokeWidth={3} /> Add Skill
              </button>
           </header>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
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
                 <div className="col-span-full py-40 bg-card rounded-[3rem] border border-border/60 border-dashed flex flex-col items-center justify-center text-center opacity-40">
                    <Layers size={48} className="text-muted mb-8" />
                    <p className="text-xl font-bold tracking-tight">No skills assigned</p>
                    <p className="text-xs font-medium mt-2 max-w-xs uppercase tracking-widest">Connect functional expertise to enable complex tasks.</p>
                 </div>
              )}
           </div>
        </motion.div>
      )}

      {activeSubTab === 'knowledge' && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-12 pt-10">
           <header className="flex justify-between items-end border-b border-border/40 pb-10">
              <div className="space-y-4">
                 <h2 className="text-4xl font-bold tracking-tight text-foreground leading-none">Knowledge Base</h2>
                 <p className="text-muted text-xs font-medium opacity-60 leading-none">Provide documentation and data for semantic grounding.</p>
              </div>
              <button 
                onClick={() => setShowKnowledgeCreator(true)}
                className="px-12 py-5 bg-foreground text-background rounded-2xl text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-xl"
              >
                Upload Data
              </button>
           </header>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
              {localEmployee.knowledgeIds?.map((kid: string) => (
                 <KnowledgeAssignmentCard 
                    key={kid} 
                    knowledgeId={kid} 
                    onRemove={() => removeKnowledge(kid)} 
                 />
              ))}
              {!localEmployee.knowledgeIds?.length && (
                <div className="col-span-full py-40 border border-border/60 border-dashed rounded-[3rem] text-center opacity-40">
                   <FileText size={48} className="mx-auto text-muted mb-8" />
                   <p className="text-xl font-bold">No knowledge provided</p>
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
    <div className="max-w-[1400px] mx-auto space-y-12 pt-10 pb-32">
       <header className="flex justify-between items-end border-b border-border/40 pb-10">
          <div className="space-y-4">
             <h2 className="text-4xl font-bold tracking-tight text-foreground">Activity History</h2>
             <p className="text-muted text-xs font-medium opacity-60 leading-none italic">Review the execution logs and performance of your agent.</p>
          </div>
          <div className="flex gap-4">
             <button className="px-10 py-5 bg-foreground/5 rounded-2xl text-xs font-bold hover:bg-foreground/10 transition-all opacity-40">Clear Logs</button>
             <button className="px-10 py-5 bg-primary/10 text-primary rounded-2xl text-xs font-bold border border-primary/20 transition-all shadow-xl shadow-primary/5">Export Activity</button>
          </div>
       </header>
       <TelemetryView runs={runs || []} onSelect={setSelectedRun} />
    </div>
  );
}
