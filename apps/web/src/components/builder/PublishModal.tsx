'use client';
import React from 'react';
import { X, Rocket, Globe, Lock, ArrowRight, Info, Activity, Zap } from 'lucide-react';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  onNameChange: (val: string) => void;
  description: string;
  onDescriptionChange: (val: string) => void;
  onPublish: (published: boolean, price: number, category: string) => void;
  isPublishing: boolean;
  isEditMode: boolean;
  initialPrice?: number;
  initialPublished?: boolean;
  initialCategory?: string;
}

const CATEGORIES = [
  'Automation',
  'Intelligence',
  'Analysis',
  'Enterprise',
  'Social'
];

export function PublishModal({
  isOpen,
  onClose,
  name,
  onNameChange,
  description,
  onDescriptionChange,
  onPublish,
  isPublishing,
  isEditMode,
  initialPrice = 0,
  initialPublished = false,
  initialCategory
}: PublishModalProps) {
  const [isPublic, setIsPublic] = React.useState(initialPublished);
  const [price, setPrice] = React.useState(initialPrice);
  const [category, setCategory] = React.useState(initialCategory || CATEGORIES[0]);

  const handlePriceChange = (val: string) => {
    const num = parseInt(val);
    if (isNaN(num)) setPrice(0);
    else setPrice(Math.max(0, num));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-transparent"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl bg-card border border-border/10 rounded-2xl shadow-2xl overflow-hidden z-10">
        
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-indigo-500/40" />
        
        <div className="p-8 space-y-8">
          
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
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
            <div className="bg-secondary/20 rounded-xl p-4 border border-border/10">
               <h3 className="text-sm font-bold text-foreground mb-1">{name}</h3>
               <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                  {description || 'No description provided.'}
               </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
               <div 
                 onClick={() => setIsPublic(false)}
                 className={`p-4 border rounded-xl space-y-3 cursor-pointer transition-all ${!isPublic ? 'bg-secondary border-primary/40 shadow-inner' : 'bg-transparent border-border/10 opacity-40 hover:opacity-100'}`}
               >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center text-foreground/50">
                      <Lock size={14} />
                    </div>
                    <div className={`w-3 h-3 rounded-full ${!isPublic ? 'bg-primary' : 'bg-muted'}`} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-bold uppercase tracking-widest">Private Skill</p>
                    <p className="text-[8px] text-foreground/30 font-medium leading-tight">Internal use only</p>
                  </div>
               </div>

               <div 
                 onClick={() => setIsPublic(true)}
                 className={`p-4 border rounded-xl space-y-3 cursor-pointer transition-all ${isPublic ? 'bg-indigo-500/5 border-indigo-500/40 shadow-inner' : 'bg-transparent border-border/10 opacity-40 hover:opacity-100'}`}
               >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                      <Globe size={14} />
                    </div>
                    <div className={`w-3 h-3 rounded-full ${isPublic ? 'bg-indigo-500 pulse' : 'bg-muted'}`} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-500">Marketplace</p>
                    <p className="text-[8px] text-indigo-500/40 font-medium leading-tight">Shared with the community</p>
                  </div>
               </div>
            </div>

            {isPublic && (
              <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-indigo-500 px-1">Specialization</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-11 px-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl text-[11px] font-bold text-indigo-500 outline-none focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-indigo-500 px-1">Price (Credits)</label>
                  <div className="relative">
                    <input 
                      type="number"
                      min="0"
                      step="1"
                      value={price}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      className="w-full h-11 px-4 pr-10 bg-indigo-500/5 border border-indigo-500/20 rounded-xl text-sm font-bold text-indigo-500 outline-none focus:border-indigo-500/50 transition-all font-mono"
                      placeholder="0"
                    />
                    <Zap size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-500 opacity-50" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button 
              onClick={onClose}
              className="px-6 h-10 text-[9px] font-bold uppercase tracking-widest text-foreground/30 hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => onPublish(isPublic, price, category)}
              disabled={isPublishing || !name.trim()}
              className="flex-1 h-10 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 shadow-lg shadow-indigo-500/20 border-none"
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
