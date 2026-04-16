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
    <section className="py-40 px-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/2 rounded-full blur-[120px] -mr-32 -mt-32" />
      <div className="max-w-7xl mx-auto space-y-20 relative z-10">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
           <h2 className="text-4xl lg:text-6xl font-bold font-display tracking-tight text-foreground">A thriving ecosystem <br /> of pre-built intelligence</h2>
           <p className="text-lg text-muted-foreground font-medium">Browse and deploy specialized agent templates curated by our global network of developers.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {agents.map((agent, i) => (
            <div key={i} className="bg-card rounded-[2rem] border border-border/40 overflow-hidden hover:shadow-xl transition-all group">
               <div className="p-8 space-y-8">
                  <div className="flex items-center gap-5">
                     <div className="w-14 h-14 bg-secondary rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 border border-border/40">
                        <Bot size={28} strokeWidth={2.5} />
                     </div>
                     <div className="text-left space-y-1">
                        <h4 className="font-bold text-sm text-foreground tracking-tight">{agent.name}</h4>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">By {agent.creator}</p>
                     </div>
                  </div>
                  <div className="flex items-center justify-between py-6 border-y border-border/40">
                     <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                        <MousePointer2 size={12} strokeWidth={2.5} className="text-primary" /> {agent.inst} installs
                     </div>
                     <div className="flex items-center gap-1.5 text-primary">
                        <Star size={10} fill="currentColor" />
                        <span className="text-xs font-bold text-foreground">{agent.rating}</span>
                     </div>
                  </div>
                  <button className="w-full bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all">
                    Deploy Template
                  </button>
               </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
