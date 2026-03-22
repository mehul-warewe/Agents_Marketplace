'use client';

import React from 'react';
import { ArrowRight, Search, Activity, Cpu, Layers } from 'lucide-react';

export default function LandingVisualBuilder() {
  return (
    <section className="py-32 px-6">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <h2 className="text-4xl lg:text-5xl font-black italic uppercase tracking-tighter">Design_AI_Agents_Visually</h2>
        <p className="text-xl text-muted font-bold opacity-60 uppercase tracking-tight">Create automation workflows with an intuitive, drag-and-drop terminal interface.</p>
        
        <div className="mt-16 bg-card rounded-[2.5rem] border border-border p-8 shadow-2xl relative">
          <div className="absolute inset-0 opacity-[0.4] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] rounded-[2.5rem]"></div>
          <div className="relative flex flex-col sm:flex-row items-center justify-center gap-8 py-12">
             <div className="bg-card p-6 rounded-[1.5rem] border border-border/60 shadow-lg flex items-center gap-4 w-64 group hover:scale-105 transition-all">
                <div className="w-12 h-12 bg-foreground/[0.03] rounded-xl flex items-center justify-center text-muted group-hover:bg-foreground group-hover:text-background transition-all"><Search size={24} strokeWidth={3} /></div>
                <div className="text-left">
                   <div className="text-[10px] font-black uppercase text-muted tracking-widest mb-1 italic">Web_Search</div>
                   <div className="w-20 h-1.5 bg-foreground/10 rounded-full"></div>
                </div>
             </div>
             <ArrowRight className="text-muted/30 hidden sm:block" strokeWidth={3} />
             <div className="bg-card p-6 rounded-[1.5rem] border-2 border-primary shadow-2xl shadow-primary/10 flex items-center gap-4 w-64 relative group hover:scale-110 transition-all">
                <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground rounded-full p-2 shadow-xl animate-pulse"><Activity size={12} strokeWidth={4} /></div>
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20"><Cpu size={24} strokeWidth={3} /></div>
                <div className="text-left">
                   <div className="text-[10px] font-black uppercase text-primary tracking-widest mb-1 italic">Logic_Analysis</div>
                   <div className="w-24 h-1.5 bg-primary/30 rounded-full"></div>
                </div>
             </div>
             <ArrowRight className="text-muted/30 hidden sm:block" strokeWidth={3} />
             <div className="bg-card p-6 rounded-[1.5rem] border border-border/60 shadow-lg flex items-center gap-4 w-64 group hover:scale-105 transition-all">
                <div className="w-12 h-12 bg-foreground/[0.03] rounded-xl flex items-center justify-center text-muted group-hover:bg-foreground group-hover:text-background transition-all"><Layers size={24} strokeWidth={3} /></div>
                <div className="text-left">
                   <div className="text-[10px] font-black uppercase text-muted tracking-widest mb-1 italic">Execute_Action</div>
                   <div className="w-16 h-1.5 bg-foreground/10 rounded-full"></div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
