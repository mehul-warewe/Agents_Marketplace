'use client';

import React from 'react';
import { Cpu, Zap, Shield, MessageSquare, Activity, LucideIcon, Plus, Bot } from 'lucide-react';

interface UnitTrayProps {
  onDragStart: (event: React.DragEvent, type: string) => void;
}

export default function UnitTray({ onDragStart }: UnitTrayProps) {
  const categories = [
    { id: 'agent', label: 'Operative', icon: Bot, color: 'text-primary-foreground bg-primary border-primary/20' },
    { id: 'tool', label: 'Capability', icon: Zap, color: 'text-foreground bg-secondary border-border/10' },
    { id: 'trigger', label: 'Signal', icon: Activity, color: 'text-foreground bg-secondary border-border/10' },
    { id: 'condition', label: 'Gateway', icon: Shield, color: 'text-foreground bg-secondary border-border/10' },
    { id: 'note', label: 'Directive', icon: MessageSquare, color: 'text-foreground bg-secondary border-border/10' },
  ];

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 p-4 bg-card border border-border rounded-3xl shadow-xl z-50 animate-in slide-in-from-bottom-10 duration-700">
      {categories.map((cat) => (
        <div
          key={cat.id}
          draggable
          onDragStart={(e) => onDragStart(e, cat.id)}
          className="group flex flex-col items-center cursor-grab active:cursor-grabbing hover:scale-105 transition-all duration-300 ease-out"
        >
          <div className="w-32 h-24 rounded-2xl bg-secondary border border-border/10 flex flex-col items-center justify-center gap-3 group-hover:border-border/40 shadow-inner overflow-hidden relative group-active:scale-95 transition-all">
            <div className={`p-2 rounded-xl ${cat.color} border shadow-md group-hover:scale-110 transition-all duration-300 relative z-10`}>
              <cat.icon size={18} strokeWidth={2.5} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-foreground/60 relative z-10">{cat.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
