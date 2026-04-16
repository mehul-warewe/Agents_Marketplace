'use client';

import React from 'react';
import { Zap } from 'lucide-react';

const plans = [
  { name: 'Trial', price: '$0', featured: false, features: ['100 Execution Units', 'Basic Nodes', 'Standard Support'] },
  { name: 'Pro', price: '$19', featured: true, features: ['1500 Execution Units', 'Premium Nodes', 'Priority Support', 'Private Storage'] },
  { name: 'Ultra', price: '$49', featured: false, features: ['5000 Execution Units', 'Custom Logic', 'Enterprise SLA', 'Team Collaboration'] }
];

export default function LandingPricing() {
  return (
    <section id="pricing" className="py-40 px-6">
      <div className="max-w-7xl mx-auto space-y-16">
         <div className="text-center space-y-4">
            <h2 className="text-4xl lg:text-6xl font-bold font-display tracking-tight text-foreground leading-tight">Scalable infrastructure <br /> for modern teams</h2>
            <p className="text-lg text-muted-foreground font-medium max-w-2xl mx-auto">Transparent, usage-based pricing designed to scale with your autonomous workforce.</p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, i) => (
              <div key={i} className={`p-10 rounded-[2.5rem] border ${plan.featured ? 'border-primary shadow-2xl shadow-primary/5 bg-card' : 'border-border/40 bg-card/50'} relative overflow-hidden flex flex-col transition-all hover:translate-y-[-4px]`}>
                {plan.featured && <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-bl-2xl">Recommended</div>}
                <div className="space-y-4 mb-10">
                   <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest">{plan.name} Tier</h3>
                   <div className="flex items-baseline gap-2">
                       <span className="text-5xl font-bold font-display tracking-tight text-foreground">{plan.price}</span>
                       <span className="text-muted-foreground text-xs font-medium uppercase tracking-widest opacity-40">/ month</span>
                   </div>
                </div>
                <ul className="space-y-5 mb-12 flex-1 border-t border-border/40 pt-10">
                   {plan.features.map(f => (
                     <li key={f} className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                       <div className="w-6 h-6 bg-secondary border border-border/40 rounded-lg flex items-center justify-center text-primary"><Zap size={12} strokeWidth={2.5} /></div>
                       {f}
                     </li>
                   ))}
                </ul>
                <button className={`w-full py-5 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all ${plan.featured ? 'bg-primary text-primary-foreground hover:opacity-90 shadow-xl shadow-primary/10' : 'bg-secondary text-foreground hover:bg-muted border border-border/40'}`}>
                   Get Started with {plan.name}
                </button>
              </div>
            ))}
         </div>
      </div>
    </section>
  );
}
