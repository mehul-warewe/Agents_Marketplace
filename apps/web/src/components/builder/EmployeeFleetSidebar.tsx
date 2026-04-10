'use client';

import React from 'react';
import { Bot, Search, Cpu, Zap, ChevronRight, Activity } from 'lucide-react';

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
    <div className="w-96 bg-card border-r border-border/40 flex flex-col h-full animate-in slide-in-from-left duration-500">
      <header className="p-10 border-b border-border/40 space-y-8">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Employees</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 italic">Available specialized units</p>
        </div>

        <div className="relative group">
          <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-muted opacity-40 group-focus-within:text-foreground group-focus-within:opacity-100 transition-all" />
          <input
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-foreground/[0.03] border border-border/40 rounded-2xl pl-16 pr-8 py-5 outline-none focus:bg-background focus:border-foreground transition-all font-black text-[10px] uppercase tracking-widest italic shadow-inner"
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-30">
            <Activity className="animate-pulse mb-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Loading...</span>
          </div>
        ) : filtered?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-30 px-10">
            <Bot size={40} strokeWidth={1} className="mb-6" />
            <p className="text-[10px] font-black uppercase tracking-widest">No employees found</p>
          </div>
        ) : (
          filtered?.map((employee) => (
            <div
              key={employee.id}
              draggable
              onDragStart={(e) => onDragStart(e, employee)}
              className="p-6 bg-foreground/[0.02] border border-border/40 rounded-3xl hover:border-foreground/20 hover:bg-foreground/[0.04] transition-all cursor-grab active:cursor-grabbing group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-background border border-border/40 rounded-2xl flex items-center justify-center text-foreground group-hover:bg-foreground group-hover:text-background transition-all">
                  <Cpu size={20} strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-black uppercase tracking-tight italic truncate">{employee.name}</h4>
                  <div className="flex items-center gap-1 text-[8px] font-black text-yellow-500 uppercase tracking-widest">
                    <Zap size={10} fill="currentColor" /> EMPLOYEE
                  </div>
                </div>
                <ChevronRight size={14} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[10px] text-muted font-bold uppercase tracking-tight opacity-50 line-clamp-2 italic">
                {employee.workerDescription || 'Specialized workforce unit.'}
              </p>
            </div>
          ))
        )}
      </div>

      <footer className="p-8 border-t border-border/40 bg-foreground/[0.01]">
        <div className="p-6 bg-accent/5 border border-accent/10 rounded-2xl">
          <p className="text-[9px] font-black text-accent uppercase tracking-widest mb-2 italic">Quick Tip</p>
          <p className="text-[10px] font-bold text-muted uppercase tracking-tight italic opacity-60 leading-relaxed">
            Drag employees onto the canvas and connect them to the manager to assign them.
          </p>
        </div>
      </footer>
    </div>
  );
}
