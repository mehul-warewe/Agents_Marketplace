'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, Zap, BookOpen, Target, Brain, Variable, 
  ChevronRight, ChevronDown, Plus, FileText, FileUp, Settings, X,
  Bell, AlertCircle, Wrench, ShieldCheck, Activity, Bot
} from 'lucide-react';

interface SidebarItem {
  id: string;
  icon: any;
  label: string;
  desc: string;
  soon?: boolean;
}

interface EmployeeSidebarProps {
  activeSubTab: string;
  setActiveSubTab: (id: any) => void;
  isNew: boolean;
  localEmployee: any;
  allSkills: any[];
  myKnowledge: any[];
  setShowSkillPicker: (val: boolean) => void;
  removeSkill: (val: any) => void;
  setShowKnowledgeCreator: (val: boolean) => void;
  removeKnowledge: (val: any) => void;
}

export function LeftSubNav({ activeSubTab, setActiveSubTab }: { activeSubTab: string, setActiveSubTab: (id: any) => void }) {
  const primaryItems: SidebarItem[] = [
    { id: 'prompt', icon: MessageSquare, label: 'Instructions', desc: 'Employee persona' },
    { id: 'tools', icon: Wrench, label: 'Skills', desc: 'Capabilities' },
    { id: 'knowledge', icon: BookOpen, label: 'Knowledge', desc: 'Context data' },
    { id: 'triggers', icon: Target, label: 'Triggers', desc: 'Events', soon: true },
  ];

  const secondaryItems: SidebarItem[] = [
    { id: 'variables', icon: Variable, label: 'Variables', desc: 'State', soon: true },
    { id: 'settings', icon: Settings, label: 'Settings', desc: 'Config', soon: true },
  ];

  return (
    <div className="flex flex-col py-2 h-full w-full bg-card">
      <div className="flex-1 space-y-0.5">
        <div className="px-2.5 space-y-0.5">
          {primaryItems.map((item) => {
            const isActive = activeSubTab === item.id;
            return (
              <button 
                key={item.id}
                onClick={() => !item.soon && setActiveSubTab(item.id)}
                className={`w-full text-left p-1.5 rounded-lg flex items-center gap-2.5 transition-all duration-300 relative group
                  ${isActive ? 'bg-indigo-500/10 text-indigo-500' : 'text-foreground/50 hover:bg-secondary'} 
                  ${item.soon ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                 {isActive && <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-primary rounded-full transition-all" />}
                 <item.icon size={14} strokeWidth={isActive ? 3 : 2} className={`transition-all duration-300 shrink-0 ${isActive ? 'text-primary' : 'text-foreground/30 group-hover:text-foreground'}`} />
                 <span className={`text-[9px] font-bold uppercase tracking-wider leading-none transition-all ${isActive ? 'text-primary' : 'text-foreground/80'}`}>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="border-t border-border/10 mx-3 my-1" />

        <div className="px-4 space-y-0.5 text-foreground/20 text-[7px] font-bold uppercase tracking-widest mb-1 mt-1.5">Settings</div>
        <div className="px-2.5 space-y-0.5">
          {secondaryItems.map((item) => (
             <button 
               key={item.id}
               disabled={item.soon}
               className="w-full text-left p-1.5 rounded-lg flex items-center gap-2.5 transition-all opacity-40 hover:opacity-100 group cursor-not-allowed"
             >
                <item.icon size={14} strokeWidth={2} className="text-foreground/30 shrink-0" />
                <span className="text-[9px] font-bold uppercase tracking-wider leading-none">{item.label}</span>
             </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function RightConfigPane({
  localEmployee, allSkills, myKnowledge,
  isPaneCollapsed,
  setIsPaneCollapsed,
  setShowSkillPicker,
  setShowKnowledgeCreator
}: Partial<EmployeeSidebarProps> & { isPaneCollapsed?: boolean; setIsPaneCollapsed?: (val: boolean) => void }) {
  
  const assignedSkills = localEmployee?.skillIds?.map((sid: string) => allSkills?.find(s => s.id === sid)).filter(Boolean) || [];
  const assignedKnowledge = localEmployee?.knowledgeIds?.map((kid: string) => myKnowledge?.find(k => k.id === kid)).filter(Boolean) || [];

  return (
    <div className={`h-full flex flex-col bg-card border-l border-border transition-all duration-500 ${isPaneCollapsed ? 'w-10' : 'w-full'}`}>
      <div className="p-2 border-b border-border/10 flex items-center justify-between shrink-0 h-10">
          {!isPaneCollapsed && <h3 className="text-[8px] font-bold uppercase tracking-widest text-foreground/20 ml-2">Snapshot</h3>}
          <button
            onClick={() => setIsPaneCollapsed?.(!isPaneCollapsed)}
            className="p-1.5 bg-foreground/5 hover:bg-foreground/10 rounded-lg text-foreground/40 hover:text-foreground transition-all ml-auto border border-border/10"
          >
            <ChevronRight size={14} className={`transition-transform duration-500 ${isPaneCollapsed ? 'rotate-180' : ''}`} />
          </button>
       </div>

       {!isPaneCollapsed && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4 no-scrollbar pb-32">
          
          {/* Agent Snapshot */}
          <div className="flex flex-col items-center text-center space-y-2.5">
             <div className="relative group">
                <div className="size-11 rounded-xl bg-secondary text-foreground flex items-center justify-center border border-border group-hover:scale-105 transition-transform duration-500">
                   {localEmployee?.avatar ? (
                      <span className="text-xl">{localEmployee.avatar}</span>
                   ) : (
                      <Bot size={20} className="text-foreground/10" />
                   )}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 size-4 rounded bg-card border border-border flex items-center justify-center shadow-sm">
                   <Activity size={8} className="text-emerald-500" />
                </div>
             </div>
             
             <div className="space-y-0.5">
                <h2 className="text-[11px] font-bold tracking-tight text-foreground truncate max-w-[150px]">
                   {localEmployee?.name || 'New Employee'}
                </h2>
                <p className="text-[8px] font-bold text-foreground/20 uppercase tracking-widest leading-none">
                   Active Professional
                </p>
             </div>
             
             <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-secondary/80 rounded border border-border/40 text-[7px] font-black text-primary/60 uppercase tracking-tighter">
                {localEmployee?.model?.split('/').pop()?.toUpperCase() || 'GEMINI FLASH'}
             </div>
          </div>

          <div className="space-y-3 pt-2">
             <div className="flex items-center justify-between border-b border-border/10 pb-2">
                <h4 className="text-[8px] font-bold uppercase tracking-widest text-foreground/30">Skills</h4>
                <button 
                  onClick={() => setShowSkillPicker?.(true)}
                  className="size-5 rounded bg-indigo-500/10 text-indigo-500 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all border border-indigo-500/20 shadow-sm"
                >
                  <Plus size={10} strokeWidth={3} />
                </button>
             </div>
             
             <div className="space-y-1.5">
                {assignedSkills.map((skill: any) => (
                   <div key={skill.id} className="p-2 rounded-lg bg-secondary/30 border border-border/10 flex items-center gap-2.5 group transition-all hover:bg-secondary/50">
                      <div className="size-6 rounded bg-card border border-border flex items-center justify-center text-indigo-500 shadow-sm">
                         <Zap size={10} />
                      </div>
                      <span className="text-[10px] font-bold text-foreground/80 truncate">{skill.name}</span>
                   </div>
                ))}
                {!assignedSkills.length && (
                  <p className="text-[9px] text-foreground/20 font-medium italic text-center py-2">No skills enabled</p>
                )}
             </div>
          </div>

          <div className="space-y-3 pt-2">
             <div className="flex items-center justify-between border-b border-border/10 pb-2">
                <h4 className="text-[8px] font-bold uppercase tracking-widest text-foreground/30">Knowledge</h4>
                <button 
                  onClick={() => setShowKnowledgeCreator?.(true)}
                  className="size-5 rounded bg-foreground/5 text-foreground/30 flex items-center justify-center hover:bg-foreground hover:text-background transition-all border border-border/10 shadow-sm"
                >
                  <Plus size={10} strokeWidth={3} />
                </button>
             </div>
             
             <div className="space-y-1.5">
                {assignedKnowledge.map((item: any) => (
                   <div key={item.id} className="p-2 rounded-lg bg-secondary/30 border border-border/10 flex items-center gap-2.5 group transition-all hover:bg-secondary/50">
                      <div className="size-6 rounded bg-card border border-border flex items-center justify-center text-foreground/40 shadow-sm">
                         <FileText size={10} />
                      </div>
                      <span className="text-[10px] font-bold text-foreground/80 truncate">{item.title}</span>
                   </div>
                ))}
                {!assignedKnowledge.length && (
                  <p className="text-[9px] text-foreground/20 font-medium italic text-center py-2">No data assets linked</p>
                )}
             </div>
          </div>

       </div>
       )}
    </div>
  );
}
