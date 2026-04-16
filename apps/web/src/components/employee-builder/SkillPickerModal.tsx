'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Layers, Zap, CheckCircle, Terminal } from 'lucide-react';

interface SkillPickerModalProps {
  onClose: () => void;
  onSelect: (val: { id: string; instruction: string }) => void;
  skills: any[];
}

export default function SkillPickerModal({ onClose, onSelect, skills }: SkillPickerModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [instruction, setInstruction] = useState('');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="absolute inset-0 bg-transparent" 
        onClick={onClose} 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.98, y: 10 }} 
        className="relative w-full max-w-3xl max-h-[85vh] bg-card border border-border/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10"
      >
        <div className="p-5 border-b border-border/10 flex justify-between items-center bg-secondary/5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-primary">
              <Layers size={13} />
              <span className="text-[8px] font-bold uppercase tracking-widest leading-none">Skills</span>
            </div>
            <h2 className="text-base font-bold tracking-tight text-foreground uppercase leading-none">Deploy Protocol</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-foreground/5 rounded-lg text-foreground/20 hover:text-foreground transition-all">
            <X size={14} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {skills?.map((skill: any) => (
              <div 
                key={skill.id} 
                onClick={() => setSelectedId(skill.id)} 
                className={`p-3 rounded-xl border transition-all cursor-pointer relative group ${
                  selectedId === skill.id ? 'bg-primary/5 border-primary/50 shadow-md' : 'bg-card border-border/10 hover:border-primary/20 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    selectedId === skill.id ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-foreground/5 text-foreground/10 group-hover:bg-primary/10 group-hover:text-primary'
                  }`}>
                    <Zap size={14} />
                  </div>
                  {selectedId === skill.id && <CheckCircle className="text-primary" size={16} />}
                </div>
                <h4 className="text-[11px] font-bold tracking-tight mb-0.5 text-foreground">{skill.name}</h4>
                <p className="text-[9px] text-foreground/40 font-medium line-clamp-2 tracking-wide leading-relaxed uppercase">
                   {skill.description?.substring(0, 80)}...
                </p>
              </div>
            ))}
          </div>
          {selectedId && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3 bg-secondary/30 p-4 rounded-xl border border-border/10">
              <div className="flex items-center gap-2 px-1">
                <Terminal size={12} className="text-primary" />
                <label className="text-[9px] font-bold uppercase tracking-widest text-primary">Logic Instruction</label>
              </div>
              <textarea 
                value={instruction} 
                onChange={e => setInstruction(e.target.value)} 
                placeholder="Logic directive..."
                className="w-full bg-card border border-border/10 rounded-xl p-3 text-[11px] font-medium focus:outline-none focus:border-primary/50 transition-all resize-none shadow-inner min-h-[80px] no-scrollbar placeholder:text-foreground/5 leading-relaxed" 
              />
            </motion.div>
          )}
        </div>
        <div className="p-5 border-t border-border/10 bg-secondary/5">
          <button 
            onClick={() => selectedId && onSelect({ id: selectedId, instruction })} 
            disabled={!selectedId} 
            className="w-full h-10 bg-primary text-primary-foreground rounded-xl font-bold text-[9px] uppercase tracking-widest hover:scale-[1.01] transition-all disabled:opacity-30 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
          >
            Assign logic <CheckCircle size={14} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
