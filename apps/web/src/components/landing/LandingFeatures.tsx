'use client';

import React from 'react';
import { MousePointer2, Layers, ShoppingBag, Cpu } from 'lucide-react';

const features = [
  { icon: <MousePointer2 size={28} />, title: 'Uplink Builder', desc: 'Design agents with an intuitive, drag-and-drop terminal interface.' },
  { icon: <Layers size={28} />, title: 'Core Modules', desc: 'Access a wide range of pre-compiled autonomous integrations.' },
  { icon: <ShoppingBag size={28} />, title: 'Asset Registry', desc: 'Discover and deploy pre-built logic units from the network.' },
  { icon: <Cpu size={28} />, title: 'Edge Compute', desc: 'Execute complex logic at enterprise scale with zero latency.' },
];

export default function LandingFeatures() {
  return (
    <section id="features" className="py-24 px-6 bg-accent/30">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, i) => (
            <div key={i} className="bg-card p-12 rounded-[3.5rem] border border-border/60 hover:shadow-2xl transition-all group flex flex-col items-center text-center relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
               <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary mb-10 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-inner">
                {f.icon}
              </div>
              <h3 className="text-xl font-black uppercase italic tracking-tighter mb-4">{f.title}</h3>
              <p className="text-muted text-xs font-bold leading-relaxed opacity-60 uppercase">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
