'use client';

import React from 'react';
import { ArrowRight, Search, Activity, Cpu, Layers } from 'lucide-react';

export default function LandingVisualBuilder() {
  return (
    <section className="py-32 px-6">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <h2 className="text-4xl lg:text-6xl font-bold font-display tracking-tight text-foreground">Orchestrate complex logic visually</h2>
        <p className="text-xl text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto">Build sophisticated autonomous workflows with an intuitive, drag-and-drop workspace design.</p>
        
        <div className="mt-16 bg-card rounded-[2.5rem] border border-border/40 p-12 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 opacity-[0.2] bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:24px_24px] rounded-[2.5rem]"></div>
          <div className="relative flex flex-col sm:flex-row items-center justify-center gap-8 py-12">
             <div className="bg-card p-6 rounded-[1.5rem] border border-border/40 shadow-sm flex items-center gap-4 w-64 transition-all">
                <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center text-muted-foreground"><Search size={22} strokeWidth={2.5} /></div>
                <div className="text-left">
                   <div className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-widest mb-2">Market Analysis</div>
                   <div className="w-20 h-1 bg-secondary rounded-full"></div>
                </div>
             </div>
             <ArrowRight className="text-muted-foreground/20 hidden sm:block" strokeWidth={2.5} />
             <div className="bg-card p-6 rounded-[1.5rem] border border-primary shadow-xl shadow-primary/10 flex items-center gap-4 w-64 relative group/node -rotate-2 hover:rotate-0 transition-all">
                <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground rounded-xl p-2.5 shadow-xl animate-pulse"><Activity size={14} strokeWidth={3} /></div>
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shadow-inner"><Cpu size={22} strokeWidth={2.5} /></div>
                <div className="text-left">
                   <div className="text-[10px] font-bold uppercase text-primary tracking-widest mb-2">Neural Processing</div>
                   <div className="w-24 h-1 bg-primary/20 rounded-full"></div>
                </div>
             </div>
             <ArrowRight className="text-muted-foreground/20 hidden sm:block" strokeWidth={2.5} />
             <div className="bg-card p-6 rounded-[1.5rem] border border-border/40 shadow-sm flex items-center gap-4 w-64 transition-all">
                <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center text-muted-foreground"><Layers size={22} strokeWidth={2.5} /></div>
                <div className="text-left">
                   <div className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-widest mb-2">Autonomous Action</div>
                   <div className="w-16 h-1 bg-secondary rounded-full"></div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
