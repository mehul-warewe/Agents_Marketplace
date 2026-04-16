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
          <header className="flex items-start gap-6 pb-8 border-b border-border/40 group relative">
             <div className="size-16 rounded-[10px] bg-primary text-primary-foreground flex items-center justify-center border border-border shadow-sm overflow-hidden shrink-0 relative">
                <div className="absolute inset-0 bg-white/5 blur-xl pointer-events-none" />
                <Bot size={28} strokeWidth={2.5} className="relative z-10" />
             </div>
             
             <div className="flex-1 space-y-2 pt-1">
                <div className="flex items-center gap-4">
                   <input 
                     value={localEmployee.name}
                     onChange={e => setLocalEmployee({ ...localEmployee, name: e.target.value })}
                     placeholder="Name your agent..."
                     className="bg-transparent border-none text-3xl font-bold font-display tracking-tight text-foreground outline-none focus:ring-[3px] focus:ring-primary/20 rounded-[10px] px-2 py-1 -ml-2 transition-all placeholder:text-muted/40"
                   />
                   <div className="flex items-center gap-1.5 px-2 py-0.5 bg-muted rounded-[10px] border border-border text-[10px] font-bold text-muted-foreground">
                     <Shield size={12} /> Verified identity
                   </div>
                </div>
                <input 
                  value={localEmployee.description || ''}
                  onChange={e => setLocalEmployee({ ...localEmployee, description: e.target.value })}
                  placeholder="Give this agent a short description..."
                  className="w-full bg-transparent border-none text-sm font-medium text-muted outline-none px-2 py-1 -ml-2 rounded-[10px] focus:ring-[3px] focus:ring-primary/20 transition-all placeholder:text-muted/40 italic"
                />
             </div>
             <button className="p-2 border border-border rounded-[10px] hover:bg-muted text-muted-foreground transition-all active:scale-95 focus-visible:ring-[3px] focus-visible:ring-primary/20 outline-none">
               <MoreHorizontal size={20} />
             </button>
          </header>

          {/* ── TOOLBAR ───────────────────────── */}
          <div className="flex items-center gap-3 py-2">
             <button 
               onClick={() => setShowModelSelector(true)}
               className="h-9 border border-border rounded-[10px] px-4 flex items-center justify-between gap-4 hover:bg-muted transition-all text-sm font-medium truncate max-w-sm group bg-background focus-visible:ring-[3px] focus-visible:ring-primary/20 outline-none"
             >
                <div className="flex items-center gap-2">
                   <div className="w-5 h-5 rounded drop-shadow-sm flex items-center justify-center border border-border bg-card">
                      <Zap size={12} className="text-foreground" />
                   </div>
                   <span className="text-foreground font-medium text-sm">
                     {selectedModel?.name || 'Loading fleet...'}
                   </span>
                </div>
                <ChevronDown size={14} className="text-muted group-hover:text-foreground transition-all shrink-0" />
             </button>

             <button
               onClick={handleDraftWithAI}
               disabled={isDrafting}
               className="h-9 bg-primary text-primary-foreground hover:opacity-90 rounded-[10px] px-4 flex items-center gap-2 transition-all disabled:opacity-50 focus-visible:ring-[3px] focus-visible:ring-primary/20 outline-none text-sm font-medium"
             >
                {isDrafting ? <Activity size={14} className="animate-spin" /> : <Sparkles size={14} strokeWidth={2.5} />}
                <span>{isDrafting ? 'Drafting...' : 'Draft with AI'}</span>
             </button>
          </div>

          {/* ── INSTRUCTIONS ──────────────────────────── */}
          <section className="relative group pt-4">
            <textarea 
              value={localEmployee.systemPrompt}
              onChange={e => setLocalEmployee({ ...localEmployee, systemPrompt: e.target.value })}
              placeholder="Provide instructions for the agent to follow..."
              className="w-full min-h-[500px] bg-card border border-border rounded-[10px] text-sm leading-relaxed p-6 outline-none focus:border-border focus:ring-[3px] focus:ring-primary/20 transition-all resize-none shadow-sm placeholder:text-muted"
            />
            
            <div className="absolute bottom-6 right-6 flex items-center gap-4">
               <div className="px-3 py-1.5 bg-background border border-border rounded-[10px] text-xs font-medium text-muted flex items-center gap-2 shadow-sm">
                  <Terminal size={14} /> {localEmployee.systemPrompt?.length || 0} chars
               </div>
               <button
                 onClick={handleDraftWithAI}
                 disabled={isDrafting}
                 className="p-3 bg-primary text-primary-foreground rounded-[10px] hover:opacity-90 active:scale-95 transition-all shadow-sm disabled:opacity-50 focus-visible:ring-[3px] focus-visible:ring-primary/20 outline-none"
               >
                  {isDrafting ? <Activity size={20} className="animate-spin" /> : <Wand2 size={20} strokeWidth={2.5} />}
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
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 h-full flex flex-col pt-6">
           <header className="flex justify-between items-end border-b border-border pb-6">
              <div className="space-y-2">
                 <h2 className="text-3xl font-bold font-display tracking-tight text-foreground">Skills and Tools</h2>
                 <p className="text-muted text-sm font-medium">Equip your agent with specialized functional skill modules.</p>
              </div>
              <button 
                onClick={() => setShowSkillPicker(true)} 
                className="h-9 px-4 bg-primary text-primary-foreground rounded-[10px] text-sm font-medium shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 focus-visible:ring-[3px] focus-visible:ring-primary/20 outline-none"
              >
                <Plus size={16} strokeWidth={2.5} /> Add Skill
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
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 pt-6">
           <header className="flex justify-between items-end border-b border-border pb-6">
              <div className="space-y-2">
                 <h2 className="text-3xl font-bold font-display tracking-tight text-foreground">Knowledge Base</h2>
                 <p className="text-muted text-sm font-medium">Provide documentation and data for semantic grounding.</p>
              </div>
              <button 
                onClick={() => setShowKnowledgeCreator(true)}
                className="h-9 px-4 bg-foreground text-background rounded-[10px] text-sm font-medium hover:opacity-90 active:scale-95 transition-all shadow-sm focus-visible:ring-[3px] focus-visible:ring-foreground/20 outline-none"
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
    <div className="max-w-[1400px] mx-auto space-y-8 pt-6 pb-32">
       <header className="flex justify-between items-end border-b border-border pb-6">
          <div className="space-y-2">
             <h2 className="text-3xl font-bold font-display tracking-tight text-foreground">Activity History</h2>
             <p className="text-muted text-sm font-medium">Review the execution logs and performance of your agent.</p>
          </div>
          <div className="flex gap-3">
             <button className="h-9 px-4 bg-muted text-foreground rounded-[10px] text-sm font-medium hover:bg-muted/80 transition-all focus-visible:ring-[3px] focus-visible:ring-primary/20 outline-none">Clear Logs</button>
             <button className="h-9 px-4 bg-background text-foreground border border-border rounded-[10px] text-sm font-medium hover:bg-muted transition-all shadow-sm focus-visible:ring-[3px] focus-visible:ring-primary/20 outline-none">Export Activity</button>
          </div>
       </header>
       <TelemetryView runs={runs || []} onSelect={setSelectedRun} />
    </div>
  );
}
