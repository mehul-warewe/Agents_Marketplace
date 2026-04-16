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
    <SidebarLayout title="Billing">
      <div className="max-w-7xl mx-auto px-6 py-10 lg:py-16">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20 gap-10 px-4">
          <div className="max-w-3xl space-y-6">
             <h1 className="text-5xl font-bold font-display tracking-tight text-foreground leading-[1.1]">
               Scalable infrastructure for <br /> modern agentic workflows
             </h1>
          </div>
          <p className="text-muted-foreground font-medium text-base max-w-sm leading-relaxed">
            Transparent, usage-based credit system designed for high-performance digital teams.
          </p>
        </header>

        {/* Pricing Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {tiers.map((tier) => (
            <div 
              key={tier.id}
              className={`relative p-10 rounded-3xl border flex flex-col transition-all duration-300 hover:shadow-xl group ${
                tier.highlight 
                  ? 'bg-card border-primary/40 shadow-xl shadow-primary/5 scale-[1.02] z-10' 
                  : 'bg-card border-border/40 hover:border-primary/20'
              }`}
            >
              {tier.highlight && (
                <div className="absolute top-8 right-8 bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-md">
                  Recommended
                </div>
              )}

              <div className="mb-10 relative z-10">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-8 shadow-sm border border-border/40 transition-colors ${tier.highlight ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}>
                   {tier.id === 'free' ? <Shield size={24} /> : tier.id === 'pro' ? <Zap size={24} /> : <Star size={24} />}
                </div>
                <h3 className="text-2xl font-bold font-display mb-2 tracking-tight text-foreground">{tier.name}</h3>
                <p className="text-sm font-medium text-muted-foreground mb-8 leading-relaxed opacity-60">{tier.description}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold font-display tracking-tight text-foreground">{tier.price}</span>
                  <span className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest">/mo</span>
                </div>
              </div>

              <div className="p-8 rounded-2xl bg-secondary border border-border/40 mb-10 flex justify-between items-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-2 group-hover:text-primary-foreground/60">Logic Credits</span>
                  <span className="text-2xl font-bold font-display">{tier.credits} Cr</span>
                </div>
                <Activity size={24} strokeWidth={2.5} className="opacity-20 translate-x-1" />
              </div>

              <ul className="space-y-4 mb-12 flex-1 relative z-10">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                    <Check size={18} strokeWidth={3} className="text-primary shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                disabled={user?.tier === tier.id || loading !== null}
                onClick={() => handleCheckout('subscription', tier.id)}
                className={`w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-3 active:scale-[0.98] relative z-10 ${
                  user?.tier === tier.id
                    ? 'bg-secondary text-muted-foreground border border-border/40 cursor-default'
                    : 'bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20'
                }`}
              >
                {loading === tier.id ? (
                  <div className="w-5 h-5 border-3 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
                ) : user?.tier === tier.id ? 'Active Plan' : tier.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* Credit Packs - Top up */}
        <div className="bg-card text-foreground rounded-3xl p-10 md:p-16 relative overflow-hidden group border border-border/40 shadow-xl">
          <div className="absolute top-0 right-0 p-16 opacity-[0.03] group-hover:opacity-[0.05] transition-all pointer-events-none group-hover:rotate-6 duration-1000">
             <Terminal size={320} strokeWidth={1} />
          </div>
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-16 relative z-10">
            <div className="max-w-xl space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                  <CreditCard size={30} strokeWidth={1.5} />
                </div>
                <h2 className="text-4xl font-bold font-display tracking-tight text-foreground">Credit Recharge</h2>
              </div>
              <p className="text-lg font-medium text-muted-foreground leading-relaxed">
                Need extra execution capacity? Top up with on-demand credits that <span className="text-foreground font-bold">never expire</span>.
              </p>
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 bg-secondary px-6 py-3.5 rounded-xl border border-border/40 w-fit">
                <Shield size={16} className="opacity-40" />
                Secure Payments via Stripe
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
              {creditPacks.map((pack) => (
                <button
                  key={pack.id}
                  onClick={() => handleCheckout('credits', pack.id)}
                  disabled={loading !== null}
                  className="group relative flex flex-col items-start p-8 bg-secondary/40 border border-border/40 rounded-2xl hover:bg-primary transition-all duration-300 text-left overflow-hidden shadow-sm"
                >
                  {pack.discount && (
                    <div className="bg-primary text-primary-foreground text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-8 relative z-10 group-hover:bg-primary-foreground group-hover:text-primary">
                      {pack.discount}
                    </div>
                  )}
                  <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-2 relative z-10 group-hover:text-primary-foreground/60">Top Up</p>
                  <div className="text-4xl font-bold font-display mb-1 tracking-tight relative z-10 group-hover:text-primary-foreground text-foreground">{pack.amount}</div>
                  <div className="text-[11px] font-bold text-muted-foreground/40 uppercase tracking-widest mb-10 relative z-10 group-hover:text-primary-foreground/40">Credits</div>
                  
                  <div className="mt-auto pt-6 border-t border-border/40 group-hover:border-primary-foreground/20 w-full flex items-center justify-between relative z-10">
                    <span className="text-2xl font-bold font-display tracking-tight group-hover:text-primary-foreground">{pack.price}</span>
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center group-hover:bg-primary-foreground group-hover:text-primary transition-all duration-300 shadow-md">
                       <ArrowRight size={18} strokeWidth={2.5} />
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
