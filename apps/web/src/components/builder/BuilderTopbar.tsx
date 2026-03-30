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
}


export default function BuilderTopbar({
  name, onNameChange,
  model, onModelChange,
  onBack, onReset, onSave, onRun,
  isRunning, isSaving, isEditMode,
  userName, userAvatar,
}: BuilderTopbarProps) {

  const [isModelOpen, setIsModelOpen] = useState(false);
  const modelRef = useRef<HTMLDivElement>(null);
  const selectedM = MODEL_TYPES.find(m => m.id === model) ?? MODEL_TYPES[0]!;

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
    <header className="h-16 bg-background border-b border-border/60 flex items-center justify-between px-6 shrink-0 z-[60] font-inter">

      {/* ── Left Side */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded-xl text-muted hover:bg-foreground hover:text-background transition-all border border-border/40"
          title="Back"
        >
          <ArrowLeft size={16} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center text-background">
             <LayoutGrid size={16} />
          </div>
          <input
            value={name}
            onChange={e => onNameChange(e.target.value)}
            className="bg-transparent border-none outline-none text-[15px] font-bold text-foreground w-64 placeholder:text-muted/20"
            placeholder="Workflow Name"
          />
        </div>
      </div>

      {/* ── Center: Execution */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
        <button
          onClick={onRun}
          disabled={isRunning}
          className={`
            flex items-center gap-2 px-6 py-2 rounded-lg
            text-[11px] font-black uppercase tracking-widest transition-all
            ${isRunning
              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
              : 'bg-foreground text-background hover:opacity-90 active:scale-[0.97] shadow-lg shadow-black/5'}
          `}
        >
          {isRunning ? (
            <><Loader2 size={14} className="animate-spin" /> Pulsing...</>
          ) : (
            <><Play size={14} fill="currentColor" /> Execute Workflow</>
          )}
        </button>
      </div>

      {/* ── Right Side */}
      <div className="flex items-center gap-3">

        {/* Model picker removed - handled at node level now */}

        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 border border-foreground/10 hover:border-foreground/40 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-40"
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {isEditMode ? 'Update' : 'Deploy'}
        </button>

        <div className="h-4 w-px bg-border/40 mx-2 hidden sm:block" />

        {/* User Profile */}
        <div className="hidden md:flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-foreground/[0.05] flex items-center justify-center text-foreground font-bold text-xs shrink-0 overflow-hidden border border-border/40">
              {userAvatar
                ? <img src={userAvatar} className="w-full h-full object-cover" alt="avatar" />
                : userName.charAt(0).toUpperCase()}
            </div>
        </div>
      </div>
    </header>
  );
}
