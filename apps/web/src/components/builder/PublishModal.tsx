'use client';
import React from 'react';
import { 
  X, 
  Rocket, 
  Globe, 
  Lock, 
  ArrowRight,
  Info
} from 'lucide-react';

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
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-xl animate-in fade-in duration-500"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-card border border-border/60 rounded-[2.5rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
        
        {/* Header Decor */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-right from-indigo-500 via-purple-500 to-indigo-500" />
        
        {/* Main Content */}
        <div className="p-10 space-y-10">
          
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <Rocket size={20} />
                </div>
                <h2 className="text-3xl font-black text-foreground italic uppercase tracking-tighter">
                  {isEditMode ? 'Update Module' : 'Publish Skill'}
                </h2>
              </div>
              <p className="text-[11px] text-muted/60 font-bold uppercase tracking-[0.2em] pl-1">
                Finalise your agentic protocol for deployment
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-3 bg-foreground/[0.03] hover:bg-foreground/[0.08] border border-border/40 rounded-full transition-all group"
            >
              <X size={20} className="group-hover:rotate-90 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {/* Identity Section */}
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500/80 pl-1">Process Identity</label>
                <div className="relative group">
                  <input 
                    autoFocus
                    value={name}
                    onChange={(e) => onNameChange(e.target.value)}
                    className="w-full px-6 py-5 bg-foreground/[0.03] border border-border/40 rounded-3xl text-lg font-black italic uppercase tracking-widest text-foreground outline-none focus:border-indigo-500/50 transition-all placeholder:text-muted/10"
                    placeholder="ENTER_MODULE_NAME..."
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between pl-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500/80">Skill Objective</label>
                  <div className="flex items-center gap-1.5 text-[9px] text-muted/40 font-bold uppercase">
                    <Info size={10} />
                    Used by AI for tool discovery
                  </div>
                </div>
                <textarea 
                  value={description}
                  onChange={(e) => onDescriptionChange(e.target.value)}
                  className="w-full px-6 py-5 bg-foreground/[0.03] border border-border/40 rounded-3xl text-[13px] font-medium text-muted/80 outline-none resize-none min-h-[140px] focus:border-indigo-500/50 transition-all leading-relaxed"
                  placeholder="Describe exactly what this skill does and when the agent should call it..."
                />
              </div>
            </div>

            {/* Config Grid */}
            <div className="grid grid-cols-2 gap-4">
               <div className="p-6 bg-foreground/[0.03] border border-border/40 rounded-[2rem] space-y-4 opacity-40 cursor-not-allowed group">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-muted/10 flex items-center justify-center text-muted">
                      <Globe size={18} />
                    </div>
                    <div className="w-8 h-4 bg-muted/20 rounded-full" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest">Public API</p>
                    <p className="text-[9px] text-muted/60 font-medium leading-tight">Accessible via external REST endpoints</p>
                  </div>
               </div>

               <div className="p-6 bg-indigo-500/5 border border-indigo-500/20 rounded-[2rem] space-y-4 group ring-1 ring-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.05)]">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                      <Lock size={18} />
                    </div>
                    <div className="w-8 h-4 bg-indigo-500 rounded-full flex items-center px-1">
                       <div className="w-2.5 h-2.5 bg-white rounded-full ml-auto" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Private Protocol</p>
                    <p className="text-[9px] text-indigo-400/60 font-medium leading-tight">Secure internal execution only</p>
                  </div>
               </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center gap-4 pt-4">
            <button 
              onClick={onClose}
              className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-muted/60 hover:text-foreground transition-colors"
            >
              Continue Editing
            </button>
            <button 
              onClick={onPublish}
              disabled={isPublishing || !name.trim()}
              className="flex-1 px-8 py-5 bg-foreground text-background rounded-3xl text-[12px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 shadow-xl shadow-black/20"
            >
              {isPublishing ? (
                <div className="w-4 h-4 border-2 border-background border-t-transparent animate-spin rounded-full" />
              ) : (
                <>
                  {isEditMode ? 'Update Module' : 'Initialise Deployment'}
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
