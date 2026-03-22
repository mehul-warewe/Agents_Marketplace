'use client';

import React, { useState } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { useAuthStore } from '@/store/authStore';
import { Check, Sparkles, Zap, Shield, CreditCard, ChevronRight, Activity, Terminal, CheckCircle2, Star, ArrowRight } from 'lucide-react';
import api from '@/lib/api';


const tiers = [
  {
    id: 'free',
    name: 'Starter',
    price: '$0',
    description: 'Perfect for individual builders exploring autonomous logic.',
    credits: '100',
    features: ['Access to basic nodes', 'Standard execution priority', 'Public marketplace access'],
    buttonText: 'Current Plan',
    highlight: false,
    color: 'blue'
  },
  {
    id: 'pro',
    name: 'Pro Explorer',
    price: '$19',
    description: 'Production-grade tools for scaling your agent fleet.',
    credits: '1,500',
    features: ['Premium nodes access', 'Elevated task priority', 'Private agent storage', 'Unlimited active flows'],
    buttonText: 'Get Pro Access',
    highlight: true,
    color: 'indigo'
  },
  {
    id: 'ultra',
    name: 'Elite Scale',
    price: '$49',
    description: 'Maximum performance for institutional deployments.',
    credits: '5,000',
    features: ['Top-tier task priority', 'Institutional SLA', 'Dedicated API access', 'Team collaboration tools'],
    buttonText: 'Scale to Elite',
    highlight: false,
    color: 'purple'
  }
];

const creditPacks = [
  { id: '500_credits', amount: 500, price: '$5', discount: null },
  { id: '1200_credits', amount: 1200, price: '$10', discount: 'Save 15%' },
  { id: '2500_credits', amount: 2500, price: '$20', discount: 'Save 20%' },
];

export default function PricingPage() {
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (type: 'subscription' | 'credits', id: string) => {
    if (!token) return;
    setLoading(id);
    
    try {
      const endpoint = type === 'subscription' ? '/billing/checkout/subscription' : '/billing/checkout/credits';
      const body = type === 'subscription' ? { tier: id } : { packId: id };

      const { data } = await api.post(endpoint, body);

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to initiate checkout');
      }
    } catch (err) {
      console.error(err);
      alert('Checkout failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <SidebarLayout title="Billing & Quota">
      <div className="max-w-7xl mx-auto px-6 py-10 lg:py-20 font-inter">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-24 gap-12 px-4">
          <div className="max-w-3xl space-y-6">
             <div className="flex items-center gap-3">
                <Sparkles size={20} className="text-foreground" />
                <span className="text-[10px] font-black text-muted uppercase tracking-[0.4em]">Resource_Allocation</span>
             </div>
             <h1 className="text-5xl sm:text-7xl font-black tracking-tighter text-foreground uppercase italic leading-[0.9]">
               Scalable_Units <br /> for_Private_Grids
             </h1>
          </div>
          <p className="text-muted font-bold text-lg max-w-sm leading-tight uppercase opacity-50 tracking-tight">
            Transparent, usage-based infrastructure designed for collective intelligence.
          </p>
        </header>

        {/* Pricing Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-32">
          {tiers.map((tier) => (
            <div 
              key={tier.id}
              className={`relative p-12 rounded-[3rem] border-2 flex flex-col transition-all duration-700 hover:shadow-2xl overflow-hidden group ${
                tier.highlight 
                  ? 'bg-card border-foreground shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] scale-[1.05] z-10' 
                  : 'bg-card border-border/60 hover:border-foreground/30'
              }`}
            >
              {tier.highlight && (
                <div className="absolute top-10 right-10 bg-foreground text-background px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">
                  Recommended_Path
                </div>
              )}

              <div className="mb-12 relative z-10">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-10 shadow-xl border border-border/40 ${tier.highlight ? 'bg-foreground text-background' : 'bg-foreground/5 text-foreground'}`}>
                   {tier.id === 'free' ? <Shield size={28} /> : tier.id === 'pro' ? <Zap size={28} /> : <Star size={28} />}
                </div>
                <h3 className="text-3xl font-black mb-3 tracking-tighter uppercase italic leading-none">{tier.name}</h3>
                <p className="text-[13px] font-bold text-muted mb-10 leading-relaxed uppercase opacity-40">{tier.description}</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-6xl font-black tracking-tighter text-foreground italic">{tier.price}</span>
                  <span className="text-[10px] font-black text-muted uppercase tracking-widest opacity-40 italic">/ cycle</span>
                </div>
              </div>

              <div className="p-10 rounded-[2rem] bg-foreground/5 border border-border/60 mb-12 flex justify-between items-center group-hover:bg-foreground group-hover:text-background transition-all duration-500 relative z-10">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-muted uppercase tracking-[0.3em] mb-3 group-hover:text-background/60">Logic_Units</span>
                  <span className="text-3xl font-black tracking-tighter uppercase">{tier.credits} Cr</span>
                </div>
                <Activity size={32} strokeWidth={3} className="text-foreground/10 group-hover:text-background/20 transition-colors" />
              </div>

              <ul className="space-y-6 mb-16 flex-1 relative z-10">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-foreground/70">
                    <CheckCircle2 size={20} strokeWidth={3} className="text-foreground shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                disabled={user?.tier === tier.id || loading !== null}
                onClick={() => handleCheckout('subscription', tier.id)}
                className={`w-full py-6 rounded-[1.75rem] font-black text-[10px] uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 active:scale-[0.98] relative z-10 ${
                  user?.tier === tier.id
                    ? 'bg-foreground/10 text-muted border border-border/40 cursor-default'
                    : 'bg-foreground text-background hover:scale-[1.02] shadow-2xl shadow-foreground/20'
                }`}
              >
                {loading === tier.id ? (
                  <div className="w-6 h-6 border-4 border-background/20 border-t-background rounded-full animate-spin" />
                ) : user?.tier === tier.id ? 'Session_Active' : tier.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* Credit Packs - Top up */}
        <div className="bg-card text-foreground rounded-[4rem] p-12 md:p-20 relative overflow-hidden group border border-border shadow-2xl">
          <div className="absolute top-0 right-0 p-16 opacity-5 group-hover:opacity-10 transition-all pointer-events-none group-hover:rotate-12 duration-1000">
             <Terminal size={320} strokeWidth={1} />
          </div>
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-20 relative z-10">
            <div className="max-w-xl space-y-10">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-[2.5rem] bg-foreground flex items-center justify-center text-background shadow-2xl shadow-foreground/20">
                  <CreditCard size={36} strokeWidth={1.5} />
                </div>
                <h2 className="text-5xl font-black tracking-tighter uppercase italic leading-none">Quantum_Refill</h2>
              </div>
              <p className="text-xl font-bold text-muted leading-tight uppercase opacity-60">
                Need more execution capacity? Top up with on-demand units that <span className="text-foreground underline decoration-foreground/20 decoration-4 underline-offset-8">never expire</span>.
              </p>
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-muted/60 bg-foreground/5 px-8 py-5 rounded-[2rem] border border-border/60 w-fit">
                <Shield size={20} className="opacity-40" />
                Secure_Stripe_Gateway
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-8 w-full">
              {creditPacks.map((pack) => (
                <button
                  key={pack.id}
                  onClick={() => handleCheckout('credits', pack.id)}
                  disabled={loading !== null}
                  className="group relative flex flex-col items-start p-10 bg-foreground/5 border border-border/60 rounded-[3rem] hover:bg-foreground hover:text-background transition-all duration-700 text-left overflow-hidden shadow-xl"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-foreground/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-1000" />
                  
                  {pack.discount && (
                    <div className="bg-foreground text-background text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-10 relative z-10 group-hover:bg-background group-hover:text-foreground">
                      {pack.discount.toUpperCase()}
                    </div>
                  )}
                  <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em] mb-3 relative z-10 group-hover:text-background/60">Usage_Pack</p>
                  <div className="text-5xl font-black mb-2 tracking-tighter relative z-10 italic">{pack.amount}</div>
                  <div className="text-[11px] font-black text-muted uppercase tracking-widest mb-12 relative z-10 group-hover:text-background/40 italic">Logic_Units</div>
                  
                  <div className="mt-auto pt-8 border-t border-foreground/10 group-hover:border-background/20 w-full flex items-center justify-between relative z-10">
                    <span className="text-3xl font-black italic tracking-tighter">{pack.price}</span>
                    <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center group-hover:bg-background group-hover:text-foreground transition-all duration-500 shadow-xl">
                       <ArrowRight size={22} strokeWidth={3} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
