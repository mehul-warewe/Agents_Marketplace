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
    { id: 'prompt', icon: MessageSquare, label: 'Identity & Prompt', desc: 'Define persona and rules' },
    { id: 'tools', icon: Wrench, label: 'Skills', desc: 'Equip vertical workflows' },
    { id: 'knowledge', icon: BookOpen, label: 'Knowledge', desc: 'Attach internal documents' },
    { id: 'triggers', icon: Target, label: 'Triggers', desc: 'Set autonomous schedules', soon: true },
  ];

  const secondaryItems: SidebarItem[] = [
    { id: 'variables', icon: Variable, label: 'Variables', desc: 'Dynamic values', soon: true },
    { id: 'settings', icon: Settings, label: 'Settings', desc: 'Advanced configuration', soon: true },
  ];

  return (
    <aside className="w-[300px] border-r border-border/40 bg-card/10 flex flex-col py-8 shrink-0">
      <div className="flex-1 space-y-8">
        <div className="px-4 space-y-1">
          {primaryItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => !item.soon && setActiveSubTab(item.id)}
              className={`w-full text-left p-4 rounded-xl flex items-start gap-4 transition-all relative group ${activeSubTab === item.id ? 'bg-indigo-500/5 text-indigo-500' : 'text-muted hover:bg-foreground/5'} ${item.soon ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
               <item.icon size={18} strokeWidth={2.5} className={`mt-1 transition-all ${activeSubTab === item.id ? 'text-indigo-500' : 'text-muted opacity-40 group-hover:opacity-100'}`} />
               <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                     <span className="text-xs font-bold uppercase tracking-tight leading-none">{item.label}</span>
                     {item.soon && <span className="text-[7px] font-bold bg-foreground/10 px-2 py-0.5 rounded text-muted">SOON</span>}
                  </div>
                  <p className="text-[10px] font-medium opacity-50 mt-1.5 leading-tight">{item.desc}</p>
               </div>
               {activeSubTab === item.id && <motion.div layoutId="sidebar-active" className="absolute left-[-4px] top-2 bottom-2 w-1.5 bg-indigo-500 rounded-r-full shadow-xl" />}
            </button>
          ))}
        </div>

        <div className="border-t border-border/40 mx-4" />

        <div className="px-4 space-y-1">
          {secondaryItems.map((item) => (
             <button 
               key={item.id}
               disabled={item.soon}
               className={`w-full text-left p-4 rounded-xl flex items-center gap-4 transition-all opacity-40 hover:opacity-100 group cursor-not-allowed`}
             >
                <item.icon size={18} strokeWidth={2.5} className="text-muted" />
                <div className="flex flex-1 items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-tighter leading-none">{item.label}</span>
                   {item.id === 'variables' && <div className="w-4 h-4 rounded border border-indigo-500/40 text-indigo-500 flex items-center justify-center text-[8px] font-black shadow-lg shadow-indigo-500/10 italic">Δ</div>}
                </div>
             </button>
          ))}
        </div>
      </div>
      
    </aside>
  );
}

export function RightConfigPane({
  localEmployee, allSkills, myKnowledge,
  isPaneCollapsed,
  setIsPaneCollapsed
}: Partial<EmployeeSidebarProps> & { isPaneCollapsed?: boolean; setIsPaneCollapsed?: (val: boolean) => void }) {
  
  // Resolve assigned entities for UI display
  const assignedSkills = localEmployee?.skillIds?.map((sid: string) => allSkills?.find(s => s.id === sid)).filter(Boolean) || [];
  const assignedKnowledge = localEmployee?.knowledgeIds?.map((kid: string) => myKnowledge?.find(k => k.id === kid)).filter(Boolean) || [];

  return (
    <aside className={`border-l border-border/40 bg-card/10 flex flex-col shrink-0 overflow-y-auto custom-scrollbar no-scrollbar transition-all ${
      isPaneCollapsed ? 'w-[48px]' : 'w-[400px]'
    }`}>
      <div className="p-6 border-b border-border/40 flex items-center justify-between shrink-0">
         {!isPaneCollapsed && <span className="text-xs font-bold uppercase tracking-widest text-muted">ID Card & Status</span>}
         <button
           onClick={() => setIsPaneCollapsed?.(!isPaneCollapsed)}
           className="p-2 hover:bg-foreground/5 rounded-lg text-muted transition-all active:scale-90 ml-auto"
           title={isPaneCollapsed ? 'Expand' : 'Collapse'}
         >
           <ChevronRight size={20} className={`transition-transform ${isPaneCollapsed ? '' : 'rotate-180'}`} />
         </button>
      </div>

      {!isPaneCollapsed && (
      <div className="p-8 space-y-10 pb-32">
         
         {/* Profile Snapshot Area */}
         <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
               <div className="w-24 h-24 rounded-3xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20 shadow-xl overflow-hidden shrink-0">
                  {localEmployee?.avatar ? (
                     <span className="text-4xl">{localEmployee.avatar}</span>
                  ) : (
                     <Bot size={44} strokeWidth={2.5} />
                  )}
               </div>
               <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-background border border-border/40 flex items-center justify-center shadow-lg">
                  <Activity size={14} className="text-emerald-500" />
               </div>
            </div>
            
            <div className="space-y-1">
               <h2 className="text-xl font-bold tracking-tight text-foreground leading-none">
                 {localEmployee?.name || 'Unnamed Agent'}
               </h2>
               <p className="text-xs font-medium text-muted/60 max-w-[250px] leading-snug">
                 {localEmployee?.description || 'No role description provided.'}
               </p>
            </div>
            
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-foreground/5 rounded-lg border border-border/40 text-[10px] font-bold uppercase tracking-wider text-muted">
               <Brain size={12} /> {localEmployee?.model || 'google/gemini-2.0-flash-001'}
            </div>
         </div>

         {/* Inventory List: Skills */}
         <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted opacity-60 border-b border-border/40 pb-2">Equipped Skills ({assignedSkills.length})</h3>
            {assignedSkills.length > 0 ? (
               <div className="flex flex-wrap gap-2">
                 {assignedSkills.map((s: any) => (
                    <div key={s.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/20 text-primary text-xs font-bold shadow-sm">
                       <Zap size={12} className="fill-current opacity-60" />
                       {s.name}
                    </div>
                 ))}
               </div>
            ) : (
               <p className="text-xs font-medium text-muted/40 italic">Agent has no execution capabilities.</p>
            )}
         </div>

         {/* Inventory List: Knowledge */}
         <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted opacity-60 border-b border-border/40 pb-2">Knowledge Base ({assignedKnowledge.length})</h3>
            {assignedKnowledge.length > 0 ? (
               <div className="space-y-2">
                 {assignedKnowledge.map((k: any) => (
                    <div key={k.id} className="flex items-center gap-3 text-xs font-medium text-muted group">
                       <FileText size={14} className="group-hover:text-foreground transition-colors" />
                       <span className="truncate group-hover:text-foreground transition-colors">{k.title}</span>
                    </div>
                 ))}
               </div>
            ) : (
               <p className="text-xs font-medium text-muted/40 italic">No semantic data attached.</p>
            )}
         </div>

         {/* Test/Preview Action */}
         <div className="pt-8">
            <button className="w-full py-4 bg-foreground/5 hover:bg-foreground/10 border border-border/40 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3">
               <MessageSquare size={16} /> Try Me
            </button>
            <p className="text-center text-[9px] font-medium text-muted/40 mt-3 uppercase tracking-widest">Connects to test sandbox</p>
         </div>

      </div>
      )}
    </aside>
  );
}
