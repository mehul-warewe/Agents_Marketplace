'use client';
import React, { useRef, useState, useEffect } from 'react';
import {
  ChevronLeft, Save, RotateCcw, Bot,
  ChevronDown, CheckCircle2, Zap, LayoutGrid, Check, ArrowLeft, Play, Loader2
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
    <header className="h-16 bg-card border-b border-border/40 flex items-center justify-between px-6 shrink-0 z-[60]">

      {/* ── Left Side */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary transition-all border border-border/40"
          title="Back"
        >
          <ArrowLeft size={16} strokeWidth={2.5} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
             <LayoutGrid size={16} strokeWidth={2.5} />
          </div>
          <input
            value={name}
            onChange={e => onNameChange(e.target.value)}
            className="bg-transparent border-none outline-none text-sm font-bold font-display text-foreground w-64 placeholder:text-muted-foreground/30"
            placeholder="Untitled Project"
          />
          {isEmployeeMode && (
            <div className="px-2.5 py-1 bg-amber-500/5 border border-amber-500/20 rounded-md">
              <span className="text-[9px] font-bold uppercase tracking-widest text-amber-600/80">Employee Instance</span>
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
            flex items-center gap-2 px-6 py-2 rounded-xl
            text-[11px] font-bold uppercase tracking-widest transition-all
            ${isRunning
              ? 'bg-primary/10 text-primary border border-primary/20 cursor-wait'
              : 'bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.97] shadow-lg shadow-primary/20'}
          `}
        >
          {isRunning ? (
            <><Loader2 size={14} className="animate-spin" /> Running...</>
          ) : (
            <><Play size={14} fill="currentColor" /> Run Workflow</>
          )}
        </button>
      </div>

      {/* ── Right Side */}
      <div className="flex items-center gap-3">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2 hover:bg-secondary rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all border border-border/40 disabled:opacity-40"
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} strokeWidth={2.5} />}
          {isEmployeeMode ? 'Initialize' : (isEditMode ? 'Save Changes' : 'Deploy')}
        </button>

        <div className="h-4 w-px bg-border/40 mx-2 hidden sm:block" />

        {/* User Profile */}
        <div className="hidden md:flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-foreground font-bold text-xs shrink-0 overflow-hidden border border-border/40">
              {userAvatar
                ? <img src={userAvatar} className="w-full h-full object-cover" alt="avatar" />
                : userName.charAt(0).toUpperCase()}
            </div>
        </div>
      </div>
    </header>
  );
}
