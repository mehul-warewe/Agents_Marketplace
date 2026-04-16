'use client';
import React from 'react';
import { X, Rocket, Globe, Lock, ArrowRight, Info, Activity } from 'lucide-react';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  onNameChange: (val: string) => void;
  description: string;
  onDescriptionChange: (val: string) => void;
  onPublish: () => void;
  isPublishing: boolean;
  isEditMode: boolean;
}

export function PublishModal({
  isOpen,
  onClose,
  name,
  onNameChange,
  description,
  onDescriptionChange,
  onPublish,
  isPublishing,
  isEditMode
}: PublishModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-transparent"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl bg-card border border-border/10 rounded-2xl shadow-2xl overflow-hidden z-10">
        
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-primary/40" />
        
        <div className="p-8 space-y-8">
          
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Rocket size={18} />
                </div>
                <h2 className="text-xl font-bold text-foreground tracking-tight">
                  {isEditMode ? 'Update Skill' : 'Publish Skill'}
                </h2>
              </div>
              <p className="text-[9px] text-foreground/20 font-bold uppercase tracking-[0.2em] pl-12">
                Finalise and deploy this skill module
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 bg-secondary/50 hover:bg-foreground hover:text-background border border-border/10 rounded-xl transition-all"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-widest text-foreground/30 px-1">Skill Name</label>
              <input 
                autoFocus
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                className="w-full h-11 px-4 bg-secondary/30 border border-border/10 rounded-xl text-sm font-bold text-foreground outline-none focus:border-primary/50 transition-all placeholder:text-foreground/10"
                placeholder="Enter skill name..."
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-foreground/30">Description</label>
                <div className="flex items-center gap-1 text-[8px] text-foreground/20 font-bold uppercase">
                  <Info size={10} />
                  Used by AI for tool discovery
                </div>
              </div>
              <textarea 
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                className="w-full px-4 py-3 bg-secondary/30 border border-border/10 rounded-xl text-[11px] font-medium text-foreground/70 outline-none resize-none min-h-[120px] focus:border-primary/50 transition-all leading-relaxed placeholder:text-foreground/10 no-scrollbar"
                placeholder="Describe what this skill does and when the agent should use it..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div className="p-4 bg-secondary/20 border border-border/10 rounded-xl space-y-3 opacity-40 cursor-not-allowed">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center text-foreground/30">
                      <Globe size={14} />
                    </div>
                    <div className="w-7 h-3.5 bg-foreground/10 rounded-full" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-bold uppercase tracking-widest">Public API</p>
                    <p className="text-[8px] text-foreground/30 font-medium leading-tight">Accessible via external endpoints</p>
                  </div>
               </div>

               <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Lock size={14} />
                    </div>
                    <div className="w-7 h-3.5 bg-primary rounded-full flex items-center px-1">
                       <div className="w-2 h-2 bg-white rounded-full ml-auto" />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-primary">Private</p>
                    <p className="text-[8px] text-primary/40 font-medium leading-tight">Secure internal execution only</p>
                  </div>
               </div>
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
              onClick={onPublish}
              disabled={isPublishing || !name.trim()}
              className="flex-1 h-10 bg-primary text-primary-foreground rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 shadow-lg shadow-primary/20"
            >
              {isPublishing ? (
                <Activity size={14} className="animate-spin" />
              ) : (
                <>
                  {isEditMode ? 'Update Skill' : 'Publish'}
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
