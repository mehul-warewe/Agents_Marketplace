'use client';

import React from 'react';
import { Bot, Search, Cpu, Zap, ChevronRight, Activity } from 'lucide-react';
import { cn } from '@/components/ui/utils';

interface EmployeeFleetSidebarProps {
  employees: any[];
  onDragStart: (event: React.DragEvent, employee: any) => void;
  isLoading?: boolean;
}

export default function EmployeeFleetSidebar({ employees, onDragStart, isLoading }: EmployeeFleetSidebarProps) {
  const [search, setSearch] = React.useState('');

  const filtered = employees?.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.workerDescription?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col h-full animate-in slide-in-from-left duration-500 z-20">
      <header className="p-6 border-b border-border space-y-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <Bot size={14} strokeWidth={3} />
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Resource Directory</span>
          </div>
          <h2 className="text-xl font-black tracking-tighter uppercase text-foreground">Employee Registry</h2>
          <p className="text-[10px] font-medium text-muted-foreground italic mt-1">Available specialized professional units</p>
        </div>

        <div className="relative group">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-indigo-600 transition-colors" />
          <input
            type="text"
            placeholder="Search registry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-muted border border-border rounded-xl pl-11 pr-4 py-3 outline-none focus:border-indigo-600 transition-all font-bold text-[11px] placeholder:text-muted-foreground/20"
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Activity className="animate-spin mb-4 text-indigo-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Synchronizing...</span>
          </div>
        ) : filtered?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <Bot size={32} strokeWidth={1.5} className="mb-4 text-muted-foreground/20" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">No units identified</p>
          </div>
        ) : (
          filtered?.map((employee) => (
            <div
              key={employee.id}
              draggable
              onDragStart={(e) => onDragStart(e, employee)}
              className="p-4 bg-muted/30 border border-border rounded-2xl hover:border-indigo-600/40 hover:bg-muted transition-all cursor-grab active:cursor-grabbing group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-card border border-border rounded-xl flex items-center justify-center text-muted-foreground group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all duration-300">
                  <Cpu size={18} strokeWidth={2.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-bold text-foreground truncate leading-tight mb-1">{employee.name}</h4>
                  <div className="flex items-center gap-1 text-[8px] font-black text-indigo-600/70 uppercase tracking-widest">
                    <Zap size={9} fill="currentColor" /> Unified Unit
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium leading-relaxed italic line-clamp-2">
                {employee.workerDescription || 'Specialized workforce unit for process orchestration.'}
              </p>
            </div>
          ))
        )}
      </div>

      <footer className="p-6 border-t border-border bg-muted/10">
        <div className="p-4 bg-indigo-600/[0.03] border border-indigo-600/10 rounded-xl">
          <p className="text-[8px] font-black text-indigo-600 uppercase tracking-widest mb-1.5">Deployment Tip</p>
          <p className="text-[10px] font-medium text-muted-foreground leading-relaxed italic">
            Drag employee modules onto the canvas and connect them to the manager node to define execution logic.
          </p>
        </div>
      </footer>
    </div>
  );
}
