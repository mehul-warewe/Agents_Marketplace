'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  ChevronDown, CheckCircle2, Zap, LayoutGrid, Check, ArrowLeft, Play, Loader2, Save
} from 'lucide-react';
import { MODEL_TYPES } from './toolRegistry';

interface BuilderTopbarProps {
  name: string;
  onNameChange: (v: string) => void;
  model: string;
  onModelChange: (v: string) => void;
  onBack: () => void;
  onReset: () => void;
  onSave: () => void;
  onRun: () => void;
  isRunning: boolean;
  isSaving: boolean;
  isEditMode: boolean;
  userName: string;
  userAvatar?: string;
  isEmployeeMode?: boolean;
}

export default function BuilderTopbar({
  name, onNameChange,
  model, onModelChange,
  onBack, onReset, onSave, onRun,
  isRunning, isSaving, isEditMode,
  userName, userAvatar,
  isEmployeeMode,
}: BuilderTopbarProps) {

  const [isModelOpen, setIsModelOpen] = useState(false);
  const modelRef = useRef<HTMLDivElement>(null);
  const selectedM = MODEL_TYPES.find(m => m.id === model) ?? MODEL_TYPES[0] ?? { id: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash', provider: 'Google' };

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
        setIsModelOpen(false);
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-5 shrink-0 z-[60]">

      {/* ── Left Side */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground/50 hover:bg-muted hover:text-foreground transition-all border border-border/60"
          title="Back"
        >
          <ArrowLeft size={16} strokeWidth={2.5} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 border border-indigo-500/20">
             <LayoutGrid size={15} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col -gap-0.5">
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 leading-none mb-1">Skill Architecture</span>
            <input
              value={name}
              onChange={e => onNameChange(e.target.value)}
              className="bg-transparent border-none outline-none text-[13px] font-bold text-foreground w-64 placeholder:text-muted-foreground/30 leading-none truncate"
              placeholder="Untitled Skill"
            />
          </div>
          {isEmployeeMode && (
            <div className="px-2 py-0.5 bg-indigo-500/5 border border-indigo-500/10 rounded-md">
              <span className="text-[8px] font-black uppercase tracking-[0.15em] text-indigo-600/80">Employee Instance</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Center: Execution */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
        <button
          onClick={onRun}
          disabled={isRunning}
          className={`
            h-8 flex items-center gap-2 px-6 rounded-xl
            text-[9px] font-bold uppercase tracking-widest transition-all
            ${isRunning
              ? 'bg-muted text-muted-foreground border border-border cursor-wait'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.97] shadow-sm'}
          `}
        >
          {isRunning ? (
            <><Loader2 size={12} className="animate-spin" /> Executing...</>
          ) : (
            <><Play size={12} fill="currentColor" /> Run Workflow</>
          )}
        </button>
      </div>

      {/* ── Right Side */}
      <div className="flex items-center gap-3">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="h-8 flex items-center gap-2 px-5 bg-card hover:bg-muted rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all border border-border disabled:opacity-40"
        >
          {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} strokeWidth={2.5} />}
          {isEmployeeMode ? 'Publish Employee' : (isEditMode ? 'Save Changes' : 'Publish')}
        </button>

        <div className="h-4 w-px bg-border mx-2 hidden sm:block" />

        <div className="hidden md:flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground text-[10px] font-bold shrink-0 overflow-hidden">
              {userAvatar
                ? <img src={userAvatar} className="w-full h-full object-cover" alt="avatar" />
                : userName.charAt(0).toUpperCase()}
            </div>
        </div>
      </div>
    </header>
  );
}
