'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Zap, Star, Shield, Activity, CreditCard, ArrowRight, Sparkles, Terminal } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const tiers = [
  {
    id: 'free',
    name: 'Starter',
    price: '$0',
    description: 'Perfect for individual builders.',
    credits: '100',
    features: ['Basic nodes', 'Standard priority', 'Public access'],
    buttonText: 'Current Plan',
    highlight: false,
    icon: Shield
  },
  {
    id: 'pro',
    name: 'Pro Explorer',
    price: '$19',
    description: 'Production-grade tools for scaling.',
    credits: '1,500',
    features: ['Premium nodes', 'Elevated priority', 'Private storage', 'Unlimited flows'],
    buttonText: 'Initialise_Pro',
    highlight: true,
    icon: Zap
  },
  {
    id: 'ultra',
    name: 'Elite Scale',
    price: '$49',
    description: 'Maximum performance deployments.',
    credits: '5,000',
    features: ['Top-tier priority', 'Dedicated API', 'Team tools', 'Institutional SLA'],
    buttonText: 'Initialise_Elite',
    highlight: false,
    icon: Star
  }
];

const creditPacks = [
  { id: '500_credits', amount: 500, price: '$5', discount: null },
  { id: '1200_credits', amount: 1200, price: '$10', discount: 'Save 15%' },
  { id: '2500_credits', amount: 2500, price: '$20', discount: 'Save 20%' },
];

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState<string | null>(null);
  const [view, setView] = useState<'plans' | 'credits'>('plans');

  const handleCheckout = async (type: 'subscription' | 'credits', id: string) => {
    if (!token) return;
    setLoading(id);
    
    try {
      const endpoint = type === 'subscription' ? '/billing/checkout/subscription' : '/billing/checkout/credits';
      const body = type === 'subscription' ? { tier: id } : { packId: id };

      const { data } = await api.post(endpoint, body);

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-xl"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-6xl max-h-[90vh] bg-card border border-border shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] rounded-[3.5rem] overflow-hidden flex flex-col"
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 p-3 bg-foreground/5 hover:bg-foreground hover:text-background rounded-2xl transition-all z-20"
          >
            <X size={20} strokeWidth={3} />
          </button>

          {/* Header */}
          <div className="p-8 md:p-10 border-b border-border/60 bg-foreground/[0.02] relative shrink-0">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                   <div className="flex items-center gap-3">
                      <Sparkles size={16} className="text-primary" />
                      <span className="text-[9px] font-black text-primary uppercase tracking-[0.4em] italic">System_Expansion</span>
                   </div>
                   <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic leading-none">Upgrade_Protocol</h2>
                   <p className="text-muted font-bold text-[11px] uppercase opacity-50 tracking-widest max-w-md italic">
                      Enhance your processing power and unlock specialized logic nodes.
                   </p>
                </div>

                <div className="flex bg-foreground/5 p-1 rounded-xl">
                   <button 
                     onClick={() => setView('plans')}
                     className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${view === 'plans' ? 'bg-background text-foreground shadow-lg' : 'text-muted hover:text-foreground'}`}
                   >
                     Access_Plans
                   </button>
                   <button 
                     onClick={() => setView('credits')}
                     className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${view === 'credits' ? 'bg-background text-foreground shadow-lg' : 'text-muted hover:text-foreground'}`}
                   >
                     Logic_Units
                   </button>
                </div>
             </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 md:p-10 no-scrollbar">
            {view === 'plans' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {tiers.map((tier) => (
                  <div 
                    key={tier.id}
                    className={`relative p-8 rounded-[2.5rem] border-2 flex flex-col transition-all duration-500 group ${
                      tier.highlight 
                        ? 'border-primary bg-primary/[0.02] shadow-2xl shadow-primary/5' 
                        : 'border-border/60 hover:border-primary/40'
                    }`}
                  >
                    <div className="mb-6 flex justify-between items-start">
                       <div className={`p-4 rounded-xl border border-border/40 ${tier.highlight ? 'bg-primary text-primary-foreground' : 'bg-foreground/5 text-muted'}`}>
                          <tier.icon size={24} strokeWidth={2.5} />
                       </div>
                       {tier.highlight && (
                         <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest italic">Recommended</div>
                       )}
                    </div>

                    <div className="space-y-1 mb-6">
                       <h3 className="text-[9px] font-black text-muted uppercase tracking-[0.3em] italic opacity-40">{tier.name}_Series</h3>
                       <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-black italic tracking-tighter">{tier.price}</span>
                          <span className="text-[9px] font-black text-muted uppercase tracking-widest opacity-40">/ MO</span>
                       </div>
                    </div>

                    <ul className="space-y-3 mb-8 flex-1">
                       {tier.features.map(f => (
                         <li key={f} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-tight text-muted/60 italic">
                           <CheckCircle2 size={14} strokeWidth={3} className="text-primary" />
                           {f}
                         </li>
                       ))}
                    </ul>

                    <button
                      disabled={user?.tier === tier.id || loading !== null}
                      onClick={() => handleCheckout('subscription', tier.id)}
                      className={`w-full py-4 rounded-xl font-black text-[9px] uppercase tracking-[0.3em] transition-all italic flex items-center justify-center gap-2 ${
                        user?.tier === tier.id
                          ? 'bg-foreground/5 text-muted cursor-default'
                          : 'bg-primary text-primary-foreground hover:scale-[1.05] shadow-xl shadow-primary/20'
                      }`}
                    >
                      {loading === tier.id ? (
                        <div className="w-4 h-4 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
                      ) : user?.tier === tier.id ? 'ACTIVE_SESSION' : tier.buttonText}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {creditPacks.map((pack) => (
                   <button
                    key={pack.id}
                    disabled={loading !== null}
                    onClick={() => handleCheckout('credits', pack.id)}
                    className="group relative flex flex-col p-8 bg-foreground/[0.02] border border-border/60 rounded-[2.5rem] hover:bg-foreground hover:text-background transition-all duration-700 text-left overflow-hidden h-fit shadow-lg"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-1000" />
                    
                    {pack.discount && (
                      <div className="bg-primary text-primary-foreground text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-6 relative z-10">
                        {pack.discount}
                      </div>
                    )}
                    
                    <div className="text-[9px] font-black text-muted uppercase tracking-[0.3em] mb-2 relative z-10 group-hover:text-background/60">Logic_Units</div>
                    <div className="text-5xl font-black mb-4 tracking-tighter relative z-10 italic">{pack.amount}</div>
                    
                    <div className="mt-auto pt-6 border-t border-foreground/5 group-hover:border-background/20 w-full flex items-center justify-between relative z-10">
                      <span className="text-3xl font-black italic tracking-tighter">{pack.price}</span>
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center group-hover:bg-background group-hover:text-foreground transition-all duration-500 shadow-xl">
                         <ArrowRight size={20} strokeWidth={3} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="p-6 border-t border-border/60 bg-foreground/[0.01] flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 px-10">
             <div className="flex items-center gap-4 text-[8px] font-black text-muted uppercase tracking-widest italic opacity-40">
                <Shield size={14} /> Secure_Encrypted_Gateway :: Stripe_Protected
             </div>
             <div className="text-[8px] font-black text-muted uppercase tracking-[0.3em] italic opacity-40">
                Protocol: PR-99-ALPHA-UPGRADE
             </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
