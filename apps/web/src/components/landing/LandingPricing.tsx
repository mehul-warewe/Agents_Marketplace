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
      <div className="max-w-5xl mx-auto space-y-16">
         <div className="text-center space-y-4">
            <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight">Simple, Transparent Pricing</h2>
            <p className="text-xl text-muted">Choose the plan that's right for your automation needs.</p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, i) => (
              <div key={i} className={`p-12 rounded-[3.5rem] border ${plan.featured ? 'border-primary ring-8 ring-primary/5' : 'border-border/60'} bg-card relative overflow-hidden flex flex-col transition-all hover:scale-[1.02]`}>
                {plan.featured && <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-bl-3xl italic">Priority</div>}
                <div className="space-y-2 mb-10">
                   <h3 className="text-sm font-black text-muted uppercase tracking-[0.4em] italic opacity-40">{plan.name}_Level</h3>
                   <div className="flex items-baseline gap-2">
                       <span className="text-5xl font-black italic tracking-tighter">{plan.price}</span>
                       <span className="text-muted text-[10px] font-black uppercase tracking-widest opacity-40">/ MO</span>
                   </div>
                </div>
                <ul className="space-y-5 mb-12 flex-1">
                   {plan.features.map(f => (
                     <li key={f} className="flex items-center gap-4 text-[11px] font-black uppercase tracking-tight text-muted/60 italic">
                       <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center text-primary"><Zap size={12} strokeWidth={3} /></div>
                       {f}
                     </li>
                   ))}
                </ul>
                <button className={`w-full py-5 rounded-[1.75rem] font-black text-[10px] uppercase tracking-[0.3em] transition-all italic ${plan.featured ? 'bg-primary text-primary-foreground hover:shadow-2xl shadow-primary/20 hover:scale-[1.05]' : 'bg-foreground/[0.03] text-foreground border border-border/40 hover:bg-foreground hover:text-background'}`}>
                   Initialise_{plan.name}
                </button>
              </div>
            ))}
         </div>
      </div>
    </section>
  );
}
