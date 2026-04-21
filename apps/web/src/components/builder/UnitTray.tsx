'use client';

import React from 'react';
import { Bot, Zap, Activity, Shield, StickyNote } from 'lucide-react';

interface UnitTrayProps {
  onDragStart: (event: React.DragEvent, type: string) => void;
}

const categories = [
  {
    id: 'agent',
    label: 'Employee',
    icon: Bot,
    accent: 'bg-indigo-600 text-white',
    border: 'border-indigo-600/20',
  },
  {
    id: 'tool',
    label: 'Skill',
    icon: Zap,
    accent: 'bg-muted text-muted-foreground',
    border: 'border-border',
  },
  {
    id: 'trigger',
    label: 'Event',
    icon: Activity,
    accent: 'bg-muted text-muted-foreground',
    border: 'border-border',
  },
  {
    id: 'condition',
    label: 'Gateway',
    icon: Shield,
    accent: 'bg-muted text-muted-foreground',
    border: 'border-border',
  },
  {
    id: 'note',
    label: 'Note',
    icon: StickyNote,
    accent: 'bg-muted text-muted-foreground',
    border: 'border-border',
  },
];

export default function UnitTray({ onDragStart }: UnitTrayProps) {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-6 duration-500">
      <div className="flex items-center gap-2 px-4 py-3 bg-card border border-border rounded-2xl shadow-lg">
        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mr-2 shrink-0">
          Add Node
        </span>
        <div className="w-px h-6 bg-border" />
        <div className="flex items-center gap-2 ml-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              draggable
              onDragStart={(e) => onDragStart(e, cat.id)}
              className="group flex flex-col items-center gap-1.5 cursor-grab active:cursor-grabbing select-none"
              title={cat.label}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-200
                  group-hover:scale-110 group-hover:shadow-md group-active:scale-95
                  ${cat.accent} ${cat.border}`}
              >
                <cat.icon size={16} strokeWidth={2} />
              </div>
              <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60 group-hover:text-foreground transition-colors">
                {cat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
