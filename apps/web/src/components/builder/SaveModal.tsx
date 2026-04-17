'use client';
import React, { useState } from 'react';
import { X, Save, Info, Activity, ArrowRight } from 'lucide-react';

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  onNameChange: (val: string) => void;
  description: string;
  onDescriptionChange: (val: string) => void;
  onSave: () => void;
  isSaving: boolean;
  isEditMode: boolean;
}

export function SaveModal({
  isOpen,
  onClose,
  name,
  onNameChange,
  description,
  onDescriptionChange,
  onSave,
  isSaving,
  isEditMode
}: SaveModalProps) {
  if (!isOpen) return null;

  const isInvalid = !name.trim() || !description.trim();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-background/20 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl bg-card border border-border/10 rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in duration-200">
        
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-primary/20" />
        
        <div className="p-8 space-y-8">
          
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Save size={18} />
                </div>
                <h2 className="text-xl font-bold text-foreground tracking-tight">
                  {isEditMode ? 'Update Skill Repository' : 'Initialize Skill Vault'}
                </h2>
              </div>
              <p className="text-[9px] text-foreground/20 font-bold uppercase tracking-[0.2em] pl-12">
                All logic units are encrypted and private by default
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 bg-secondary/50 hover:bg-foreground hover:text-background border border-border/10 rounded-xl transition-all"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-widest text-foreground/30 px-1 flex items-center gap-2">
                Identification Name <span className="text-red-500/50">*</span>
              </label>
              <input 
                autoFocus
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                className="w-full h-11 px-4 bg-secondary/30 border border-border/10 rounded-xl text-sm font-bold text-foreground outline-none focus:border-primary/50 transition-all placeholder:text-foreground/10"
                placeholder="e.g. Lead Researcher Alpha"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-foreground/30 flex items-center gap-2">
                  Capability Description <span className="text-red-500/50">*</span>
                </label>
                <div className="flex items-center gap-1 text-[8px] text-foreground/20 font-bold uppercase">
                  <Info size={10} />
                  Drives AI tool discovery
                </div>
              </div>
              <textarea 
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                className="w-full px-4 py-3 bg-secondary/30 border border-border/10 rounded-xl text-[11px] font-medium text-foreground/70 outline-none resize-none min-h-[120px] focus:border-primary/50 transition-all leading-relaxed placeholder:text-foreground/10 no-scrollbar"
                placeholder="Precisely define what this skill accomplishes for downstream agents..."
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button 
              onClick={onClose}
              className="px-6 h-10 text-[9px] font-bold uppercase tracking-widest text-foreground/30 hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={onSave}
              disabled={isSaving || isInvalid}
              className="flex-1 h-12 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-primary hover:text-white transition-all disabled:opacity-20 shadow-xl active:scale-95"
            >
              {isSaving ? (
                <Activity size={16} className="animate-spin" />
              ) : (
                <>
                  Committing To Vault
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
