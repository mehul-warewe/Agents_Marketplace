'use client';

import React from 'react';
import { MousePointer2, Layers, ShoppingBag, Cpu } from 'lucide-react';

const features = [
  { icon: <MousePointer2 size={28} strokeWidth={2.5} />, title: 'Visual Orchestrator', desc: 'Construct complex agent behaviors with our premium drag-and-drop workspace.' },
  { icon: <Layers size={28} strokeWidth={2.5} />, title: 'Skill Library', desc: 'Expand agent capabilities with a vast library of pre-integrated digital tools.' },
  { icon: <ShoppingBag size={28} strokeWidth={2.5} />, title: 'Global Hub', desc: 'Discover and deploy industry-leading workforce templates and specialized units.' },
  { icon: <Cpu size={28} strokeWidth={2.5} />, title: 'Neural Engine', desc: 'Reliably execute high-volume autonomous operations with enterprise-scale infrastructure.' },
];

export default function LandingFeatures() {
  return (
    <section id="features" className="py-32 px-6 bg-secondary">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, i) => (
            <div key={i} className="bg-card p-12 rounded-[2.5rem] border border-border/40 hover:shadow-xl transition-all group flex flex-col items-center text-center relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700 opacity-0 group-hover:opacity-100" />
               <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center text-primary mb-8 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 border border-border/40">
                {f.icon}
              </div>
              <h3 className="text-xl font-bold font-display tracking-tight mb-4 text-foreground">{f.title}</h3>
              <p className="text-muted-foreground text-sm font-medium leading-relaxed opacity-70">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
