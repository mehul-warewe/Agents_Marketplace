'use client';

import React from 'react';
import { Zap, BookOpen, Trash2, Layers, Terminal } from 'lucide-react';

export function SkillAssignmentCard({ skillId, instruction, allSkills, onRemove }: any) {
  const skill = allSkills?.find((s: any) => s.id === skillId);
  if (!skill) return null;

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-3 flex flex-col gap-2.5 group hover:border-primary/20 transition-all duration-300 relative">
      <div className="flex items-center justify-between relative z-10">
         <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center border border-primary/20 shadow-inner group-hover:scale-105 transition-transform duration-500">
               <Zap size={14} strokeWidth={2.5} className="fill-current" />
            </div>
            <div>
               <h4 className="text-[13px] font-bold tracking-tight text-foreground truncate max-w-[150px]">{skill.name}</h4>
               <span className="text-[8px] font-bold text-foreground/30 uppercase tracking-widest block leading-none">Functional Skill</span>
            </div>
         </div>
         <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 hover:text-red-500 text-foreground/20 rounded-md transition-all">
            <Trash2 size={12} />
         </button>
      </div>
      
      <div className="space-y-2 relative z-10 flex-1">
         <p className="text-foreground/40 text-[10px] font-medium leading-relaxed line-clamp-2 italic">{skill.description}</p>
         {instruction && (
            <div className="bg-secondary/50 border border-border/10 rounded-lg p-2.5 space-y-1 shadow-inner">
               <div className="flex items-center gap-1.5 text-[8px] font-bold text-foreground/30 uppercase tracking-widest">
                  <Terminal size={10} strokeWidth={3} /> Directive
               </div>
               <p className="text-[10px] font-bold text-foreground/70 leading-tight">"{instruction}"</p>
            </div>
         )}
      </div>

      <div className="pt-2 border-t border-border/10 flex items-center justify-between relative z-10 mt-auto">
         <div className="flex items-center gap-1.5 text-foreground/20">
            <Layers size={10} />
            <span className="text-[8px] font-bold uppercase tracking-widest">{skill.workflow?.nodes?.length || 0} Nodes</span>
         </div>
         <div className="px-2 py-0.5 bg-secondary border border-border/10 text-primary rounded-md text-[8px] font-bold uppercase tracking-widest">
            Verified
         </div>
      </div>
    </div>
  );
}

export function KnowledgeAssignmentCard({ knowledgeId, myKnowledge, onRemove }: any) {
  const item = myKnowledge?.find((k: any) => k.id === knowledgeId);
  if (!item) return null;

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-3 flex flex-col gap-2.5 group hover:border-primary/20 transition-all duration-300 relative overflow-hidden">
      <div className="flex items-center justify-between relative z-10">
         <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-secondary text-foreground/40 rounded-lg flex items-center justify-center border border-border/10 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-inner">
               <BookOpen size={14} strokeWidth={2} />
            </div>
            <div>
               <h4 className="text-[13px] font-bold tracking-tight text-foreground uppercase truncate max-w-[140px]">{item.title}</h4>
               <span className="text-[8px] font-bold text-foreground/10 uppercase tracking-widest block leading-none">Knowledge Asset</span>
            </div>
         </div>
         <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 hover:text-red-500 text-foreground/20 rounded-md transition-all">
            <Trash2 size={12} />
         </button>
      </div>
      <p className="text-foreground/20 text-[8px] font-bold uppercase tracking-widest text-center py-2 bg-secondary/30 rounded-lg border border-dashed border-border/10 relative z-10">
        Secure Context
      </p>
      <div className="pt-2 border-t border-border/10 flex items-center justify-between relative z-10">
         <span className="text-[8px] font-bold uppercase text-foreground/10 tracking-widest">Data Store</span>
         <div className="flex items-center gap-1 px-2 py-0.5 bg-secondary border border-border/10 text-foreground/40 rounded-full text-[7px] font-bold uppercase tracking-widest">
            Indexed
         </div>
      </div>
    </div>
  );
}
