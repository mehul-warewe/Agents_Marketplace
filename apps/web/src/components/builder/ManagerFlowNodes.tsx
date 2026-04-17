'use client';

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Users, Shield, Zap, Target, Cpu, MessageSquare, ListTree, StickyNote, Activity, Plus } from 'lucide-react';

export const ManagerHubNode = memo(({ data }: any) => {
  return (
    <div className="group relative">
      <div className="absolute -inset-4 bg-indigo-500/10 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-700" />
      <div className="relative w-80 bg-card/80 backdrop-blur-xl border-2 border-indigo-500/30 rounded-[2.5rem] shadow-2xl p-6 overflow-hidden">
        <header className="flex items-center gap-4 mb-4 relative z-10 drag-handle cursor-move">
          <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Users size={24} strokeWidth={2.5} />
          </div>
          <div>
             <div className="flex items-center gap-2 mb-1">
                <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-full italic">Manager Hub</span>
                <div className="size-1.5 rounded-full bg-indigo-500 animate-pulse" />
             </div>
             <h3 className="text-md font-black italic tracking-tighter uppercase leading-none truncate max-w-[150px] text-foreground">{data.name || 'Unnamed'}</h3>
          </div>
        </header>
        <div className="p-4 bg-foreground/[0.03] border border-border/40 rounded-2xl relative z-10">
           <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1 italic">Strategic Core</p>
           <p className="text-[10px] font-bold text-foreground/80 leading-relaxed italic line-clamp-2">{data.goal || 'Define strategic goal...'}</p>
        </div>
        <Handle type="source" position={Position.Right} className="!w-4 !h-4 !bg-indigo-600 !border-2 !border-card !shadow-lg hover:scale-125 transition-transform" />
      </div>
    </div>
  );
});

export const EmployeeNode = memo(({ data }: any) => {
  return (
    <div className="group relative">
      <div className={`relative w-72 bg-card/60 backdrop-blur-xl border ${data.isPlaceholder ? 'border-dashed border-border/40 bg-foreground/[0.02]' : 'border-indigo-500/20'} rounded-[1.75rem] shadow-xl p-5 hover:border-indigo-500 transition-all duration-500`}>
        <header className="flex items-center gap-4 mb-3 drag-handle cursor-move">
          <div className={`w-11 h-11 ${data.isPlaceholder ? 'bg-foreground/5 text-muted/40' : 'bg-indigo-500/10 text-indigo-500'} rounded-xl flex items-center justify-center border border-border/10 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm`}>
            <Cpu size={20} />
          </div>
          <div className="min-w-0 flex-1">
             <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[7px] font-black text-indigo-400 uppercase tracking-widest opacity-60">Operative Unit</span>
                {!data.isPlaceholder && <div className="size-1 rounded-full bg-indigo-500/40" />}
             </div>
            <h3 className={`text-xs font-black italic tracking-tight uppercase truncate ${data.isPlaceholder ? 'text-muted/40 font-bold' : 'text-foreground'}`}>
              {data.name}
            </h3>
          </div>
        </header>

        {data.isPlaceholder && (
           <div className="flex items-center gap-2 mt-4 px-3 py-2 bg-indigo-500/5 border border-dashed border-indigo-500/10 rounded-xl">
              <Plus size={10} className="text-indigo-500/40" />
              <span className="text-[8px] font-black uppercase tracking-widest text-indigo-500/30 italic">Select operative</span>
           </div>
        )}

        <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-background !border-2 !border-indigo-500/20 !shadow-sm hover:!bg-indigo-500 hover:!border-indigo-500 transition-colors" />
        <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-background !border-2 !border-indigo-500/20 !shadow-sm hover:!bg-indigo-500 hover:!border-indigo-500 transition-colors" />
      </div>
    </div>
  );
});

export const ToolNode = memo(({ data }: any) => {
  return (
    <div className="group relative">
      <div className={`relative w-64 bg-card/60 backdrop-blur-xl border ${data.isPlaceholder ? 'border-dashed border-border/40 bg-foreground/[0.02]' : 'border-emerald-500/20'} rounded-[1.5rem] shadow-lg p-4 hover:border-emerald-500 transition-all duration-500`}>
        <header className="flex items-center gap-3 mb-2 drag-handle cursor-move">
          <div className={`w-10 h-10 ${data.isPlaceholder ? 'bg-emerald-500/5 text-emerald-500/40' : 'bg-emerald-500/10 text-emerald-500'} rounded-xl flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500 shadow-sm`}>
            <Zap size={18} />
          </div>
          <div className="min-w-0 flex-1">
             <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[7px] font-black text-emerald-500/60 uppercase tracking-widest">Execution Skill</span>
             </div>
            <h3 className={`text-[10px] font-black italic uppercase truncate ${data.isPlaceholder ? 'text-muted/40' : 'text-foreground'}`}>{data.name}</h3>
          </div>
        </header>
        
        {data.isPlaceholder && (
           <div className="flex items-center gap-2 mt-2 px-2 py-1.5 bg-emerald-500/5 border border-dashed border-emerald-500/10 rounded-lg">
              <Plus size={10} className="text-emerald-500/40" />
              <span className="text-[7.5px] font-black uppercase tracking-widest text-emerald-500/30">Link tool</span>
           </div>
        )}

        <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-background !border-2 !border-emerald-500/20 !shadow-sm hover:!bg-emerald-500 hover:!border-emerald-500" />
        <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-background !border-2 !border-emerald-500/20 !shadow-sm hover:!bg-emerald-500 hover:!border-emerald-500" />
      </div>
    </div>
  );
});

export const TriggerNode = memo(({ data }: any) => {
  return (
    <div className="group relative">
      <div className={`relative w-64 bg-card/60 backdrop-blur-xl border ${data.isPlaceholder ? 'border-dashed border-border/40 bg-foreground/[0.02]' : 'border-orange-500/20'} rounded-[1.5rem] shadow-lg p-4 hover:border-orange-500 transition-all duration-500`}>
        <header className="flex items-center gap-3 mb-2 drag-handle cursor-move">
          <div className={`w-10 h-10 ${data.isPlaceholder ? 'bg-orange-500/5 text-orange-500/40' : 'bg-orange-500/10 text-orange-500'} rounded-xl flex items-center justify-center border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500 shadow-sm`}>
            <Activity size={18} />
          </div>
          <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[7px] font-black text-orange-500/60 uppercase tracking-widest">Entry Protocol</span>
             </div>
             <h3 className={`text-[10px] font-black italic uppercase truncate ${data.isPlaceholder ? 'text-muted/40 font-bold' : 'text-foreground'}`}>
               {data.name}
             </h3>
          </div>
        </header>

        {data.isPlaceholder && (
           <div className="flex items-center gap-2 mt-2 px-2 py-1.5 bg-orange-500/5 border border-dashed border-orange-500/10 rounded-lg">
              <Plus size={10} className="text-orange-500/40" />
              <span className="text-[7.5px] font-black uppercase tracking-widest text-orange-500/30">Connect event</span>
           </div>
        )}

        <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-background !border-2 !border-orange-500/20 !shadow-sm hover:!bg-orange-500 hover:!border-orange-500 transition-colors" />
      </div>
    </div>
  );
});

export const ConditionNode = memo(({ data }: any) => {
  return (
    <div className="group relative">
      <div className="relative w-64 bg-card/60 backdrop-blur-xl border border-purple-500/20 rounded-[1.5rem] shadow-lg p-4 hover:border-purple-500 transition-all duration-500">
        <header className="flex items-center gap-3 mb-2 drag-handle cursor-move">
          <div className="w-10 h-10 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center border border-purple-500/20 group-hover:bg-purple-500 group-hover:text-white transition-all duration-500 shadow-sm">
            <ListTree size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
               <span className="text-[7px] font-black text-purple-500/60 uppercase tracking-widest">Logic Gateway</span>
            </div>
            <h3 className="text-[10px] font-black italic uppercase truncate text-foreground">{data.name || 'Decision Gate'}</h3>
          </div>
        </header>
        <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-background !border-2 !border-purple-500/20 !shadow-sm hover:!bg-purple-500 hover:!border-purple-500" />
        <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-background !border-2 !border-purple-500/20 !shadow-sm hover:!bg-purple-500 hover:!border-purple-500" />
      </div>
    </div>
  );
});

export const NoteNode = memo(({ data }: any) => {
  return (
    <div className="group relative">
      <div className="relative w-64 bg-yellow-400/5 backdrop-blur-xl border border-yellow-500/20 rounded-[1.5rem] shadow-lg p-5">
        <div className="flex items-center gap-3 mb-3">
          <StickyNote size={14} className="text-yellow-500" />
          <span className="text-[8px] font-black text-yellow-500 uppercase tracking-widest">Strategy Note</span>
        </div>
        <textarea 
          value={data.label}
          disabled
          className="w-full bg-transparent border-none outline-none resize-none text-[10px] font-bold text-foreground/60 italic leading-relaxed"
          placeholder="Strategic annotation..."
        />
      </div>
    </div>
  );
});

ManagerHubNode.displayName = 'ManagerHubNode';
EmployeeNode.displayName = 'EmployeeNode';
ToolNode.displayName = 'ToolNode';
TriggerNode.displayName = 'TriggerNode';
ConditionNode.displayName = 'ConditionNode';
NoteNode.displayName = 'NoteNode';

ManagerHubNode.displayName = 'ManagerHubNode';
EmployeeNode.displayName = 'EmployeeNode';
