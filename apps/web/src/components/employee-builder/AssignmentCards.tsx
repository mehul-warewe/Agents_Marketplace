'use client';

import React from 'react';
import { Zap, Settings, Trash2, Layers, BookOpen, Terminal } from 'lucide-react';
import { usePublishedSkills } from '@/hooks/useSkills';
import { useKnowledge } from '@/hooks/useKnowledge';

interface SkillAssignmentCardProps {
  skillId: string;
  instruction?: string;
  allSkills?: any[];
  onRemove: () => void;
}

export function SkillAssignmentCard({ skillId, instruction, allSkills, onRemove }: SkillAssignmentCardProps) {
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
               <span className="text-[10px] font-bold text-muted uppercase tracking-wider opacity-60">Skill connected</span>
            </div>
         </div>
         <button onClick={onRemove} className="p-3 bg-foreground/5 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all">
            <Trash2 size={14} />
         </button>
      </div>
      
      <div className="space-y-4">
         <p className="text-muted text-[10px] font-bold uppercase tracking-widest line-clamp-2 opacity-50 leading-relaxed">{skill.description}</p>
         {instruction && (
            <div className="bg-primary/[0.03] border border-primary/10 rounded-xl p-4 space-y-2">
               <div className="flex items-center gap-2 text-[8px] font-black text-primary uppercase tracking-widest">
                  <Terminal size={10} /> Directive
               </div>
               <p className="text-[10px] font-medium text-foreground/80 leading-relaxed">"{instruction}"</p>
            </div>
         )}
      </div>

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

interface KnowledgeAssignmentCardProps {
  knowledgeId: string;
  onRemove: () => void;
}

export function KnowledgeAssignmentCard({ knowledgeId, onRemove }: KnowledgeAssignmentCardProps) {
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
               <h4 className="text-lg font-black italic tracking-tighter uppercase leading-none truncate max-w-[180px]">{item.title}</h4>
               <span className="text-[10px] font-bold text-muted uppercase tracking-wider opacity-60">Knowledge integrated</span>
            </div>
         </div>
         <button onClick={onRemove} className="p-3 bg-foreground/5 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all">
            <Trash2 size={14} />
         </button>
      </div>
      <p className="text-muted text-[10px] font-bold uppercase tracking-widest line-clamp-2 opacity-10 leading-relaxed italic select-none">DATA_REDACTED_FOR_SECURITY_OVERSIGHT</p>
      <div className="pt-6 border-t border-border/40 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <span className="text-[8px] font-black uppercase text-muted tracking-widest">TYPE: DOCUMENT</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[8px] font-black uppercase text-muted">INDEXED</span>
         </div>
      </div>
    </div>
  );
}
