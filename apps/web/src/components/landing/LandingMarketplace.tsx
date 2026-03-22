'use client';

import React from 'react';
import { Bot, MousePointer2, Star } from 'lucide-react';

const agents = [
  { name: 'SEO Research Bot', creator: 'Tech Solutions', inst: '4K', rating: 4.8 },
  { name: 'Social Media Manager', creator: 'Creative Labs', inst: '8.2K', rating: 4.9 },
  { name: 'Sales Lead Finder', creator: 'Growth Hub', inst: '12K', rating: 4.7 },
  { name: 'Article Summarizer', creator: 'Info AI', inst: '9.5K', rating: 4.9 },
];

export default function LandingMarketplace() {
  return (
    <section className="py-32 px-6 bg-accent/30">
      <div className="max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-4">
           <h2 className="text-4xl lg:text-5xl font-black italic uppercase tracking-tighter">Community_Registry</h2>
           <p className="text-xl text-muted font-bold opacity-60 uppercase tracking-tight">Browse and install specialized logic units curated by the network.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {agents.map((agent, i) => (
            <div key={i} className="bg-card rounded-[2.5rem] border border-border/60 overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all group">
               <div className="p-8 space-y-6">
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 bg-primary/10 rounded-[1.25rem] flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-inner">
                        <Bot size={32} strokeWidth={3} />
                     </div>
                     <div className="text-left">
                        <h4 className="font-black text-sm uppercase italic tracking-tighter">{agent.name}</h4>
                        <p className="text-[10px] text-muted font-bold opacity-40 uppercase">CREATOR::{agent.creator}</p>
                     </div>
                  </div>
                  <div className="flex items-center justify-between py-5 border-y border-border/40">
                     <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted italic tracking-widest">
                        <MousePointer2 size={14} strokeWidth={3} className="text-primary" /> {agent.inst} :: UPLINKS
                     </div>
                     <div className="flex items-center gap-1.5 text-primary">
                        <Star size={12} fill="currentColor" />
                        <span className="text-[10px] font-black italic text-foreground tracking-tighter">{agent.rating}</span>
                     </div>
                  </div>
                  <button className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:scale-[1.05] transition-all shadow-xl shadow-primary/20 italic">
                    INITIALISE_UNIT
                  </button>
               </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
