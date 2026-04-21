'use client';

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Users, Zap, Activity, ListTree, StickyNote, Plus, Bot } from 'lucide-react';

/* ─── Manager Hub Node ─────────────────────────────────────────────────────── */
export const ManagerHubNode = memo(({ data }: any) => {
  return (
    <div className="w-80 bg-card border-2 border-indigo-500 rounded-2xl shadow-md overflow-hidden">
      {/* Color stripe accent */}
      <div className="h-1 bg-indigo-600 w-full" />
      <div className="p-5 drag-handle cursor-move">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shrink-0">
            <Users size={18} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <span className="block text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] leading-none mb-1">
              Manager Hub
            </span>
            <h3 className="text-sm font-bold tracking-tight text-foreground truncate leading-none">
              {data.name || 'New Manager'}
            </h3>
          </div>
          <div className="ml-auto w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
        </div>

        <div className="px-4 py-3 bg-muted rounded-xl border border-border">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
            Primary Objective
          </p>
          <p className="text-[11px] font-medium text-foreground/80 leading-relaxed line-clamp-2">
            {data.goal || 'Define core objective...'}
          </p>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-indigo-600 !border-2 !border-card !shadow-sm"
      />
    </div>
  );
});

/* ─── Employee Node ─────────────────────────────────────────────────────────── */
export const EmployeeNode = memo(({ data }: any) => {
  const isPlaceholder = data.isPlaceholder;
  return (
    <div
      className={`w-68 bg-card border rounded-2xl shadow-sm overflow-hidden transition-all duration-200
        ${isPlaceholder ? 'border-dashed border-border' : 'border-border hover:border-indigo-500/60'}`}
    >
      <div className={`h-0.5 w-full ${isPlaceholder ? 'bg-border' : 'bg-indigo-500'}`} />
      <div className="p-4 drag-handle cursor-move">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-colors
              ${isPlaceholder
                ? 'bg-muted border-border text-muted-foreground/40'
                : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500'
              }`}
          >
            <Bot size={16} strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[8px] font-black uppercase tracking-[0.18em] text-muted-foreground/60 leading-none mb-1">
              Employee Assignment
            </span>
            <h3 className={`text-xs font-bold tracking-tight truncate leading-none
              ${isPlaceholder ? 'text-muted-foreground/40 italic' : 'text-foreground'}`}
            >
              {data.name || 'Unassigned'}
            </h3>
          </div>
        </div>

        {isPlaceholder && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border border-dashed border-border">
            <Plus size={10} className="text-muted-foreground/40 shrink-0" />
            <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40">
              Click to assign employee
            </span>
          </div>
        )}
      </div>
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-card !border-2 !border-indigo-500/40" />
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-card !border-2 !border-indigo-500/40" />
    </div>
  );
});

/* ─── Tool Node ─────────────────────────────────────────────────────────────── */
export const ToolNode = memo(({ data }: any) => {
  const isPlaceholder = data.isPlaceholder;
  return (
    <div
      className={`w-60 bg-card border rounded-2xl shadow-sm overflow-hidden transition-all duration-200
        ${isPlaceholder ? 'border-dashed border-border' : 'border-border hover:border-emerald-500/60'}`}
    >
      <div className={`h-0.5 w-full ${isPlaceholder ? 'bg-border' : 'bg-emerald-500'}`} />
      <div className="p-4 drag-handle cursor-move">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border
              ${isPlaceholder
                ? 'bg-muted border-border text-muted-foreground/40'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              }`}
          >
            <Zap size={16} strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[8px] font-black uppercase tracking-[0.18em] text-muted-foreground/60 leading-none mb-1">
              Skill Node
            </span>
            <h3 className={`text-xs font-bold tracking-tight truncate leading-none
              ${isPlaceholder ? 'text-muted-foreground/40 italic' : 'text-foreground'}`}
            >
              {data.name || 'Unassigned'}
            </h3>
          </div>
        </div>
        {isPlaceholder && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border border-dashed border-border">
            <Plus size={10} className="text-muted-foreground/40 shrink-0" />
            <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40">
              Click to link skill
            </span>
          </div>
        )}
      </div>
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-card !border-2 !border-emerald-500/40" />
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-card !border-2 !border-emerald-500/40" />
    </div>
  );
});

/* ─── Trigger Node ──────────────────────────────────────────────────────────── */
export const TriggerNode = memo(({ data }: any) => {
  const isPlaceholder = data.isPlaceholder;
  return (
    <div
      className={`w-60 bg-card border rounded-2xl shadow-sm overflow-hidden transition-all duration-200
        ${isPlaceholder ? 'border-dashed border-border' : 'border-border hover:border-orange-500/60'}`}
    >
      <div className={`h-0.5 w-full ${isPlaceholder ? 'bg-border' : 'bg-orange-500'}`} />
      <div className="p-4 drag-handle cursor-move">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border
              ${isPlaceholder
                ? 'bg-muted border-border text-muted-foreground/40'
                : 'bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400'
              }`}
          >
            <Activity size={16} strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[8px] font-black uppercase tracking-[0.18em] text-muted-foreground/60 leading-none mb-1">
              Event Trigger
            </span>
            <h3 className={`text-xs font-bold tracking-tight truncate leading-none
              ${isPlaceholder ? 'text-muted-foreground/40 italic' : 'text-foreground'}`}
            >
              {data.name || 'Unassigned'}
            </h3>
          </div>
        </div>
        {isPlaceholder && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border border-dashed border-border">
            <Plus size={10} className="text-muted-foreground/40 shrink-0" />
            <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40">
              Click to connect event
            </span>
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-card !border-2 !border-orange-500/40" />
    </div>
  );
});

/* ─── Condition Node ────────────────────────────────────────────────────────── */
export const ConditionNode = memo(({ data }: any) => {
  return (
    <div className="w-60 bg-card border border-border hover:border-purple-500/60 rounded-2xl shadow-sm overflow-hidden transition-all duration-200">
      <div className="h-0.5 w-full bg-purple-500" />
      <div className="p-4 drag-handle cursor-move">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <ListTree size={16} strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[8px] font-black uppercase tracking-[0.18em] text-muted-foreground/60 leading-none mb-1">
              Logic Gateway
            </span>
            <h3 className="text-xs font-bold tracking-tight truncate leading-none text-foreground">
              {data.name || 'Decision Gate'}
            </h3>
          </div>
        </div>
      </div>
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-card !border-2 !border-purple-500/40" />
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-card !border-2 !border-purple-500/40" />
    </div>
  );
});

/* ─── Note Node ─────────────────────────────────────────────────────────────── */
export const NoteNode = memo(({ data }: any) => {
  return (
    <div className="w-60 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-400/60 dark:border-yellow-500/40 rounded-2xl shadow-sm overflow-hidden">
      <div className="h-0.5 w-full bg-yellow-400" />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <StickyNote size={13} className="text-yellow-600 dark:text-yellow-400 shrink-0" />
          <span className="text-[8px] font-black uppercase tracking-[0.18em] text-yellow-700 dark:text-yellow-400">
            Annotation
          </span>
        </div>
        <textarea
          value={data.label}
          disabled
          rows={3}
          className="w-full bg-transparent border-none outline-none resize-none text-[11px] font-medium text-yellow-900/70 dark:text-yellow-200/60 leading-relaxed placeholder:text-yellow-700/30"
          placeholder="Write a note..."
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
