'use client';

import React from 'react';
import { Cpu, Zap, Shield, MessageSquare, Activity, LucideIcon, Plus } from 'lucide-react';

interface UnitTrayProps {
  onDragStart: (event: React.DragEvent, type: string) => void;
}

export default function UnitTray({ onDragStart }: UnitTrayProps) {
  const categories = [
    { id: 'agent', label: 'Agent', icon: Cpu, color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
    { id: 'tool', label: 'Tool', icon: Zap, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
    { id: 'trigger', label: 'Trigger', icon: Activity, color: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
    { id: 'condition', label: 'Condition', icon: Shield, color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
    { id: 'note', label: 'Note', icon: MessageSquare, color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  ];

  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 p-6 bg-card/40 backdrop-blur-3xl border border-border/10 rounded-[3rem] shadow-2xl z-50 animate-in slide-in-from-bottom-10 duration-700">
      {categories.map((cat) => (
        <div
          key={cat.id}
          draggable
          onDragStart={(e) => onDragStart(e, cat.id)}
          className="group flex flex-col items-center gap-4 cursor-grab active:cursor-grabbing hover:scale-105 transition-all duration-300"
        >
          <div className={`w-40 h-32 rounded-[2rem] bg-background border border-border/10 flex flex-col items-center justify-center gap-3 group-hover:border-accent/40 shadow-xl overflow-hidden relative`}>
            {/* Subtle background icon */}
            <cat.icon size={80} className="absolute -bottom-10 -right-10 text-foreground/5" />
            
            <div className={`p-3 rounded-2xl ${cat.color} border mb-1 group-hover:scale-110 transition-transform`}>
              <cat.icon size={24} />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] italic text-foreground">{cat.label}</span>
              <div className="flex items-center gap-1.5 mt-2 opacity-30 group-hover:opacity-100 transition-opacity">
                 <Plus size={10} className="text-muted" />
                 <span className="text-[7px] font-black uppercase tracking-widest text-muted">Drag to add</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
