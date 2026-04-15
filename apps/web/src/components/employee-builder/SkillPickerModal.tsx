'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Layers, Zap, CheckCircle, Terminal } from 'lucide-react';
import { usePublishedSkills } from '@/hooks/useSkills';

interface SkillPickerModalProps {
  onClose: () => void;
  onSelect: (val: { id: string; instruction: string }) => void;
  skills: any[];
}

export default function SkillPickerModal({ onClose, onSelect, skills }: SkillPickerModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [instruction, setInstruction] = useState('');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="absolute inset-0 bg-background/95 backdrop-blur-3xl" 
        onClick={onClose} 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.95 }} 
        className="relative w-full max-w-5xl max-h-[85vh] bg-card border border-border/60 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-10 border-b border-border/40 flex justify-between items-center bg-foreground/[0.01]">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-primary">
              <Layers size={18} strokeWidth={3} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">CapabilityMount</span>
            </div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter">Mount_Skill_Module</h2>
          </div>
          <button onClick={onClose} className="p-4 bg-foreground/5 rounded-2xl hover:bg-foreground/10 transition-all font-black text-xs uppercase group">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12 no-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {skills?.map((skill: any) => (
              <div 
                key={skill.id} 
                onClick={() => setSelectedId(skill.id)} 
                className={`p-8 rounded-3xl border-2 transition-all cursor-pointer relative group ${
                  selectedId === skill.id ? 'bg-primary/5 border-primary shadow-xl shadow-primary/5' : 'bg-background border-border/40 hover:border-primary/20'
                }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    selectedId === skill.id ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-foreground/5 text-muted group-hover:bg-primary/10 group-hover:text-primary'
                  }`}>
                    <Zap size={20} strokeWidth={3} />
                  </div>
                  {selectedId === skill.id && <CheckCircle className="text-primary" size={24} strokeWidth={3} />}
                </div>
                <h4 className="text-xl font-black italic uppercase tracking-tighter mb-2">{skill.name}</h4>
                <p className="text-[9px] text-muted font-bold uppercase opacity-40 line-clamp-2 tracking-widest leading-relaxed">
                  {skill.description}
                </p>
              </div>
            ))}
          </div>
          {selectedId && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 bg-foreground/[0.03] p-10 rounded-[2.5rem] border border-primary/20">
              <div className="flex items-center gap-3 ml-2 mb-2">
                <Terminal size={14} className="text-primary" />
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Directive</label>
              </div>
              <textarea 
                value={instruction} 
                onChange={e => setInstruction(e.target.value)} 
                placeholder="SPECIFY MISSION CONTEXT FOR THIS SKILL MODULE..."
                className="w-full bg-background border border-border/40 rounded-2xl p-8 text-xs font-bold uppercase focus:outline-none focus:border-primary transition-all resize-none shadow-inner min-h-[140px]" 
              />
            </motion.div>
          )}
        </div>
        <div className="p-10 border-t border-border/40 bg-foreground/[0.01]">
          <button 
            onClick={() => selectedId && onSelect({ id: selectedId, instruction })} 
            disabled={!selectedId} 
            className="w-full h-16 bg-primary text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-[0.4em] hover:scale-[1.01] transition-all disabled:opacity-50 shadow-2xl flex items-center justify-center gap-4"
          >
            Deploy_Skill <CheckCircle size={18} strokeWidth={3} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
